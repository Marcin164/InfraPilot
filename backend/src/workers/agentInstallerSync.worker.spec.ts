import { Test, TestingModule } from '@nestjs/testing';
import { AgentInstallerSyncWorker } from './agentInstallerSync.worker';
import { AgentInstallerService } from 'src/services/agent-installer.service';

describe('AgentInstallerSyncWorker', () => {
  let worker: AgentInstallerSyncWorker;
  let service: jest.Mocked<any>;

  beforeEach(async () => {
    service = { syncFromGitHubReleases: jest.fn().mockResolvedValue({ updated: false }) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentInstallerSyncWorker,
        { provide: AgentInstallerService, useValue: service },
      ],
    }).compile();

    worker = module.get<AgentInstallerSyncWorker>(AgentInstallerSyncWorker);
  });

  it('syncs both windows and macos on each sweep', async () => {
    await worker.sweep();

    expect(service.syncFromGitHubReleases).toHaveBeenCalledWith('windows');
    expect(service.syncFromGitHubReleases).toHaveBeenCalledWith('macos');
    expect(service.syncFromGitHubReleases).toHaveBeenCalledTimes(2);
  });

  it('does not let one platform failing stop the other from being tried', async () => {
    service.syncFromGitHubReleases.mockImplementation(async (platform: string) => {
      if (platform === 'windows') throw new Error('GitHub 500');
      return { updated: true };
    });

    await expect(worker.sweep()).resolves.not.toThrow();
    expect(service.syncFromGitHubReleases).toHaveBeenCalledWith('macos');
  });

  it('does not throw when both platforms fail', async () => {
    service.syncFromGitHubReleases.mockRejectedValue(new Error('network down'));
    await expect(worker.sweep()).resolves.not.toThrow();
  });
});
