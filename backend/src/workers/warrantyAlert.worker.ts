import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { Devices } from 'src/entities/devices.entity';
import { NotificationDispatcherService } from 'src/services/notificationDispatcher.service';

@Injectable()
export class WarrantyAlertWorker {
  private readonly logger = new Logger(WarrantyAlertWorker.name);

  constructor(
    @InjectRepository(Devices)
    private readonly devices: Repository<Devices>,
    private readonly dispatcher: NotificationDispatcherService,
  ) {}

  /** Daily at 08:15 — check for warranties expiring in 30 days. */
  @Cron('15 8 * * *')
  async handle() {
    try {
      const now = new Date();
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + 30);

      const nowStr = now.toISOString().slice(0, 10);
      const cutoffStr = cutoff.toISOString().slice(0, 10);

      const expiring = await this.devices
        .createQueryBuilder('d')
        .where('d.warrantyEnd IS NOT NULL')
        .andWhere('d.warrantyEnd > :now', { now: nowStr })
        .andWhere('d.warrantyEnd <= :cutoff', { cutoff: cutoffStr })
        .getMany();

      for (const device of expiring) {
        const days = Math.ceil(
          (new Date(device.warrantyEnd!).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        );
        const name = device.assetName ?? device.serialNumber ?? device.id;
        await this.dispatcher.dispatchOpsAlert({
          event: 'warranty_expiring',
          title: `Warranty expiring in ${days} day${days === 1 ? '' : 's'}`,
          body: `Device "${name}" warranty expires on ${device.warrantyEnd}.`,
        });
      }
    } catch (err) {
      this.logger.warn(`Warranty alert failed: ${(err as Error).message}`);
    }
  }
}
