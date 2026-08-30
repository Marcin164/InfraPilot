import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Devices } from './devices.entity';

export enum DhcpDriverType {
  SSH_SCRAPE = 'ssh_scrape',
}

export enum DhcpSyncStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
}

/**
 * A configured DHCP lease source. Decoupled from `NetworkDeviceCredential`
 * on purpose: not every driver connects over SSH to an inventory device
 * (e.g. a future Kea REST driver talks to a Control Agent URL, not a
 * `Devices` row). `deviceId` stays optional for that reason -- `ssh_scrape`
 * uses it to resolve the existing NetworkDeviceCredential (host/creds),
 * future drivers may leave it null and keep their own connection details in
 * `config`.
 */
@Entity()
export class DhcpServer {
  @PrimaryColumn()
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'enum', enum: DhcpDriverType, default: DhcpDriverType.SSH_SCRAPE })
  driverType: DhcpDriverType;

  @Column({ nullable: true })
  deviceId: string | null;

  @ManyToOne(() => Devices, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deviceId' })
  device: Devices;

  /** Driver-specific, non-secret settings. For `ssh_scrape`: `{ command, lineTemplate }`. */
  @Column({ type: 'jsonb', default: {} })
  config: Record<string, unknown>;

  @Column({ default: false })
  enabled: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastSyncAt: Date | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  lastSyncStatus: DhcpSyncStatus | null;

  @Column({ type: 'text', nullable: true })
  lastSyncError: string | null;

  @Column({ type: 'int', nullable: true })
  lastSyncRecordCount: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
