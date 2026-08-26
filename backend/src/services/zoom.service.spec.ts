import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ZoomService } from './zoom.service';
import { AdminSettings } from 'src/entities/adminSettings.entity';
import { LicenseSource, LicenseType, SoftwareLicense } from 'src/entities/softwareLicense.entity';

jest.mock('src/helpers/crypto', () => ({
  encrypt: jest.fn((v: string) => `gcm:enc:${v}`),
  decrypt: jest.fn((v: string) => v.replace('gcm:enc:', '')),
}));

jest.mock('src/services/softwareLicense.service', () => ({
  invalidateLicenseReports: jest.fn(),
}));

describe('ZoomService.syncLicenses', () => {
  let service: ZoomService;
  let adminRepo: jest.Mocked<any>;
  let licenseRepo: jest.Mocked<any>;

  const CONFIG_RECORD = {
    key: 'zoom_config',
    value: { accountId: 'acct-1', clientId: 'client-1', clientSecret: 'gcm:enc:secret' },
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
        ZoomService,
        { provide: getRepositoryToken(AdminSettings), useValue: adminRepo },
        { provide: getRepositoryToken(SoftwareLicense), useValue: licenseRepo },
      ],
    }).compile();

    service = module.get<ZoomService>(ZoomService);
    global.fetch = jest.fn() as any;
  });

  function mockTokenThenUsers(userPages: { users: { id: string; type: number }[]; next_page_token?: string }[]) {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'tok' }) });
    for (const page of userPages) {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => page });
    }
  }

  it('counts only type=2 (Licensed) users into a single SoftwareLicense row', async () => {
    mockTokenThenUsers([
      { users: [{ id: 'u1', type: 2 }, { id: 'u2', type: 1 }, { id: 'u3', type: 2 }] },
    ]);

    const result = await service.syncLicenses();

    expect(result.created).toBe(1);
    expect(licenseRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Zoom — Licensed Users',
      publisher: 'Zoom',
      source: LicenseSource.ZOOM,
      externalId: 'licensed-users',
      totalSeats: null,
      consumedSeats: 2,
      licenseType: LicenseType.SUBSCRIPTION,
    }));
  });

  it('paginates through next_page_token to count all licensed users', async () => {
    mockTokenThenUsers([
      { users: [{ id: 'u1', type: 2 }], next_page_token: 'page2' },
      { users: [{ id: 'u2', type: 2 }] },
    ]);

    await service.syncLicenses();

    expect(licenseRepo.create).toHaveBeenCalledWith(expect.objectContaining({ consumedSeats: 2 }));
  });

  it('updates the existing license instead of duplicating it on re-sync', async () => {
    const existing: any = { id: 'lic-1', source: LicenseSource.ZOOM, externalId: 'licensed-users', totalSeats: null, consumedSeats: 5 };
    licenseRepo.findOne.mockResolvedValue(existing);
    mockTokenThenUsers([{ users: [{ id: 'u1', type: 2 }, { id: 'u2', type: 2 }] }]);

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

  it('surfaces a clear error when the OAuth token request fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false, json: async () => ({ reason: 'Invalid client_id or client_secret' }),
    });

    await expect(service.syncLicenses()).rejects.toThrow('Invalid client_id or client_secret');
  });
});
