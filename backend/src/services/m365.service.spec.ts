import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { M365Service } from './m365.service';
import { AdminSettings } from 'src/entities/adminSettings.entity';
import { Users } from 'src/entities/users.entity';
import { Devices } from 'src/entities/devices.entity';
import { LicenseSource, LicenseType, SoftwareLicense } from 'src/entities/softwareLicense.entity';

jest.mock('src/helpers/crypto', () => ({
  encrypt: jest.fn((v: string) => `gcm:enc:${v}`),
  decrypt: jest.fn((v: string) => v.replace('gcm:enc:', '')),
}));

jest.mock('src/services/softwareLicense.service', () => ({
  invalidateLicenseReports: jest.fn(),
}));

describe('M365Service.syncLicenses', () => {
  let service: M365Service;
  let adminRepo: jest.Mocked<any>;
  let licenseRepo: jest.Mocked<any>;

  const CONFIG_RECORD = {
    key: 'm365_config',
    value: { tenantId: 'tenant-1', clientId: 'client-1', clientSecret: 'gcm:enc:secret' },
  };

  beforeEach(async () => {
    adminRepo = {
      findOne: jest.fn().mockResolvedValue(CONFIG_RECORD),
      save: jest.fn().mockResolvedValue(undefined),
      create: jest.fn((v) => v),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    licenseRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockImplementation((l: any) => Promise.resolve(l)),
      create: jest.fn((v: any) => v),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        M365Service,
        { provide: getRepositoryToken(AdminSettings), useValue: adminRepo },
        { provide: getRepositoryToken(Users), useValue: {} },
        { provide: getRepositoryToken(Devices), useValue: {} },
        { provide: getRepositoryToken(SoftwareLicense), useValue: licenseRepo },
      ],
    }).compile();

    service = module.get<M365Service>(M365Service);

    global.fetch = jest.fn() as any;
  });

  function mockGraphResponses(skus: any[]) {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'tok' }) }) // token
      .mockResolvedValueOnce({ ok: true, json: async () => ({ value: skus }) }); // subscribedSkus
  }

  it('creates a new SoftwareLicense for an unseen enabled SKU', async () => {
    mockGraphResponses([
      {
        id: '1', skuId: 'sku-1', skuPartNumber: 'SPE_E3', capabilityStatus: 'Enabled',
        consumedUnits: 5, prepaidUnits: { enabled: 10, warning: 0, suspended: 0 },
      },
    ]);

    const result = await service.syncLicenses();

    expect(result.created).toBe(1);
    expect(result.synced).toBe(0);
    expect(licenseRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Microsoft 365 E3',
      publisher: 'Microsoft',
      source: LicenseSource.M365,
      externalId: 'sku-1',
      totalSeats: 10,
      consumedSeats: 5,
      licenseType: LicenseType.SUBSCRIPTION,
    }));
    expect(licenseRepo.save).toHaveBeenCalled();
  });

  it('updates the existing license matched by (source, externalId) instead of duplicating', async () => {
    const existing: any = {
      id: 'lic-1', name: 'old name', source: LicenseSource.M365, externalId: 'sku-1',
      totalSeats: 5, consumedSeats: 1,
    };
    licenseRepo.findOne.mockResolvedValue(existing);
    mockGraphResponses([
      {
        id: '1', skuId: 'sku-1', skuPartNumber: 'SPE_E3', capabilityStatus: 'Enabled',
        consumedUnits: 8, prepaidUnits: { enabled: 10, warning: 0, suspended: 0 },
      },
    ]);

    const result = await service.syncLicenses();

    expect(result.synced).toBe(1);
    expect(result.created).toBe(0);
    expect(licenseRepo.create).not.toHaveBeenCalled();
    expect(existing.totalSeats).toBe(10);
    expect(existing.consumedSeats).toBe(8);
    expect(licenseRepo.save).toHaveBeenCalledWith(existing);
  });

  it('skips SKUs that are not Enabled without touching the license table', async () => {
    mockGraphResponses([
      {
        id: '1', skuId: 'sku-2', skuPartNumber: 'SOMETHING', capabilityStatus: 'Suspended',
        consumedUnits: 0, prepaidUnits: { enabled: 5, warning: 0, suspended: 0 },
      },
    ]);

    const result = await service.syncLicenses();

    expect(result.skipped).toBe(1);
    expect(result.created).toBe(0);
    expect(result.synced).toBe(0);
    expect(licenseRepo.save).not.toHaveBeenCalled();
  });

  it('falls back to the raw skuPartNumber when there is no friendly-name mapping', async () => {
    mockGraphResponses([
      {
        id: '1', skuId: 'sku-3', skuPartNumber: 'SOME_UNKNOWN_SKU', capabilityStatus: 'Enabled',
        consumedUnits: 0, prepaidUnits: { enabled: 1, warning: 0, suspended: 0 },
      },
    ]);

    await service.syncLicenses();

    expect(licenseRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'SOME_UNKNOWN_SKU' }),
    );
  });
});
