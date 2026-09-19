import {
  Entity,
  Column,
  PrimaryColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PermissionCode } from 'src/decorators/permissions.catalog';

/**
 * A customer-defined bundle of granular permissions, assignable to any
 * number of users (see UserCustomRole). Named `CustomRole` (not `Role`) to
 * avoid colliding with the legacy `Role` enum in roles.decorator.ts while
 * both systems coexist during the migration.
 */
@Entity()
export class CustomRole {
  @PrimaryColumn()
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  /** Seeded built-in role (mirrors a legacy flag) vs. one an admin created. */
  @Column({ default: false })
  isBuiltIn: boolean;

  /**
   * Superadmin-style role: has every permission, including ones added to the
   * catalog after this role was created. Takes priority over `permissions`.
   */
  @Column({ default: false })
  grantsAllPermissions: boolean;

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  permissions: PermissionCode[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
