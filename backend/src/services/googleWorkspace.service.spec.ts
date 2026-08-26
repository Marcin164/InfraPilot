import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GoogleWorkspaceService } from './googleWorkspace.service';
import { AdminSettings } from 'src/entities/adminSettings.entity';
import { LicenseSource, LicenseType, SoftwareLicense } from 'src/entities/softwareLicense.entity';

const mockAuthorize = jest.fn().mockResolvedValue(undefined);
const mockRequest = jest.fn();

jest.mock('google-auth-library', () => ({
  JWT: jest.fn().mockImplementation(() => ({ authorize: mockAuthorize, request: mockRequest })),
}));

jest.mock('src/helpers/crypto', () => ({
  encrypt: jest.fn((v: string) => `gcm:enc:${v}`),
  decrypt: jest.fn((v: string) => v.replace('gcm:enc:', '')),
}));

jest.mock('src/services/softwareLicense.service', () => ({
  invalidateLicenseReports: jest.fn(),
}));

describe('GoogleWorkspaceService.syncLicenses', () => {
  let service: GoogleWorkspaceService;
  let adminRepo: jest.Mocked<any>;
  let licenseRepo: jest.Mocked<any>;

  const SERVICE_ACCOUNT_JSON = JSON.stringify({
    client_email: 'sa@project.iam.gserviceaccount.com',
    private_key: 'fake-key',
  });

  const CONFIG_RECORD = {
    key: 'google_config',
    value: {
      adminEmail: 'admin@example.com',
      serviceAccountJson: `gcm:enc:${SERVICE_ACCOUNT_JSON}`,
      skus: [{ productId: 'Google-Apps', skuId: '1010020025', displayName: 'Business Standard' }],
    },
  };

  beforeEach(async () => {
    mockAuthorize.mockClear().mockResolvedValue(undefined);
    mockRequest.mockReset();

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
        GoogleWorkspaceService,
        { provide: getRepositoryToken(AdminSettings), useValue: adminRepo },
        { provide: getRepositoryToken(SoftwareLicense), useValue: licenseRepo },
      ],
    }).compile();

    service = module.get<GoogleWorkspaceService>(GoogleWorkspaceService);
  });

  it('creates a new SoftwareLicense counting assigned users for a tracked SKU', async () => {
    mockRequest.mockResolvedValueOnce({ data: { items: [{ userId: 'u1' }, { userId: 'u2' }] } });

    const result = await service.syncLicenses();

    expect(result.created).toBe(1);
    expect(result.synced).toBe(0);
    expect(licenseRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Business Standard',
      publisher: 'Google',
      source: LicenseSource.GOOGLE,
      externalId: 'Google-Apps:1010020025',
      totalSeats: null,
      consumedSeats: 2,
      licenseType: LicenseType.SUBSCRIPTION,
    }));
    expect(licenseRepo.save).toHaveBeenCalled();
  });

  it('updates the existing license matched by (source, externalId) instead of duplicating', async () => {
    const existing: any = {
      id: 'lic-1', source: LicenseSource.GOOGLE, externalId: 'Google-Apps:1010020025',
      consumedSeats: 1, totalSeats: null,
    };
    licenseRepo.findOne.mockResolvedValue(existing);
    mockRequest.mockResolvedValueOnce({ data: { items: [{ userId: 'u1' }, { userId: 'u2' }, { userId: 'u3' }] } });

    const result = await service.syncLicenses();

    expect(result.synced).toBe(1);
    expect(result.created).toBe(0);
    expect(licenseRepo.create).not.toHaveBeenCalled();
    expect(existing.consumedSeats).toBe(3);
    expect(licenseRepo.save).toHaveBeenCalledWith(existing);
  });

  it('paginates through nextPageToken to count all assigned users', async () => {
    mockRequest
      .mockResolvedValueOnce({ data: { items: [{ userId: 'u1' }], nextPageToken: 'page2' } })
      .mockResolvedValueOnce({ data: { items: [{ userId: 'u2' }] } });

    await service.syncLicenses();

    expect(mockRequest).toHaveBeenCalledTimes(2);
    expect(licenseRepo.create).toHaveBeenCalledWith(expect.objectContaining({ consumedSeats: 2 }));
  });

  it('throws when not configured', async () => {
    adminRepo.findOne.mockResolvedValue(null);
    await expect(service.syncLicenses()).rejects.toThrow('not configured');
  });

  it('throws when configured but no SKUs are tracked yet', async () => {
    adminRepo.findOne.mockResolvedValue({
      key: 'google_config',
      value: { adminEmail: 'admin@example.com', serviceAccountJson: 'gcm:enc:{}', skus: [] },
    });
    await expect(service.syncLicenses()).rejects.toThrow();
  });
});
