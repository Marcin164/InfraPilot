import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Drops the 6 legacy boolean role columns on `users` (isAdmin, isApprover,
 * isAuditor, isCompliance, isHelpdesk, isDpo). By this point every controller
 * enforces access via @RequiresPermission/CustomRole (see
 * AddCustomRolesAndPermissions + SeedBuiltInCustomRoles), the
 * PermissionsGuard isAdmin bypass has been removed, and the dual-write bridge
 * in CustomRolesService no longer exists -- these columns are pure dead
 * weight. `down()` recreates the columns (default false) but cannot restore
 * their historical values; real rollback means restoring from a backup.
 */
export class DropLegacyRoleFlags1787900800000 implements MigrationInterface {
  name = 'DropLegacyRoleFlags1787900800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        DROP COLUMN "isApprover",
        DROP COLUMN "isAdmin",
        DROP COLUMN "isAuditor",
        DROP COLUMN "isCompliance",
        DROP COLUMN "isHelpdesk",
        DROP COLUMN "isDpo"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN "isApprover" boolean DEFAULT false,
        ADD COLUMN "isAdmin" boolean DEFAULT false,
        ADD COLUMN "isAuditor" boolean DEFAULT false,
        ADD COLUMN "isCompliance" boolean DEFAULT false,
        ADD COLUMN "isHelpdesk" boolean DEFAULT false,
        ADD COLUMN "isDpo" boolean DEFAULT false
    `);
  }
}
