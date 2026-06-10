import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type WorkflowTrigger = 'on_create' | 'on_state_change';

export type WorkflowStepType =
  | 'request_approval'
  | 'notify'
  | 'set_field'
  | 'assign_to'
  | 'create_comment';

export type WorkflowStep = {
  id: string;
  order: number;
  type: WorkflowStepType;
  /** Human label shown in the editor / audit trail. */
  label?: string;
  config: Record<string, any>;
};

/**
 * Workflow definition. Steps are kept in `jsonb` so the editor can add /
 * reorder / remove without DDL. The engine (`TicketWorkflowEngine`) reads
 * this and dispatches steps sequentially after the trigger event fires.
 */
@Entity()
export class TicketWorkflow {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 32, default: 'on_create' })
  trigger: WorkflowTrigger;

  @Column({ default: true })
  enabled: boolean;

  @Column({ type: 'jsonb', default: [] })
  steps: WorkflowStep[];

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
