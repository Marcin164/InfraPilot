import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { SlaDefinition } from './slaDefinition.entity';
import { SlaType } from './slaType.enum';
import { SlaEscalationInstance } from './slaEscalationInstance.entity';

enum EscalationActionType {
  NOTIFY = 'NOTIFY',
  REASSIGN = 'REASSIGN',
  PRIORITY_UP = 'PRIORITY_UP',
}

@Entity('sla_escalation_definition')
export class SlaEscalationDefinition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  slaDefinitionId: string;

  @ManyToOne(() => SlaDefinition, (sla: any) => sla.escalations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'slaDefinitionId' })
  slaDefinition: SlaDefinition;

  @Column()
  triggerPercentage: number;

  // null = applies to both RESPONSE and RESOLUTION instances spawned by the
  // same definition. Non-null scopes it to only one, since a merged
  // definition can now spawn both.
  @Column({ type: 'enum', enum: SlaType, nullable: true })
  appliesTo: SlaType | null;

  @Column({
    type: 'enum',
    enum: EscalationActionType,
  })
  actionType: EscalationActionType;

  @Column({ type: 'jsonb', nullable: true })
  actionConfig: Record<string, any>;

  @OneToMany(() => SlaEscalationInstance, (inst: any) => inst.definition)
  instances: SlaEscalationInstance[];

  @Column({ type: 'timestamp', default: () => 'now()' })
  createdAt: Date;
}
