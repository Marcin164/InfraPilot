import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Devices } from './devices.entity';

export enum NetworkLinkType {
  ETHERNET = 'ethernet',
  FIBER = 'fiber',
  WIFI = 'wifi',
  OTHER = 'other',
}

/**
 * A manually-documented cable/link between two Devices rows -- either end
 * can be network gear (switch/router/AP/firewall) or an endpoint
 * (laptop/PC), since both live in the same `Devices` table. Used to render
 * the topology view; there's no SNMP/LLDP discovery, so this is admin-entered.
 */
@Entity()
export class NetworkConnection {
  @PrimaryColumn()
  id: string;

  @Column()
  sourceDeviceId: string;

  @ManyToOne(() => Devices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sourceDeviceId' })
  sourceDevice: Devices;

  @Column({ type: 'varchar', nullable: true })
  sourcePort: string | null;

  @Column()
  targetDeviceId: string;

  @ManyToOne(() => Devices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'targetDeviceId' })
  targetDevice: Devices;

  @Column({ type: 'varchar', nullable: true })
  targetPort: string | null;

  @Column({ type: 'enum', enum: NetworkLinkType, default: NetworkLinkType.ETHERNET })
  linkType: NetworkLinkType;

  @Column({ type: 'varchar', nullable: true })
  vlan: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'varchar', nullable: true })
  createdBy: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
