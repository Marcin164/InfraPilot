import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { Devices } from './devices.entity';

/** One row per backup attempt (success or failure) for a network device's config. */
@Entity()
export class NetworkDeviceConfigBackup {
  @PrimaryColumn()
  id: string;

  @Index()
  @Column()
  deviceId: string;

  @ManyToOne(() => Devices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deviceId' })
  device: Devices;

  @Column({ type: 'text', nullable: true })
  content: string | null;

  /** sha256 of `content` -- lets runs that produced no change skip storing a duplicate snapshot. */
  @Column({ type: 'varchar', length: 64, nullable: true })
  contentHash: string | null;

  @Column()
  success: boolean;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
