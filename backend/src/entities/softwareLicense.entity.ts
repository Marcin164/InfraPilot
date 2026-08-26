import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
} from 'typeorm';

export enum LicenseType {
  PERPETUAL = 'perpetual',
  SUBSCRIPTION = 'subscription',
  VOLUME = 'volume',
  CONCURRENT = 'concurrent',
}

export enum LicenseSource {
  MANUAL = 'manual',
  M365 = 'm365',
  GOOGLE = 'google',
  GITHUB = 'github',
  ZOOM = 'zoom',
  DROPBOX = 'dropbox',
}

@Entity()
export class SoftwareLicense {
  @PrimaryColumn()
  id: string;

  @Column({ type: 'varchar', length: 256 })
  name: string;

  @Column({ type: 'varchar', length: 256, nullable: true })
  publisher: string | null;

  @Column({ type: 'enum', enum: LicenseType, default: LicenseType.PERPETUAL })
  licenseType: LicenseType;

  /** Total number of seats/activations included. Null = unlimited. */
  @Column({ type: 'int', nullable: true })
  totalSeats: number | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  licenseKey: string | null;

  @Column({ type: 'date', nullable: true })
  purchaseDate: string | null;

  /** Null = perpetual, no expiry. */
  @Column({ type: 'date', nullable: true })
  expiresAt: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  cost: string | null;

  @Column({ type: 'varchar', length: 8, nullable: true })
  currency: string | null;

  @Column({ type: 'varchar', length: 256, nullable: true })
  vendor: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'enum', enum: LicenseSource, default: LicenseSource.MANUAL })
  source: LicenseSource;

  /** Business key from the source provider (e.g. Graph subscribedSkus skuId). Null for manual entries. */
  @Column({ type: 'varchar', length: 256, nullable: true })
  externalId: string | null;

  /** Seats reported as consumed by the provider. Independent of local SoftwareLicenseAssignment rows. */
  @Column({ type: 'int', nullable: true })
  consumedSeats: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastSyncedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
