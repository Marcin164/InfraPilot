import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { SoftwareLicense } from './softwareLicense.entity';
import { Devices } from './devices.entity';
import { Users } from './users.entity';

@Entity()
export class SoftwareLicenseAssignment {
  @PrimaryColumn()
  id: string;

  @Column()
  licenseId: string;

  @ManyToOne(() => SoftwareLicense, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'licenseId' })
  license: SoftwareLicense;

  @Column({ nullable: true })
  deviceId: string | null;

  @ManyToOne(() => Devices, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'deviceId' })
  device: Devices;

  @Column({ nullable: true })
  userId: string | null;

  @ManyToOne(() => Users, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: Users;

  @CreateDateColumn({ type: 'timestamptz' })
  assignedAt: Date;
}
