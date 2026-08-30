import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  PrimaryGeneratedColumn,
  OneToOne,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
} from 'typeorm';
import { TicketsComments } from './ticketsComments.entity';
import { Users } from './users.entity';
import { Location } from './location.entity';
import { Devices } from './devices.entity';
import { TicketsApprovals } from './ticketsApprovals.entity';
import { SlaInstance } from './slaInstance.entity';
import { TicketActivity } from './ticketActivity.entity';

export enum TicketType {
  INCIDENT = 'Incident',
  SERVICE = 'Service',
}

export enum TicketState {
  NEW = 'New',
  ASSIGNED = 'Assigned',
  IN_PROGRESS = 'In progress',
  AWAITING_USER = 'Awaiting for user',
  AWAITING_VENDOR = 'Awaiting for vendor',
  RESOLVED = 'Resolved',
  CLOSED = 'Closed',
  CANCELL = 'Cancelled',
}

export enum TicketPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical',
}

export enum TicketImpact {
  SINGLE = 'Single user',
  MULTIPLE = 'Multiple users',
  SEVERAL_LOCATIONS = 'Several locations',
  COMPANY = 'Whole company',
}

export enum TicketUrgency {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
}

@Entity()
export class Tickets {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  assignee: string;

  @Column({ nullable: true })
  assignmentGroup: string;

  // Populated only when impact = "Multiple users" -- the set of users
  // affected besides the requester. Mirrors AssignmentGroup.members.
  @ManyToMany(() => Users)
  @JoinTable({
    name: 'ticket_affected_users',
    joinColumn: { name: 'ticketId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  affectedUsers: Users[];

  // Populated only when impact = "Several locations".
  @ManyToMany(() => Location)
  @JoinTable({
    name: 'ticket_affected_locations',
    joinColumn: { name: 'ticketId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'locationId', referencedColumnName: 'id' },
  })
  affectedLocations: Location[];

  @Column({
    type: 'enum',
    enum: TicketState,
    default: TicketState.NEW,
  })
  state: TicketState;

  @Column({
    type: 'enum',
    enum: TicketType,
  })
  type: TicketType;

  @Column({ unique: true })
  number: number;

  @Column({
    type: 'enum',
    enum: TicketPriority,
    default: TicketPriority.MEDIUM,
  })
  priority: TicketPriority;

  @Column({
    type: 'enum',
    enum: TicketImpact,
    default: TicketImpact.SINGLE,
  })
  impact: TicketImpact;

  @Column({
    type: 'enum',
    enum: TicketUrgency,
    default: TicketUrgency.MEDIUM,
  })
  urgency: TicketUrgency;

  @Column({ nullable: true })
  requesterId: string;

  @ManyToOne(() => Users, {
    eager: false,
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'requesterId' })
  requester: Users;

  @Column({ nullable: true })
  deviceId: string;

  @ManyToOne(() => Devices, {
    eager: false,
    nullable: false,
  })
  @JoinColumn({ name: 'deviceId' })
  device: Devices;

  @Column({ nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  category: string;

  // Snapshot of the category's custom fields as filled in on the creation
  // form -- keyed by field id, each entry carries its own label/type so the
  // ticket still displays correctly if the category's fields are edited or
  // removed later. Null when the category had no custom fields.
  @Column({ type: 'jsonb', nullable: true })
  customFieldValues: Record<
    string,
    { label: string; type: string; value: unknown }
  > | null;

  @Column({ nullable: true })
  closureCode: string;

  @Column({ nullable: true })
  closureNotes: string;

  @Column({ type: 'uuid', nullable: true })
  parentTicketId: string;

  @ManyToOne(() => Tickets, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parentTicketId' })
  parent: Tickets;

  @OneToMany(() => Tickets, (t) => t.parent)
  children: Tickets[];

  @OneToMany(() => TicketsComments, (comment) => comment.ticket)
  comments: TicketsComments[];

  @OneToMany(() => TicketsApprovals, (approval) => approval.ticket)
  approvals: TicketsApprovals[];

  @OneToMany(() => SlaInstance, (sla: any) => sla.ticket)
  slaInstances: SlaInstance[];

  @OneToMany(() => TicketActivity, (activity) => activity.ticket)
  activities: TicketActivity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  closedAt: Date;

  @Column({ nullable: true })
  resolvedAt: Date;
}
