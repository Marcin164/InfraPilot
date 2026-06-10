import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Devices } from './devices.entity';

export enum MaintenanceType {
  SCHEDULED = 'scheduled',
  REPAIR = 'repair',
  INSPECTION = 'inspection',
  UPGRADE = 'upgrade',
  OTHER = 'other',
}

@Entity()
export class Maintenance {
  @PrimaryColumn()
  id: string;

  @Column()
  deviceId: string;

  @ManyToOne(() => Devices, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deviceId' })
  device: Devices;

  @Column({ type: 'enum', enum: MaintenanceType, default: MaintenanceType.OTHER })
  type: MaintenanceType;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  performedBy: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  cost: number;

  @Column({ length: 8, nullable: true })
  currency: string;

  @Column({ type: 'date', nullable: true })
  performedAt: Date;

  @Column({ type: 'date', nullable: true })
  nextDueAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
