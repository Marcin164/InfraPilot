import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Calendar } from './calendar.entity';
import { SlaRule } from './slaRule.entity';
import { SlaInstance } from './slaInstance.entity';
import { SlaEscalationDefinition } from './slaEscalationDefinition.entity';

// Re-exported for existing call sites; canonical definition lives in
// slaType.enum.ts to avoid a circular import (this file <-> slaEscalationDefinition.entity.ts).
export { SlaType } from './slaType.enum';

@Entity()
export class SlaDefinition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'int', nullable: true })
  responseMinutes: number | null;

  @Column({ type: 'int', nullable: true })
  resolutionMinutes: number | null;

  @ManyToOne(() => Calendar, (calendar) => calendar.slaDefinitions)
  @JoinColumn({ name: 'calendarId' })
  calendar: Calendar;

  @OneToMany(() => SlaRule, (rule: any) => rule.slaDefinition)
  rules: SlaRule[];

  @OneToMany(() => SlaInstance, (instance: any) => instance.slaDefinition)
  instances: SlaInstance[];

  @OneToMany(() => SlaEscalationDefinition, (esc) => esc.slaDefinition)
  escalations: SlaEscalationDefinition[];
}
