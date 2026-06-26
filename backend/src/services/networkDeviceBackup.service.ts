import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { NodeSSH } from 'node-ssh';
import { NetworkDeviceCredential } from 'src/entities/networkDeviceCredential.entity';
import { NetworkDeviceConfigBackup } from 'src/entities/networkDeviceConfigBackup.entity';
import { Devices } from 'src/entities/devices.entity';
import { Users } from 'src/entities/users.entity';
import { encrypt, decrypt } from 'src/helpers/crypto';
import { uuidv4 } from 'src/helpers/uuidv4';
import { AuditService } from './audit.service';
import { NotificationDispatcherService } from './notificationDispatcher.service';

export type SetCredentialDto = {
  sshUsername: string;
  sshPassword?: string | null;
  sshPort?: number;
  backupCommand: string;
  backupEnabled?: boolean;
};

export type SetLeaseSyncDto = {
  leaseSyncCommand: string;
  leaseSyncLineTemplate: string;
  leaseSyncEnabled?: boolean;
};

export type CredentialPublic = {
  deviceId: string;
  sshUsername: string;
  sshPort: number;
  backupCommand: string;
  backupEnabled: boolean;
  hasPassword: boolean;
  leaseSyncCommand: string | null;
  leaseSyncLineTemplate: string | null;
  leaseSyncEnabled: boolean;
  updatedAt: Date;
} | null;

@Injectable()
export class NetworkDeviceBackupService {
  private readonly logger = new Logger(NetworkDeviceBackupService.name);

  constructor(
    @InjectRepository(NetworkDeviceCredential)
    private readonly credentials: Repository<NetworkDeviceCredential>,
    @InjectRepository(NetworkDeviceConfigBackup)
    private readonly backups: Repository<NetworkDeviceConfigBackup>,
    @InjectRepository(Devices)
    private readonly devices: Repository<Devices>,
    @InjectRepository(Users)
    private readonly users: Repository<Users>,
    private readonly auditService: AuditService,
    private readonly dispatcher: NotificationDispatcherService,
  ) {}

  async getCredentialPublic(deviceId: string): Promise<CredentialPublic> {
    const cred = await this.credentials.findOneBy({ deviceId });
    if (!cred) return null;
    return {
      deviceId: cred.deviceId,
      sshUsername: decrypt(cred.sshUsername),
      sshPort: cred.sshPort,
      backupCommand: cred.backupCommand,
      backupEnabled: cred.backupEnabled,
      hasPassword: !!cred.sshPassword,
      leaseSyncCommand: cred.leaseSyncCommand,
      leaseSyncLineTemplate: cred.leaseSyncLineTemplate,
      leaseSyncEnabled: cred.leaseSyncEnabled,
      updatedAt: cred.updatedAt,
    };
  }

  async setLeaseSync(deviceId: string, dto: SetLeaseSyncDto, actorId?: string): Promise<CredentialPublic> {
    const cred = await this.credentials.findOneBy({ deviceId });
    if (!cred) throw new BadRequestException('Configure an SSH credential for this device first');

    cred.leaseSyncCommand = dto.leaseSyncCommand;
    cred.leaseSyncLineTemplate = dto.leaseSyncLineTemplate;
    cred.leaseSyncEnabled = dto.leaseSyncEnabled ?? false;
    await this.credentials.save(cred);

    await this.auditService.log('NETWORK_DEVICE_CREDENTIAL', deviceId, 'LEASE_SYNC_UPDATED', {
      actorId,
      leaseSyncCommand: cred.leaseSyncCommand,
      leaseSyncEnabled: cred.leaseSyncEnabled,
    });

    return this.getCredentialPublic(deviceId);
  }

