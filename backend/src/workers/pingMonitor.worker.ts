import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as ping from 'ping';
import { Devices } from 'src/entities/devices.entity';
import { Users } from 'src/entities/users.entity';
import { NotificationDispatcherService } from 'src/services/notificationDispatcher.service';

/** Confirmed transitions only after this many consecutive opposite results -- absorbs a single dropped packet without flapping the status. */
const CONFIRM_THRESHOLD = 2;

@Injectable()
export class PingMonitorWorker {
  private readonly logger = new Logger(PingMonitorWorker.name);

  constructor(
    @InjectRepository(Devices)
    private readonly devices: Repository<Devices>,
    @InjectRepository(Users)
    private readonly users: Repository<Users>,
    private readonly dispatcher: NotificationDispatcherService,
  ) {}

  /** Every 5 minutes -- ping every device that has a management IP set. */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handle() {
    const targets = await this.devices
      .createQueryBuilder('d')
      .where('d.managementIp IS NOT NULL')
      .getMany();

    for (const device of targets) {
      try {
        await this.checkOne(device);
      } catch (err) {
        this.logger.warn(`Ping check failed for ${device.id}: ${(err as Error).message}`);
      }
    }
  }

  private async checkOne(device: Devices) {
    const result = await ping.promise.probe(device.managementIp!, { timeout: 2 });
    const alive = !!result.alive;
    const now = new Date();

    const consecutiveFailures = alive ? 0 : device.consecutiveFailures + 1;
    const consecutiveSuccesses = alive ? device.consecutiveSuccesses + 1 : 0;

    let pingStatus = device.pingStatus;
    let statusChanged = false;

    if (!alive && pingStatus !== 'down' && consecutiveFailures >= CONFIRM_THRESHOLD) {
      pingStatus = 'down';
      statusChanged = true;
    } else if (alive && pingStatus !== 'up' && consecutiveSuccesses >= CONFIRM_THRESHOLD) {
      pingStatus = 'up';
      statusChanged = true;
    }

    await this.devices.update(
      { id: device.id },
      {
        pingStatus,
        lastPingAt: now,
        consecutiveFailures,
        consecutiveSuccesses,
        ...(statusChanged ? { lastStatusChangeAt: now } : {}),
      },
    );

    if (statusChanged) {
      await this.notifyStatusChange(device, pingStatus as 'up' | 'down');
    }
  }

  private async notifyStatusChange(device: Devices, status: 'up' | 'down') {
    const adminIds = await this.getAdminIds();
    if (adminIds.length === 0) return;

    const name = device.assetName || device.model || device.id;
    await this.dispatcher.dispatch({
      recipientIds: adminIds,
      event: 'device_down',
      title: status === 'down' ? `${name} is unreachable` : `${name} is back online`,
      body:
        status === 'down'
          ? `No response from ${device.managementIp} (${name}).`
          : `${name} (${device.managementIp}) is responding to ping again.`,
      url: `/admin/devices/${device.id}/overview`,
      entityType: 'DEVICE',
      entityId: device.id,
    });
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
}
