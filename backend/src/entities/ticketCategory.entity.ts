import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { TicketType } from './tickets.entity';

export type CustomFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'checkbox'
  | 'date';

export type CustomFieldDef = {
  id: string;
  label: string;
  type: CustomFieldType;
  required: boolean;
  /** Only meaningful for type 'select'. */
  options?: string[];
};

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

  // Extra fields the ticket-creation form asks for when this category is
  // picked (e.g. "System name" for an Access request). Kept in jsonb, same
  // reasoning as TicketWorkflow.steps -- the editor can add/reorder/remove
  // fields without DDL.
  @Column({ type: 'jsonb', default: [] })
  customFields: CustomFieldDef[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
