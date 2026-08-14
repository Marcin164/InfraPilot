import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SoftwareLicenseService } from 'src/services/softwareLicense.service';
import { NotificationDispatcherService } from 'src/services/notificationDispatcher.service';
import { EVENTS } from 'src/events/events.constants';
import {
  LicenseExpiredEvent,
  LicenseExpiringEvent,
} from 'src/events/license-expiry.event';

@Injectable()
export class LicenseAlertWorker {
  private readonly logger = new Logger(LicenseAlertWorker.name);

  constructor(
    private readonly licenseService: SoftwareLicenseService,
    private readonly dispatcher: NotificationDispatcherService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /** Daily at 08:00 — check for licenses expiring in 30 days and already expired today. */
  @Cron('0 8 * * *')
  async handle() {
    await this.alertExpiringSoon();
    await this.alertExpiredToday();
  }

  private async alertExpiringSoon(): Promise<void> {
    try {
      const licenses = await this.licenseService.findExpiringSoon(30);
      for (const license of licenses) {
        const days = Math.ceil(
          (new Date(license.expiresAt!).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        );
        await this.dispatcher.dispatchOpsAlert({
          event: 'license_expiring',
          title: `License expiring in ${days} day${days === 1 ? '' : 's'}`,
          body: `"${license.name}"${license.publisher ? ` (${license.publisher})` : ''} expires on ${license.expiresAt}.`,
        });
        this.eventEmitter.emit(
          EVENTS.LICENSE_EXPIRING,
          new LicenseExpiringEvent(license.id, new Date(license.expiresAt!), days),
        );
      }
    } catch (err) {
      this.logger.warn(`License expiry alert failed: ${(err as Error).message}`);
    }
  }

  private async alertExpiredToday(): Promise<void> {
    try {
      const licenses = await this.licenseService.findExpiredOn(new Date());
      for (const license of licenses) {
        await this.dispatcher.dispatchOpsAlert({
          event: 'license_expired',
          title: 'License expired today',
          body: `"${license.name}"${license.publisher ? ` (${license.publisher})` : ''} expired on ${license.expiresAt}.`,
        });
        this.eventEmitter.emit(
          EVENTS.LICENSE_EXPIRED,
          new LicenseExpiredEvent(license.id, new Date(license.expiresAt!)),
        );
      }
    } catch (err) {
      this.logger.warn(`License expired alert failed: ${(err as Error).message}`);
    }
  }
}
