import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Location } from './location.entity';

/** A defined IP pool/VLAN for IPAM bookkeeping (e.g. `192.168.1.0/24`, VLAN 10). */
@Entity()
export class Subnet {
  @PrimaryColumn()
  id: string;

  @Column({ type: 'varchar', length: 256 })
  name: string;

  @Column({ type: 'varchar', length: 32 })
  cidr: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  vlan: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  gateway: string | null;

  @Column({ type: 'jsonb', nullable: true })
  dnsServers: string[] | null;

  @Column({ nullable: true })
  locationId: string | null;

  @ManyToOne(() => Location, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'locationId' })
  locationRef: Location;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
