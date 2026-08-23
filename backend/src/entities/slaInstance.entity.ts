import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { SlaDefinition } from './slaDefinition.entity';
import { SlaType } from './slaType.enum';
import { SlaPause } from './slaPause.entity';
import { Tickets } from './tickets.entity';

@Entity()
export class SlaInstance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'ticket_id', type: 'uuid' })
  ticketId: string;

  @ManyToOne(() => Tickets, (t) => t.slaInstances, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticket_id' })
  ticket: Tickets;

  @ManyToOne(() => SlaDefinition, (sla: any) => sla.instances)
  @JoinColumn({ name: 'sla_definition_id' })
  slaDefinition: SlaDefinition;

  // A single SlaDefinition can carry both a responseMinutes and a
  // resolutionMinutes target, so each instance snapshots which one it is and
  // its own target -- decoupling already-created instances from later edits
  // to the definition.
  @Column({ type: 'enum', enum: SlaType })
  type: SlaType;

  @Column({ type: 'int' })
  targetMinutes: number;

  @Column({ type: 'timestamp' })
  startAt: Date;

  @Index()
  @Column({ type: 'timestamp' })
  dueAt: Date;

  @Column({ default: false })
  paused: boolean;

  @Index()
  @Column({ default: false })
  breached: boolean;

  // Set once, the first time staff posts a Public reply to the ticket's
  // requester -- independent of `breached`, so a late-but-eventual reply
  // still shows as answered instead of hanging as a bare breach forever.
  @Column({ type: 'timestamp', nullable: true })
  respondedAt: Date | null;

  @OneToMany(() => SlaPause, (pause: any) => pause.slaInstance)
  pauses: SlaPause[];
}
