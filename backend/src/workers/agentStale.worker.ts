import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FleetService } from 'src/services/fleet.service';
import { NotificationDispatcherService } from 'src/services/notificationDispatcher.service';

@Injectable()
export class AgentStaleWorker {
  private readonly logger = new Logger(AgentStaleWorker.name);

  constructor(
    private readonly fleet: FleetService,
    private readonly dispatcher: NotificationDispatcherService,
  ) {}

  /** Daily at 08:00 — same cadence as LicenseAlertWorker. No dedup: a still-silent
   * agent re-alerts every day for as long as it stays stale, same as license_expiring. */
  @Cron('0 8 * * *')
  async handle() {
    try {
      const devices = await this.fleet.staleAgents();
      for (const device of devices) {
        const name = device.assetName || device.model || device.id;
        const since = device.lastScanAt ?? device.createdAt;
        const days = Math.floor(
          (Date.now() - new Date(since).getTime()) / (1000 * 60 * 60 * 24),
        );
        await this.dispatcher.dispatchOpsAlert({
          event: 'agent_stale',
          title: `${name} has not reported in ${days} day${days === 1 ? '' : 's'}`,
          body: device.lastScanAt
            ? `No scan from "${name}" since ${new Date(device.lastScanAt).toLocaleString()}.`
            : `"${name}" has never sent a scan since it was added.`,
        });
      }
    } catch (err) {
      this.logger.warn(`Stale agent alert failed: ${(err as Error).message}`);
    }
  }
}
