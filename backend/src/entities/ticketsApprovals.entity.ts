import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tickets } from './tickets.entity';
import { Users } from './users.entity';

@Entity()
export class TicketsApprovals {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  ticketId: string;

  @ManyToOne(() => Tickets, (ticket) => ticket.approvals, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ticketId' })
  ticket: Tickets;

  @Column({ nullable: true })
  decision: string;

  @Column()
  requesterId: string;

  @Column({ nullable: true })
  approverId: string;

  @ManyToOne(() => Users, {
    eager: false,
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'approverId' })
  approver: Users;

  @Column({ nullable: true })
  details: string;

  // Set only when this approval came from a `request_approval` workflow
  // step with `config.required: true` -- lets `updateApproval` resume the
  // paused workflow (continue on approve, stop on reject). Left null for
  // manually-created approvals and optional/non-blocking workflow steps,
  // which behave exactly as before (purely informational, no resume).
  @Column({ nullable: true })
  workflowId: string;

  @Column({ nullable: true })
  workflowStepId: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  decidedAt: Date;
}
