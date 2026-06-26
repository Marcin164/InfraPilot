import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { NetworkDeviceCredential } from 'src/entities/networkDeviceCredential.entity';
import { LeaseSyncService } from 'src/services/leaseSync.service';

@Injectable()
export class LeaseSyncWorker {
  private readonly logger = new Logger(LeaseSyncWorker.name);

  constructor(
    @InjectRepository(NetworkDeviceCredential)
    private readonly credentials: Repository<NetworkDeviceCredential>,
    private readonly leaseSyncService: LeaseSyncService,
  ) {}

  /** Every 30 minutes -- DHCP/DNS leases churn faster than configs, so sync more often than the daily config backup. */
  @Cron('*/30 * * * *')
  async handle() {
    const credentials = await this.credentials.find({ where: { leaseSyncEnabled: true } });
    for (const cred of credentials) {
      try {
        await this.leaseSyncService.runSync(cred.deviceId);
      } catch (err) {
        this.logger.warn(`Lease sync failed for device ${cred.deviceId}: ${(err as Error).message}`);
      }
    }
  }
}
