import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { TicketType } from './tickets.entity';

/**
 * Rich ticket category. The `tickets.category` column on the ticket
 * itself stays a plain string (free-form) for backwards compatibility;
 * matching is done by name. A linked workflow auto-runs on ticket
 * creation when the agent picks this category.
 */
@Entity()
export class TicketCategory {
  @PrimaryColumn()
  id: string;

  @Index({ unique: true })
  @Column()
  name: string;

  @Column({ type: 'enum', enum: TicketType, nullable: true })
  ticketType: TicketType;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 16, default: '#2B9AE9' })
  color: string;

  @Column({ default: true })
  enabled: boolean;

  @Column({ type: 'uuid', nullable: true })
  workflowId: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
