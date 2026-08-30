import {
  Entity,
  Column,
  PrimaryColumn,
  OneToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Devices } from './devices.entity';

/**
 * SSH credential + backup command for one network device. One row per
 * device. Username/password are stored encrypted (see helpers/crypto.ts) --
 * mirrors how the SMTP and Active Directory bind passwords are stored.
 */
@Entity()
export class NetworkDeviceCredential {
  @PrimaryColumn()
  id: string;

  @Column({ unique: true })
  deviceId: string;

  @OneToOne(() => Devices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deviceId' })
  device: Devices;

  @Column({ type: 'text' })
  sshUsername: string;

  @Column({ type: 'text', nullable: true })
  sshPassword: string | null;

  @Column({ type: 'int', default: 22 })
  sshPort: number;

  /** e.g. `show running-config` (Cisco), `/export` (MikroTik) -- vendor varies, admin supplies it. */
  @Column({ type: 'text' })
  backupCommand: string;

  @Column({ default: true })
  backupEnabled: boolean;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
