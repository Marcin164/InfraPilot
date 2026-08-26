import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AdobeService } from './adobe.service';
import { AdminSettings } from 'src/entities/adminSettings.entity';
import { LicenseSource, LicenseType, SoftwareLicense } from 'src/entities/softwareLicense.entity';

jest.mock('src/helpers/crypto', () => ({
  encrypt: jest.fn((v: string) => `gcm:enc:${v}`),
  decrypt: jest.fn((v: string) => v.replace('gcm:enc:', '')),
}));

jest.mock('src/services/softwareLicense.service', () => ({
  invalidateLicenseReports: jest.fn(),
}));

describe('AdobeService.syncLicenses', () => {
  let service: AdobeService;
  let adminRepo: jest.Mocked<any>;
  let licenseRepo: jest.Mocked<any>;

  const CONFIG_RECORD = {
    key: 'adobe_config',
    value: {
      orgId: 'org-1@AdobeOrg',
      clientId: 'client-1',
      clientSecret: 'gcm:enc:secret',
      profiles: [{ groupName: 'All Apps - Marketing', displayName: 'Creative Cloud — Marketing' }],
    },
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
        AdobeService,
        { provide: getRepositoryToken(AdminSettings), useValue: adminRepo },
        { provide: getRepositoryToken(SoftwareLicense), useValue: licenseRepo },
      ],
    }).compile();

    service = module.get<AdobeService>(AdobeService);
    global.fetch = jest.fn() as any;
  });

  function mockTokenThenPages(pages: { users: { email: string; status: string }[]; lastPage: boolean }[]) {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'tok' }) });
    for (const page of pages) {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => page });
    }
  }

  it('creates a new SoftwareLicense counting users in a tracked Product Profile', async () => {
    mockTokenThenPages([
      { users: [{ email: 'a@b.com', status: 'active' }, { email: 'c@d.com', status: 'active' }], lastPage: true },
    ]);

    const result = await service.syncLicenses();

    expect(result.created).toBe(1);
    expect(licenseRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Creative Cloud — Marketing',
      publisher: 'Adobe',
      source: LicenseSource.ADOBE,
      externalId: 'All Apps - Marketing',
      totalSeats: null,
      consumedSeats: 2,
      licenseType: LicenseType.SUBSCRIPTION,
    }));
    const usersCall = (global.fetch as jest.Mock).mock.calls[1];
    expect(usersCall[0]).toContain('/v2/usermanagement/users/org-1%40AdobeOrg/0/All%20Apps%20-%20Marketing');
    expect(usersCall[1].headers['x-api-key']).toBe('client-1');
  });

  it('paginates while lastPage is false', async () => {
    mockTokenThenPages([
      { users: [{ email: 'a@b.com', status: 'active' }], lastPage: false },
      { users: [{ email: 'c@d.com', status: 'active' }], lastPage: true },
    ]);

    await service.syncLicenses();

    expect(licenseRepo.create).toHaveBeenCalledWith(expect.objectContaining({ consumedSeats: 2 }));
  });

  it('updates the existing license instead of duplicating it on re-sync', async () => {
    const existing: any = { id: 'lic-1', source: LicenseSource.ADOBE, externalId: 'All Apps - Marketing', totalSeats: null, consumedSeats: 1 };
    licenseRepo.findOne.mockResolvedValue(existing);
    mockTokenThenPages([{ users: [{ email: 'a@b.com', status: 'active' }, { email: 'c@d.com', status: 'active' }], lastPage: true }]);

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

  it('throws when configured but no profiles are tracked yet', async () => {
    adminRepo.findOne.mockResolvedValue({
      key: 'adobe_config',
      value: { orgId: 'org-1', clientId: 'c', clientSecret: 'gcm:enc:secret', profiles: [] },
    });
    await expect(service.syncLicenses()).rejects.toThrow();
  });

  it('surfaces a clear error when the OAuth token request fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false, status: 401, json: async () => ({ error: 'invalid_client', error_description: 'client credentials are invalid' }),
    });

    await expect(service.syncLicenses()).rejects.toThrow('client credentials are invalid');
  });
});
