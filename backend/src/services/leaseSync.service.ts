import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DhcpServer, DhcpSyncStatus } from 'src/entities/dhcpServer.entity';
import { IpAllocation, IpAllocationSource, IpAllocationStatus } from 'src/entities/ipAllocation.entity';
import { Subnet } from 'src/entities/subnet.entity';
import { AdminSettings } from 'src/entities/adminSettings.entity';
import { uuidv4 } from 'src/helpers/uuidv4';
import { isIpInCidr } from 'src/helpers/cidr';
import { DhcpDriverRegistry } from 'src/dhcp/dhcpDriver.registry';
import { AuditService } from './audit.service';
import { IpamService } from './ipam.service';
import { NotificationDispatcherService } from './notificationDispatcher.service';
import { invalidateReportCache } from 'src/helpers/reportCache';

const CONFLICTS_SETTINGS_KEY = 'ipam.lastKnownConflicts';

@Injectable()
export class LeaseSyncService {
  private readonly logger = new Logger(LeaseSyncService.name);

  constructor(
    @InjectRepository(DhcpServer)
    private readonly sources: Repository<DhcpServer>,
    @InjectRepository(IpAllocation)
    private readonly allocations: Repository<IpAllocation>,
    @InjectRepository(Subnet)
    private readonly subnets: Repository<Subnet>,
    @InjectRepository(AdminSettings)
    private readonly adminSettings: Repository<AdminSettings>,
    private readonly driverRegistry: DhcpDriverRegistry,
    private readonly auditService: AuditService,
    private readonly ipamService: IpamService,
    private readonly dispatcher: NotificationDispatcherService,
  ) {}

  async runSync(sourceId: string, actorId?: string): Promise<{ recordsFound: number }> {
    const source = await this.sources.findOneBy({ id: sourceId });
    if (!source) throw new BadRequestException('DHCP server not found');

    const driver = this.driverRegistry.getDriver(source.driverType);
    const subnets = await this.subnets.find();

    try {
      const records = await driver.fetchLeases(source);

      const now = new Date();
      for (const record of records) {
        const subnet = subnets.find((s) => isIpInCidr(record.ip, s.cidr));
        let row = await this.allocations.findOne({
          where: { ip: record.ip, dhcpServerId: source.id },
        });
        if (!row) {
          row = this.allocations.create({
            id: uuidv4(),
            ip: record.ip,
            source: IpAllocationSource.SYNC,
            dhcpServerId: source.id,
          });
        }
        row.subnetId = subnet?.id ?? null;
        row.status = IpAllocationStatus.LEASED;
        row.macAddress = record.mac ?? row.macAddress ?? null;
        row.hostname = record.hostname ?? row.hostname ?? null;
        row.leaseExpiresRaw = record.expiry ?? null;
        row.lastSeenAt = now;
        await this.allocations.save(row);
      }

      invalidateReportCache('ipam-conflicts');
      invalidateReportCache('ipam-subnet-utilization');

      source.lastSyncAt = now;
      source.lastSyncStatus = DhcpSyncStatus.SUCCESS;
      source.lastSyncError = null;
      source.lastSyncRecordCount = records.length;
      await this.sources.save(source);

      await this.auditService.log('DHCP_SERVER_LEASE_SYNC', sourceId, 'SUCCEEDED', {
        actorId,
        deviceId: source.deviceId,
        recordsFound: records.length,
      });

      await this.notifyNewConflicts();
      return { recordsFound: records.length };
    } catch (err) {
      const message = (err as Error).message;
      this.logger.warn(`Lease sync failed for DHCP server ${sourceId}: ${message}`);

      source.lastSyncAt = new Date();
      source.lastSyncStatus = DhcpSyncStatus.FAILED;
      source.lastSyncError = message;
      await this.sources.save(source);

      await this.auditService.log('DHCP_SERVER_LEASE_SYNC', sourceId, 'FAILED', {
        actorId,
        deviceId: source.deviceId,
        error: message,
      });
      await this.notifySyncFailed(source, message);
      throw new BadRequestException(`Lease sync failed: ${message}`);
    }
  }

  private async notifySyncFailed(source: DhcpServer, message: string): Promise<void> {
    try {
      await this.dispatcher.dispatchOpsAlert({
        event: 'dhcp_sync_failed',
        title: `DHCP lease sync failed: ${source.name}`,
        body: `Lease sync for DHCP server "${source.name}" failed: ${message}`,
      });
    } catch (err) {
      this.logger.warn(`Failed to dispatch dhcp_sync_failed alert for source ${source.id}: ${(err as Error).message}`);
    }
  }

  /** Notifies admins only about conflicts that weren't already known as of the last sync, to avoid re-alerting every cycle. */
  private async notifyNewConflicts(): Promise<void> {
    const conflicts = await this.ipamService.getConflicts();
    const currentIps = new Set(conflicts.map((c) => c.ip));

    const settingRow = await this.adminSettings.findOne({ where: { key: CONFLICTS_SETTINGS_KEY } });
    const previousIps = new Set<string>((settingRow?.value as string[]) ?? []);

    const newConflicts = conflicts.filter((c) => !previousIps.has(c.ip));

    if (settingRow) {
      settingRow.value = Array.from(currentIps);
      await this.adminSettings.save(settingRow);
    } else {
      await this.adminSettings.insert({
        id: uuidv4(),
        key: CONFLICTS_SETTINGS_KEY,
        value: Array.from(currentIps),
      });
    }

    if (newConflicts.length === 0) return;

    for (const conflict of newConflicts) {
      await this.dispatcher.dispatchOpsAlert({
        event: 'ip_conflict_detected',
        title: `IP conflict on ${conflict.ip}`,
        body: `Multiple owners claim ${conflict.ip}: ${conflict.owners.map((o) => o.label).join(', ')}.`,
      });
    }
  }
}
