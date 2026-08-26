import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DropboxService } from './dropbox.service';
import { AdminSettings } from 'src/entities/adminSettings.entity';
import { LicenseSource, LicenseType, SoftwareLicense } from 'src/entities/softwareLicense.entity';

jest.mock('src/helpers/crypto', () => ({
  encrypt: jest.fn((v: string) => `gcm:enc:${v}`),
  decrypt: jest.fn((v: string) => v.replace('gcm:enc:', '')),
}));

jest.mock('src/services/softwareLicense.service', () => ({
  invalidateLicenseReports: jest.fn(),
}));

describe('DropboxService.syncLicenses', () => {
  let service: DropboxService;
  let adminRepo: jest.Mocked<any>;
  let licenseRepo: jest.Mocked<any>;

  const CONFIG_RECORD = {
    key: 'dropbox_config',
    value: { appKey: 'app-key-1', appSecret: 'gcm:enc:app-secret', refreshToken: 'gcm:enc:refresh-token' },
  };

  beforeEach(async () => {
    adminRepo = {
      findOne: jest.fn().mockResolvedValue(CONFIG_RECORD),
      save: jest.fn().mockResolvedValue(undefined),
      create: jest.fn((v: any) => v),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    licenseRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockImplementation((l: any) => Promise.resolve(l)),
      create: jest.fn((v: any) => v),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DropboxService,
        { provide: getRepositoryToken(AdminSettings), useValue: adminRepo },
        { provide: getRepositoryToken(SoftwareLicense), useValue: licenseRepo },
      ],
    }).compile();

    service = module.get<DropboxService>(DropboxService);
    global.fetch = jest.fn() as any;
  });

  function mockTokenThenMemberPages(pages: { members: { profile: { status: { '.tag': string } } }[]; has_more: boolean; cursor?: string }[]) {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'tok' }) });
    for (const page of pages) {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => page });
    }
  }

  it('counts non-removed members into a single SoftwareLicense row', async () => {
    mockTokenThenMemberPages([
      {
        members: [
          { profile: { status: { '.tag': 'active' } } },
          { profile: { status: { '.tag': 'invited' } } },
          { profile: { status: { '.tag': 'removed' } } },
        ],
        has_more: false,
      },
    ]);

    const result = await service.syncLicenses();

    expect(result.created).toBe(1);
    expect(licenseRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Dropbox — Provisioned Users',
      publisher: 'Dropbox',
      source: LicenseSource.DROPBOX,
      externalId: 'provisioned-users',
      totalSeats: null,
      consumedSeats: 2,
      licenseType: LicenseType.SUBSCRIPTION,
    }));
  });

  it('paginates through has_more/cursor to count all members', async () => {
    mockTokenThenMemberPages([
      { members: [{ profile: { status: { '.tag': 'active' } } }], has_more: true, cursor: 'page2' },
      { members: [{ profile: { status: { '.tag': 'active' } } }], has_more: false },
    ]);

    await service.syncLicenses();

    expect(licenseRepo.create).toHaveBeenCalledWith(expect.objectContaining({ consumedSeats: 2 }));
  });

  it('updates the existing license instead of duplicating it on re-sync', async () => {
    const existing: any = { id: 'lic-1', source: LicenseSource.DROPBOX, externalId: 'provisioned-users', totalSeats: null, consumedSeats: 1 };
    licenseRepo.findOne.mockResolvedValue(existing);
    mockTokenThenMemberPages([
      { members: [{ profile: { status: { '.tag': 'active' } } }, { profile: { status: { '.tag': 'active' } } }], has_more: false },
    ]);

    const result = await service.syncLicenses();

    expect(result.synced).toBe(1);
    expect(result.created).toBe(0);
    expect(licenseRepo.create).not.toHaveBeenCalled();
    expect(existing.consumedSeats).toBe(2);
  });

  it('throws when not configured', async () => {
    adminRepo.findOne.mockResolvedValue(null);
    await expect(service.syncLicenses()).rejects.toThrow('not configured');
  });

  it('surfaces a clear error when the OAuth token refresh fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false, json: async () => ({ error: 'invalid_grant', error_description: 'refresh token is invalid' }),
    });

    await expect(service.syncLicenses()).rejects.toThrow('refresh token is invalid');
  });
});
