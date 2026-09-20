import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AgentInstallerService } from 'src/services/agent-installer.service';

/**
 * Automatic counterpart to the (removed, for windows/macos) manual
 * installer upload button -- polls the private GitHub repo's latest
 * release and self-hosts a new windows/macos installer when one appears.
 * See AgentInstallerService.syncFromGitHubReleases() for why this has to
 * be the backend pulling rather than the target host.
 *
 * Releases are infrequent, so an hourly check is plenty responsive; an
 * admin who doesn't want to wait can use "Synchronizuj teraz" in Settings
 * (POST /devices/agent/installer/sync) instead of waiting for this.
 */
@Injectable()
export class AgentInstallerSyncWorker {
  private readonly logger = new Logger(AgentInstallerSyncWorker.name);

  constructor(private readonly installerService: AgentInstallerService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async sweep() {
    for (const platform of ['windows', 'macos'] as const) {
      try {
        const { updated } = await this.installerService.syncFromGitHubReleases(platform);
        if (updated) {
          this.logger.log(`${platform} installer updated from GitHub Releases`);
        }
      } catch (err) {
        this.logger.warn(`${platform} installer sync failed: ${(err as Error).message}`);
      }
    }
  }
}
