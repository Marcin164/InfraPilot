import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GithubEnterpriseService } from './githubEnterprise.service';
import { AdminSettings } from 'src/entities/adminSettings.entity';
import { LicenseSource, LicenseType, SoftwareLicense } from 'src/entities/softwareLicense.entity';

jest.mock('src/helpers/crypto', () => ({
  encrypt: jest.fn((v: string) => `gcm:enc:${v}`),
  decrypt: jest.fn((v: string) => v.replace('gcm:enc:', '')),
}));

jest.mock('src/services/softwareLicense.service', () => ({
  invalidateLicenseReports: jest.fn(),
}));

describe('GithubEnterpriseService.syncLicenses', () => {
  let service: GithubEnterpriseService;
  let adminRepo: jest.Mocked<any>;
  let licenseRepo: jest.Mocked<any>;

  const CONFIG_RECORD = {
    key: 'github_config',
    value: { enterpriseSlug: 'my-enterprise', token: 'gcm:enc:ghp_faketoken' },
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
        GithubEnterpriseService,
        { provide: getRepositoryToken(AdminSettings), useValue: adminRepo },
        { provide: getRepositoryToken(SoftwareLicense), useValue: licenseRepo },
      ],
    }).compile();

    service = module.get<GithubEnterpriseService>(GithubEnterpriseService);
    global.fetch = jest.fn() as any;
  });

  it('creates a single SoftwareLicense row from the aggregate consumed-licenses response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ total_seats_purchased: 100, total_seats_consumed: 62 }),
    });

    const result = await service.syncLicenses();

    expect(result.created).toBe(1);
    expect(result.synced).toBe(0);
    expect(licenseRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      name: 'GitHub Enterprise',
      publisher: 'GitHub',
      source: LicenseSource.GITHUB,
      externalId: 'enterprise-seats',
      totalSeats: 100,
      consumedSeats: 62,
      licenseType: LicenseType.SUBSCRIPTION,
    }));
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.github.com/enterprises/my-enterprise/consumed-licenses',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer ghp_faketoken' }) }),
    );
  });

  it('updates the existing license instead of duplicating it on re-sync', async () => {
    const existing: any = { id: 'lic-1', source: LicenseSource.GITHUB, externalId: 'enterprise-seats', totalSeats: 100, consumedSeats: 60 };
    licenseRepo.findOne.mockResolvedValue(existing);
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ total_seats_purchased: 110, total_seats_consumed: 70 }),
    });

    const result = await service.syncLicenses();

    expect(result.synced).toBe(1);
    expect(result.created).toBe(0);
    expect(licenseRepo.create).not.toHaveBeenCalled();
    expect(existing.totalSeats).toBe(110);
    expect(existing.consumedSeats).toBe(70);
  });

  it('throws when not configured', async () => {
    adminRepo.findOne.mockResolvedValue(null);
    await expect(service.syncLicenses()).rejects.toThrow('not configured');
  });

  it('surfaces the raw GitHub error on a failed request', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false, status: 401, text: async () => '{"message":"Bad credentials"}',
    });

    await expect(service.syncLicenses()).rejects.toThrow('GitHub 401');
  });
});
