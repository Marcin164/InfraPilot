import {
  Entity,
  PrimaryColumn,
  Column,
  Index,
  JoinColumn,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Users } from './users.entity';
import { CustomRole } from './customRole.entity';

@Entity()
@Index(['userId', 'roleId'], { unique: true })
export class UserCustomRole {
  @PrimaryColumn()
  id: string;

  @Index()
  @Column()
  userId: string;

  @ManyToOne(() => Users, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: Users;

  @Index()
  @Column()
  roleId: string;

  @ManyToOne(() => CustomRole, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roleId' })
  role: CustomRole;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
