import { Test, TestingModule } from '@nestjs/testing';
import { LicenseSyncWorker } from './licenseSync.worker';
import { M365Service } from 'src/services/m365.service';
import { GoogleWorkspaceService } from 'src/services/googleWorkspace.service';
import { GithubEnterpriseService } from 'src/services/githubEnterprise.service';
import { ZoomService } from 'src/services/zoom.service';
import { DropboxService } from 'src/services/dropbox.service';

describe('LicenseSyncWorker', () => {
  let worker: LicenseSyncWorker;
  let m365Service: jest.Mocked<Partial<M365Service>>;
  let googleService: jest.Mocked<Partial<GoogleWorkspaceService>>;
  let githubService: jest.Mocked<Partial<GithubEnterpriseService>>;
  let zoomService: jest.Mocked<Partial<ZoomService>>;
  let dropboxService: jest.Mocked<Partial<DropboxService>>;

  beforeEach(async () => {
    m365Service = { getPublicConfig: jest.fn(), syncLicenses: jest.fn() };
    googleService = { getPublicConfig: jest.fn(), syncLicenses: jest.fn() };
    githubService = { getPublicConfig: jest.fn(), syncLicenses: jest.fn() };
    zoomService = { getPublicConfig: jest.fn(), syncLicenses: jest.fn() };
    dropboxService = { getPublicConfig: jest.fn(), syncLicenses: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LicenseSyncWorker,
        { provide: M365Service, useValue: m365Service },
        { provide: GoogleWorkspaceService, useValue: googleService },
        { provide: GithubEnterpriseService, useValue: githubService },
        { provide: ZoomService, useValue: zoomService },
        { provide: DropboxService, useValue: dropboxService },
      ],
    }).compile();

    worker = module.get<LicenseSyncWorker>(LicenseSyncWorker);
  });

  it('skips M365 sync silently when not configured', async () => {
    (m365Service.getPublicConfig as jest.Mock).mockResolvedValue({ tenantId: '', clientId: '', hasSecret: false });

    await worker.handle();

    expect(m365Service.syncLicenses).not.toHaveBeenCalled();
  });

  it('runs the M365 license sync when configured', async () => {
    (m365Service.getPublicConfig as jest.Mock).mockResolvedValue({ tenantId: 't', clientId: 'c', hasSecret: true });
    (m365Service.syncLicenses as jest.Mock).mockResolvedValue({ synced: 1, created: 0, skipped: 0, lastSyncAt: 'now' });

    await worker.handle();

    expect(m365Service.syncLicenses).toHaveBeenCalled();
  });

  it('logs and continues instead of throwing when a provider sync fails', async () => {
    (m365Service.getPublicConfig as jest.Mock).mockResolvedValue({ tenantId: 't', clientId: 'c', hasSecret: true });
    (m365Service.syncLicenses as jest.Mock).mockRejectedValue(new Error('Graph down'));

    await expect(worker.handle()).resolves.toBeUndefined();
  });

  it('skips Google Workspace sync silently when not configured', async () => {
    (googleService.getPublicConfig as jest.Mock).mockResolvedValue({ adminEmail: '', hasServiceAccount: false, skus: [] });

    await worker.handle();

    expect(googleService.syncLicenses).not.toHaveBeenCalled();
  });

  it('skips Google Workspace sync when configured but no SKUs are tracked yet', async () => {
    (googleService.getPublicConfig as jest.Mock).mockResolvedValue({ adminEmail: 'a@b.com', hasServiceAccount: true, skus: [] });

    await worker.handle();

    expect(googleService.syncLicenses).not.toHaveBeenCalled();
  });

  it('runs the Google Workspace license sync when fully configured', async () => {
    (googleService.getPublicConfig as jest.Mock).mockResolvedValue({
      adminEmail: 'a@b.com', hasServiceAccount: true, skus: [{ productId: 'p', skuId: 's' }],
    });
    (googleService.syncLicenses as jest.Mock).mockResolvedValue({ synced: 1, created: 0, skipped: 0, lastSyncAt: 'now' });

    await worker.handle();

    expect(googleService.syncLicenses).toHaveBeenCalled();
  });

  it('skips GitHub Enterprise sync silently when not configured', async () => {
    (githubService.getPublicConfig as jest.Mock).mockResolvedValue({ enterpriseSlug: '', hasToken: false });

    await worker.handle();

    expect(githubService.syncLicenses).not.toHaveBeenCalled();
  });

  it('runs the GitHub Enterprise license sync when configured', async () => {
    (githubService.getPublicConfig as jest.Mock).mockResolvedValue({ enterpriseSlug: 'acme', hasToken: true });
    (githubService.syncLicenses as jest.Mock).mockResolvedValue({ synced: 1, created: 0, skipped: 0, lastSyncAt: 'now' });

    await worker.handle();

    expect(githubService.syncLicenses).toHaveBeenCalled();
  });

  it('skips Zoom sync silently when not configured', async () => {
    (zoomService.getPublicConfig as jest.Mock).mockResolvedValue({ accountId: '', clientId: '', hasSecret: false });

    await worker.handle();

    expect(zoomService.syncLicenses).not.toHaveBeenCalled();
  });

  it('runs the Zoom license sync when configured', async () => {
    (zoomService.getPublicConfig as jest.Mock).mockResolvedValue({ accountId: 'a', clientId: 'c', hasSecret: true });
    (zoomService.syncLicenses as jest.Mock).mockResolvedValue({ synced: 1, created: 0, skipped: 0, lastSyncAt: 'now' });

    await worker.handle();

    expect(zoomService.syncLicenses).toHaveBeenCalled();
  });

  it('skips Dropbox sync silently when not configured', async () => {
    (dropboxService.getPublicConfig as jest.Mock).mockResolvedValue({ appKey: '', hasSecret: false, hasRefreshToken: false });

    await worker.handle();

    expect(dropboxService.syncLicenses).not.toHaveBeenCalled();
  });

  it('runs the Dropbox license sync when configured', async () => {
    (dropboxService.getPublicConfig as jest.Mock).mockResolvedValue({ appKey: 'k', hasSecret: true, hasRefreshToken: true });
    (dropboxService.syncLicenses as jest.Mock).mockResolvedValue({ synced: 1, created: 0, skipped: 0, lastSyncAt: 'now' });

    await worker.handle();

    expect(dropboxService.syncLicenses).toHaveBeenCalled();
  });

  it('runs every provider independently even when earlier ones fail', async () => {
    (m365Service.getPublicConfig as jest.Mock).mockResolvedValue({ tenantId: 't', clientId: 'c', hasSecret: true });
    (m365Service.syncLicenses as jest.Mock).mockRejectedValue(new Error('Graph down'));
    (googleService.getPublicConfig as jest.Mock).mockResolvedValue({
      adminEmail: 'a@b.com', hasServiceAccount: true, skus: [{ productId: 'p', skuId: 's' }],
    });
    (googleService.syncLicenses as jest.Mock).mockRejectedValue(new Error('quota exceeded'));
    (githubService.getPublicConfig as jest.Mock).mockResolvedValue({ enterpriseSlug: 'acme', hasToken: true });
    (githubService.syncLicenses as jest.Mock).mockResolvedValue({ synced: 1, created: 0, skipped: 0, lastSyncAt: 'now' });
    (zoomService.getPublicConfig as jest.Mock).mockResolvedValue({ accountId: 'a', clientId: 'c', hasSecret: true });
    (zoomService.syncLicenses as jest.Mock).mockResolvedValue({ synced: 1, created: 0, skipped: 0, lastSyncAt: 'now' });
    (dropboxService.getPublicConfig as jest.Mock).mockResolvedValue({ appKey: 'k', hasSecret: true, hasRefreshToken: true });
    (dropboxService.syncLicenses as jest.Mock).mockResolvedValue({ synced: 1, created: 0, skipped: 0, lastSyncAt: 'now' });

    await worker.handle();

    expect(githubService.syncLicenses).toHaveBeenCalled();
    expect(zoomService.syncLicenses).toHaveBeenCalled();
    expect(dropboxService.syncLicenses).toHaveBeenCalled();
  });
});