  async setCredential(deviceId: string, dto: SetCredentialDto, actorId?: string): Promise<CredentialPublic> {
    const device = await this.devices.findOneBy({ id: deviceId });
    if (!device) throw new BadRequestException('Device not found');

    let cred = await this.credentials.findOneBy({ deviceId });
    if (!cred) {
      cred = this.credentials.create({ id: uuidv4(), deviceId });
    }
    cred.sshUsername = encrypt(dto.sshUsername);
    if (dto.sshPassword) {
      cred.sshPassword = encrypt(dto.sshPassword);
    }
    cred.sshPort = dto.sshPort ?? 22;
    cred.backupCommand = dto.backupCommand;
    cred.backupEnabled = dto.backupEnabled ?? true;
    await this.credentials.save(cred);

    await this.auditService.log('NETWORK_DEVICE_CREDENTIAL', deviceId, 'UPDATED', {
      actorId,
      sshPort: cred.sshPort,
      backupCommand: cred.backupCommand,
      backupEnabled: cred.backupEnabled,
    });

    return this.getCredentialPublic(deviceId);
  }

  async listBackups(deviceId: string): Promise<Omit<NetworkDeviceConfigBackup, 'content'>[]> {
    const rows = await this.backups.find({
      where: { deviceId },
      order: { createdAt: 'DESC' },
    });
    return rows.map(({ content, ...rest }) => rest);
  }

  async getBackup(deviceId: string, backupId: string): Promise<NetworkDeviceConfigBackup> {
    const row = await this.backups.findOneBy({ id: backupId, deviceId });
    if (!row) throw new NotFoundException('Backup not found');
    return row;
  }

  async runBackup(deviceId: string, actorId?: string): Promise<NetworkDeviceConfigBackup> {
    const device = await this.devices.findOneBy({ id: deviceId });
    if (!device) throw new BadRequestException('Device not found');
    if (!device.managementIp) {
      throw new BadRequestException('Device has no management IP set');
    }
    const cred = await this.credentials.findOneBy({ deviceId });
    if (!cred) throw new BadRequestException('No SSH credential configured for this device');

    const ssh = new NodeSSH();
    let row: NetworkDeviceConfigBackup;
    try {
      await ssh.connect({
        host: device.managementIp,
        username: decrypt(cred.sshUsername),
        password: cred.sshPassword ? decrypt(cred.sshPassword) : undefined,
        port: cred.sshPort,
        readyTimeout: 10000,
      });
      const result = await ssh.execCommand(cred.backupCommand);
      if (result.code !== 0 && result.stderr) {
        throw new Error(result.stderr.trim());
      }
      const content = result.stdout;
      const contentHash = crypto.createHash('sha256').update(content).digest('hex');

      const last = await this.backups.findOne({
        where: { deviceId, success: true },
        order: { createdAt: 'DESC' },
      });
      if (last && last.contentHash === contentHash) {
        row = last;
      } else {
        row = this.backups.create({
          id: uuidv4(),
          deviceId,
          content,
          contentHash,
          success: true,
          errorMessage: null,
        });
        await this.backups.save(row);
      }
    } catch (err) {
      const message = (err as Error).message;
      row = this.backups.create({
        id: uuidv4(),
        deviceId,
        content: null,
        contentHash: null,
        success: false,
        errorMessage: message,
      });
      await this.backups.save(row);
      this.logger.warn(`Config backup failed for device ${deviceId}: ${message}`);
      await this.notifyFailure(device, message);
    } finally {
      ssh.dispose();
    }

    await this.auditService.log('NETWORK_DEVICE_CONFIG_BACKUP', deviceId, row.success ? 'SUCCEEDED' : 'FAILED', {
      actorId,
      backupId: row.id,
    });
    return row;
  }

  private async notifyFailure(device: Devices, errorMessage: string) {
    const adminIds = await this.getAdminIds();
    if (adminIds.length === 0) return;
    const name = device.assetName || device.model || device.id;
    await this.dispatcher.dispatch({
      recipientIds: adminIds,
      event: 'config_backup_failed',
      title: `Config backup failed for ${name}`,
      body: `Could not back up the configuration of ${name} (${device.managementIp}): ${errorMessage}`,
      url: `/admin/devices/${device.id}/backup`,
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
