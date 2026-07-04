import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NodeSSH } from 'node-ssh';
import { NetworkDeviceCredential } from 'src/entities/networkDeviceCredential.entity';
import { IpAllocation, IpAllocationSource, IpAllocationStatus } from 'src/entities/ipAllocation.entity';
import { Subnet } from 'src/entities/subnet.entity';
import { Devices } from 'src/entities/devices.entity';
import { AdminSettings } from 'src/entities/adminSettings.entity';
import { Users } from 'src/entities/users.entity';
import { decrypt } from 'src/helpers/crypto';
import { uuidv4 } from 'src/helpers/uuidv4';
import { isIpInCidr } from 'src/helpers/cidr';
import { compileLeaseTemplate, parseLeaseOutput } from 'src/helpers/leaseTemplate';
import { AuditService } from './audit.service';
import { IpamService } from './ipam.service';
import { NotificationDispatcherService } from './notificationDispatcher.service';
import { invalidateReportCache } from 'src/helpers/reportCache';

const CONFLICTS_SETTINGS_KEY = 'ipam.lastKnownConflicts';

@Injectable()
export class LeaseSyncService {
  private readonly logger = new Logger(LeaseSyncService.name);

  constructor(
    @InjectRepository(NetworkDeviceCredential)
    private readonly credentials: Repository<NetworkDeviceCredential>,
    @InjectRepository(IpAllocation)
    private readonly allocations: Repository<IpAllocation>,
    @InjectRepository(Subnet)
    private readonly subnets: Repository<Subnet>,
    @InjectRepository(Devices)
    private readonly devices: Repository<Devices>,
    @InjectRepository(AdminSettings)
    private readonly adminSettings: Repository<AdminSettings>,
    @InjectRepository(Users)
    private readonly users: Repository<Users>,
    private readonly auditService: AuditService,
    private readonly ipamService: IpamService,
    private readonly dispatcher: NotificationDispatcherService,
  ) {}

  async runSync(deviceId: string, actorId?: string): Promise<{ recordsFound: number }> {
    const device = await this.devices.findOneBy({ id: deviceId });
    if (!device) throw new BadRequestException('Device not found');
    if (!device.managementIp) throw new BadRequestException('Device has no management IP set');

    const cred = await this.credentials.findOneBy({ deviceId });
    if (!cred) throw new BadRequestException('No SSH credential configured for this device');
    if (!cred.leaseSyncCommand || !cred.leaseSyncLineTemplate) {
      throw new BadRequestException('Lease sync command/template not configured for this device');
    }

    const compiled = compileLeaseTemplate(cred.leaseSyncLineTemplate);
    const subnets = await this.subnets.find();

    const ssh = new NodeSSH();
    try {
      await ssh.connect({
        host: device.managementIp,
        username: decrypt(cred.sshUsername),
        password: cred.sshPassword ? decrypt(cred.sshPassword) : undefined,
        port: cred.sshPort,
        readyTimeout: 10000,
      });
      const result = await ssh.execCommand(cred.leaseSyncCommand);
      const records = parseLeaseOutput(result.stdout, compiled);

      const now = new Date();
      for (const record of records) {
        const subnet = subnets.find((s) => isIpInCidr(record.ip, s.cidr));
        let row = await this.allocations.findOne({
          where: { ip: record.ip, source: IpAllocationSource.SYNC },
        });
        if (!row) {
          row = this.allocations.create({ id: uuidv4(), ip: record.ip, source: IpAllocationSource.SYNC });
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

      await this.auditService.log('NETWORK_DEVICE_LEASE_SYNC', deviceId, 'SUCCEEDED', {
        actorId,
        recordsFound: records.length,
      });

      await this.notifyNewConflicts();
      return { recordsFound: records.length };
    } catch (err) {
      const message = (err as Error).message;
      this.logger.warn(`Lease sync failed for device ${deviceId}: ${message}`);
      await this.auditService.log('NETWORK_DEVICE_LEASE_SYNC', deviceId, 'FAILED', {
        actorId,
        error: message,
      });
      throw new BadRequestException(`Lease sync failed: ${message}`);
    } finally {
      ssh.dispose();
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
    const adminIds = await this.getAdminIds();
    if (adminIds.length === 0) return;

    for (const conflict of newConflicts) {
      await this.dispatcher.dispatch({
        recipientIds: adminIds,
        event: 'ip_conflict_detected',
        title: `IP conflict on ${conflict.ip}`,
        body: `Multiple owners claim ${conflict.ip}: ${conflict.owners.map((o) => o.label).join(', ')}.`,
        url: '/admin/ipam',
        entityType: 'IP_ALLOCATION',
        entityId: conflict.ip,
      });
    }
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
