import { Test, TestingModule } from '@nestjs/testing';
import { LicenseSyncWorker } from './licenseSync.worker';
import { M365Service } from 'src/services/m365.service';
import { GoogleWorkspaceService } from 'src/services/googleWorkspace.service';

describe('LicenseSyncWorker', () => {
  let worker: LicenseSyncWorker;
  let m365Service: jest.Mocked<Partial<M365Service>>;
  let googleService: jest.Mocked<Partial<GoogleWorkspaceService>>;

  beforeEach(async () => {
    m365Service = {
      getPublicConfig: jest.fn(),
      syncLicenses: jest.fn(),
    };
    googleService = {
      getPublicConfig: jest.fn(),
      syncLicenses: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LicenseSyncWorker,
        { provide: M365Service, useValue: m365Service },
        { provide: GoogleWorkspaceService, useValue: googleService },
      ],
    }).compile();

    worker = module.get<LicenseSyncWorker>(LicenseSyncWorker);
  });

  it('skips M365 sync silently when not configured', async () => {
    (m365Service.getPublicConfig as jest.Mock).mockResolvedValue({ tenantId: '', clientId: '', hasSecret: false });
    (googleService.getPublicConfig as jest.Mock).mockResolvedValue(null);

    await worker.handle();

    expect(m365Service.syncLicenses).not.toHaveBeenCalled();
  });

  it('runs the M365 license sync when configured', async () => {
    (m365Service.getPublicConfig as jest.Mock).mockResolvedValue({ tenantId: 't', clientId: 'c', hasSecret: true });
    (m365Service.syncLicenses as jest.Mock).mockResolvedValue({ synced: 1, created: 0, skipped: 0, lastSyncAt: 'now' });
    (googleService.getPublicConfig as jest.Mock).mockResolvedValue(null);

    await worker.handle();

    expect(m365Service.syncLicenses).toHaveBeenCalled();
  });

  it('logs and continues instead of throwing when a provider sync fails', async () => {
    (m365Service.getPublicConfig as jest.Mock).mockResolvedValue({ tenantId: 't', clientId: 'c', hasSecret: true });
    (m365Service.syncLicenses as jest.Mock).mockRejectedValue(new Error('Graph down'));
    (googleService.getPublicConfig as jest.Mock).mockResolvedValue(null);

    await expect(worker.handle()).resolves.toBeUndefined();
  });

  it('skips Google Workspace sync silently when not configured', async () => {
    (m365Service.getPublicConfig as jest.Mock).mockResolvedValue(null);
    (googleService.getPublicConfig as jest.Mock).mockResolvedValue({ adminEmail: '', hasServiceAccount: false, skus: [] });

    await worker.handle();

    expect(googleService.syncLicenses).not.toHaveBeenCalled();
  });

  it('skips Google Workspace sync when configured but no SKUs are tracked yet', async () => {
    (m365Service.getPublicConfig as jest.Mock).mockResolvedValue(null);
    (googleService.getPublicConfig as jest.Mock).mockResolvedValue({ adminEmail: 'a@b.com', hasServiceAccount: true, skus: [] });

    await worker.handle();

    expect(googleService.syncLicenses).not.toHaveBeenCalled();
  });

  it('runs the Google Workspace license sync when fully configured', async () => {
    (m365Service.getPublicConfig as jest.Mock).mockResolvedValue(null);
    (googleService.getPublicConfig as jest.Mock).mockResolvedValue({
      adminEmail: 'a@b.com', hasServiceAccount: true, skus: [{ productId: 'p', skuId: 's' }],
    });
    (googleService.syncLicenses as jest.Mock).mockResolvedValue({ synced: 1, created: 0, skipped: 0, lastSyncAt: 'now' });

    await worker.handle();

    expect(googleService.syncLicenses).toHaveBeenCalled();
  });

  it('still runs Google Workspace sync when M365 sync fails first', async () => {
    (m365Service.getPublicConfig as jest.Mock).mockResolvedValue({ tenantId: 't', clientId: 'c', hasSecret: true });
    (m365Service.syncLicenses as jest.Mock).mockRejectedValue(new Error('Graph down'));
    (googleService.getPublicConfig as jest.Mock).mockResolvedValue({
      adminEmail: 'a@b.com', hasServiceAccount: true, skus: [{ productId: 'p', skuId: 's' }],
    });
    (googleService.syncLicenses as jest.Mock).mockResolvedValue({ synced: 1, created: 0, skipped: 0, lastSyncAt: 'now' });

    await worker.handle();

    expect(googleService.syncLicenses).toHaveBeenCalled();
  });
});
