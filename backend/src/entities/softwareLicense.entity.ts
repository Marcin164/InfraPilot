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

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
