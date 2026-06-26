import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { NetworkDeviceCredential } from 'src/entities/networkDeviceCredential.entity';
import { NetworkDeviceBackupService } from 'src/services/networkDeviceBackup.service';

@Injectable()
export class ConfigBackupWorker {
  private readonly logger = new Logger(ConfigBackupWorker.name);

  constructor(
    @InjectRepository(NetworkDeviceCredential)
    private readonly credentials: Repository<NetworkDeviceCredential>,
    private readonly backupService: NetworkDeviceBackupService,
  ) {}

  /** Daily at 02:00 (off-peak) -- back up every device with backups enabled. Sequential, not parallel, to avoid opening many SSH sessions at once. */
  @Cron('0 2 * * *')
  async handle() {
    const credentials = await this.credentials.find({ where: { backupEnabled: true } });
    for (const cred of credentials) {
      try {
        await this.backupService.runBackup(cred.deviceId);
      } catch (err) {
        this.logger.warn(`Config backup failed for device ${cred.deviceId}: ${(err as Error).message}`);
      }
    }
  }
}
