import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Subnet } from './subnet.entity';
import { Devices } from './devices.entity';

export enum IpAllocationStatus {
  RESERVED = 'reserved',
  ASSIGNED = 'assigned',
  LEASED = 'leased',
}

export enum IpAllocationSource {
  MANUAL = 'manual',
  SYNC = 'sync',
}

/**
 * One row per known IP-to-owner record -- manually reserved/assigned by an
 * admin, or imported by a lease/DNS sync (see leaseSync.service.ts).
 * Deliberately has no DB-level unique constraint on `ip`: two rows
 * claiming the same address is exactly the conflict IpamService.getConflicts()
 * surfaces, not something to block at the schema level.
 */
@Entity()
export class IpAllocation {
  @PrimaryColumn()
  id: string;

  @Index()
  @Column({ nullable: true })
  subnetId: string | null;

  @ManyToOne(() => Subnet, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subnetId' })
  subnet: Subnet;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  ip: string;

  @Column({ type: 'varchar', length: 16 })
  status: IpAllocationStatus;

  @Column({ nullable: true })
  deviceId: string | null;

  @ManyToOne(() => Devices, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'deviceId' })
  device: Devices;

  @Column({ type: 'varchar', length: 256, nullable: true })
  hostname: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  macAddress: string | null;

  @Column({ type: 'varchar', length: 16 })
  source: IpAllocationSource;

  /** Raw expiry text as reported by the source device -- formats vary too much per vendor to normalize (see plan). */
  @Column({ type: 'varchar', length: 64, nullable: true })
  leaseExpiresRaw: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastSeenAt: Date | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
