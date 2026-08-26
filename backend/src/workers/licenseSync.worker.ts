import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { M365Service } from 'src/services/m365.service';
import { GoogleWorkspaceService } from 'src/services/googleWorkspace.service';

@Injectable()
export class LicenseSyncWorker {
  private readonly logger = new Logger(LicenseSyncWorker.name);

  constructor(
    private readonly m365Service: M365Service,
    private readonly googleService: GoogleWorkspaceService,
  ) {}

  /** Daily at 06:00 — before the 08:00 expiry alert worker, so alerts see fresh seat data. */
  @Cron('0 6 * * *')
  async handle() {
    await this.syncProvider('M365', async () => {
      const cfg = await this.m365Service.getPublicConfig();
      if (!cfg?.hasSecret) return; // not configured — skip silently, not a warning
      await this.m365Service.syncLicenses();
    });

    await this.syncProvider('Google Workspace', async () => {
      const cfg = await this.googleService.getPublicConfig();
      if (!cfg?.hasServiceAccount || cfg.skus.length === 0) return; // not configured — skip silently
      await this.googleService.syncLicenses();
    });
  }

  private async syncProvider(name: string, run: () => Promise<void>): Promise<void> {
    try {
      await run();
    } catch (err) {
      this.logger.warn(`License sync failed for ${name}: ${(err as Error).message}`);
    }
  }
}
