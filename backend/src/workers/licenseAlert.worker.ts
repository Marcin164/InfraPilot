import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SoftwareLicenseService } from 'src/services/softwareLicense.service';
import { NotificationDispatcherService } from 'src/services/notificationDispatcher.service';
import { Users } from 'src/entities/users.entity';
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
    @InjectRepository(Users)
    private readonly users: Repository<Users>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /** Daily at 08:00 — check for licenses expiring in 30 days and already expired today. */
  @Cron('0 8 * * *')
  async handle() {
    const adminIds = await this.getAdminIds();
    if (adminIds.length === 0) return;

    await this.alertExpiringSoon(adminIds);
    await this.alertExpiredToday(adminIds);
  }

  private async getAdminIds(): Promise<string[]> {
    const admins = await this.users
      .createQueryBuilder('u')
      .select('u.id')
      .where('u.isAdmin = true')
      .andWhere('u.erasedAt IS NULL')
      .getMany();
    return admins.map((u) => u.id);
  }

  private async alertExpiringSoon(adminIds: string[]): Promise<void> {
    try {
      const licenses = await this.licenseService.findExpiringSoon(30);
      for (const license of licenses) {
        const days = Math.ceil(
          (new Date(license.expiresAt!).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        );
        await this.dispatcher.dispatch({
          recipientIds: adminIds,
          event: 'license_expiring',
          title: `License expiring in ${days} day${days === 1 ? '' : 's'}`,
          body: `"${license.name}"${license.publisher ? ` (${license.publisher})` : ''} expires on ${license.expiresAt}.`,
          url: '/admin/licenses',
          entityType: 'SOFTWARE_LICENSE',
          entityId: license.id,
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

  private async alertExpiredToday(adminIds: string[]): Promise<void> {
    try {
      const licenses = await this.licenseService.findExpiredOn(new Date());
      for (const license of licenses) {
        await this.dispatcher.dispatch({
          recipientIds: adminIds,
          event: 'license_expired',
          title: 'License expired today',
          body: `"${license.name}"${license.publisher ? ` (${license.publisher})` : ''} expired on ${license.expiresAt}.`,
          url: '/admin/licenses',
          entityType: 'SOFTWARE_LICENSE',
          entityId: license.id,
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
