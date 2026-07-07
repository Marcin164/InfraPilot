import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum DeviceEnrollmentTokenStatus {
  PENDING = 'pending',
  USED = 'used',
  REVOKED = 'revoked',
}

/**
 * A one-time, per-install enrollment token. Replaces the single fleet-wide
 * AGENT_ENROLLMENT_TOKEN as the primary bootstrap path — see
 * DeviceEnrollmentTokenService for generation/redemption and
 * EnrollmentGuard for how it's checked (falls back to the legacy shared
 * token for snippets distributed before this existed).
 *
 * `expired` is not a stored state: a `pending` row past `expiresAt` is
 * simply no longer redeemable. The service computes a derived
 * `displayStatus` for listing so nothing needs a background sweep job.
 */
@Entity()
export class DeviceEnrollmentToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  tokenHash: string;

  @Column({ type: 'varchar', nullable: true })
  label: string | null;

  @Column({ type: 'varchar', nullable: true })
  createdBy: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({
    type: 'enum',
    enum: DeviceEnrollmentTokenStatus,
    default: DeviceEnrollmentTokenStatus.PENDING,
  })
  status: DeviceEnrollmentTokenStatus;

  @Column({ type: 'timestamptz', nullable: true })
  usedAt: Date | null;

  @Column({ type: 'varchar', nullable: true })
  deviceId: string | null;
}
