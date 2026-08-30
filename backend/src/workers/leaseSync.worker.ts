import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { DhcpServer } from 'src/entities/dhcpServer.entity';
import { LeaseSyncService } from 'src/services/leaseSync.service';

@Injectable()
export class LeaseSyncWorker {
  private readonly logger = new Logger(LeaseSyncWorker.name);

  constructor(
    @InjectRepository(DhcpServer)
    private readonly sources: Repository<DhcpServer>,
    private readonly leaseSyncService: LeaseSyncService,
  ) {}

  /** Every 30 minutes -- DHCP/DNS leases churn faster than configs, so sync more often than the daily config backup. */
  @Cron('*/30 * * * *')
  async handle() {
    const sources = await this.sources.find({ where: { enabled: true } });
    for (const source of sources) {
      try {
        await this.leaseSyncService.runSync(source.id);
      } catch (err) {
        this.logger.warn(`Lease sync failed for DHCP server ${source.id}: ${(err as Error).message}`);
      }
    }
  }
}
