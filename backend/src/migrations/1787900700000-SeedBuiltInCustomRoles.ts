import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Seeds the 5 built-in CustomRole presets and assigns them to every user who
 * currently has the matching legacy flag set. Purely additive: the old
 * isAdmin/isApprover/isAuditor/isHelpdesk/isDpo columns are left untouched
 * and still gate everything via the legacy RolesGuard until controllers are
 * migrated to @RequiresPermission in a later change -- this migration only
 * makes the new data exist.
 *
 * Permission sets are the agreed sensible defaults for what each role means
 * under the new granular catalog (see permissions.catalog.ts), not a literal
 * reproduction of today's scattered per-endpoint @Roles() grants -- that
 * reproduction is exactly what the new system replaces. There is no
 * "Compliance" preset: its old scope (device compliance rules + retention
 * policy) is a strict subset of what Auditor now covers.
 */
export class SeedBuiltInCustomRoles1787900700000 implements MigrationInterface {
  name = 'SeedBuiltInCustomRoles1787900700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "custom_role" ("id", "name", "description", "isBuiltIn", "grantsAllPermissions", "permissions", "createdAt", "updatedAt")
      VALUES
        (uuid_generate_v4()::text, 'Administrator', 'Full access to every module. Built-in replacement for the legacy isAdmin flag.', true, true, ARRAY[]::text[], now(), now()),
        (uuid_generate_v4()::text, 'Approver', 'Approves helpdesk tickets. Built-in replacement for the legacy isApprover flag.', true, false, ARRAY['helpdesk.approver']::text[], now(), now()),
        (uuid_generate_v4()::text, 'Agent', 'Typical helpdesk agent: tickets, user lookup & equipment, helpdesk-level device actions, licenses, and knowledge base. Built-in replacement for the legacy isHelpdesk flag.', true, false, ARRAY['dashboards.view', 'users.view', 'users.equipment.manage', 'devices.view', 'devices.assignment.manage', 'devices.connection.manage', 'devices.maintenance.manage', 'licenses.view', 'licenses.add', 'licenses.edit', 'licenses.delete', 'knowledge.view', 'knowledge.manage', 'knowledge.createFromTicket', 'helpdesk.tickets.access']::text[], now(), now()),
        (uuid_generate_v4()::text, 'Auditor', 'Near-admin visibility and management everywhere except the Admin settings group (AD/O365/SMTP/locations/role assignment/ops alerts). Built-in replacement for the legacy isAuditor flag.', true, false, ARRAY['dashboards.view', 'dashboards.edit', 'users.view', 'users.add', 'users.edit', 'users.delete', 'users.provision', 'users.equipment.manage', 'devices.view', 'devices.map.view', 'devices.add', 'devices.secret.generate', 'devices.assignment.manage', 'devices.connection.manage', 'devices.lifecycle.edit', 'devices.taskSchedule.manage', 'devices.maintenance.manage', 'devices.topology.view', 'devices.topology.edit', 'devices.lastLogonColors.view', 'devices.tags.manage', 'devices.complianceRules.manage', 'devices.agentConfig.manage', 'shifts.viewOwn', 'shifts.viewTeam', 'shifts.edit', 'licenses.view', 'licenses.add', 'licenses.edit', 'licenses.delete', 'licenses.integrations.manage', 'procurement.view', 'procurement.add', 'procurement.edit', 'procurement.delete', 'helpdesk.tickets.access', 'helpdesk.approver', 'helpdesk.sla.config', 'helpdesk.workflow.config', 'helpdesk.assignmentGroups.manage', 'helpdesk.ticketTemplates.manage', 'knowledge.view', 'knowledge.manage', 'knowledge.createFromTicket', 'audit.fullAccess', 'dpo.viewUserAsDpo', 'dpo.fullAccess', 'dpo.retentionPolicy.config']::text[], now(), now()),
        (uuid_generate_v4()::text, 'DPO', 'Full access to the DPO tab. Built-in replacement for the legacy isDpo flag.', true, false, ARRAY['dpo.viewUserAsDpo', 'dpo.fullAccess', 'dpo.retentionPolicy.config']::text[], now(), now())
    `);

    const flagToRole: [string, string][] = [
      ['isAdmin', 'Administrator'],
      ['isApprover', 'Approver'],
      ['isHelpdesk', 'Agent'],
      ['isAuditor', 'Auditor'],
      ['isDpo', 'DPO'],
    ];

    for (const [flag, roleName] of flagToRole) {
      await queryRunner.query(`
        INSERT INTO "user_custom_role" ("id", "userId", "roleId", "createdAt")
        SELECT uuid_generate_v4()::text, u."id", r."id", now()
        FROM "users" u, "custom_role" r
        WHERE r."name" = '${roleName}' AND u."${flag}" = true
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "user_custom_role"
      WHERE "roleId" IN (
        SELECT "id" FROM "custom_role"
        WHERE "isBuiltIn" = true
          AND "name" IN ('Administrator', 'Approver', 'Agent', 'Auditor', 'DPO')
      )
    `);
    await queryRunner.query(`
      DELETE FROM "custom_role"
      WHERE "isBuiltIn" = true
        AND "name" IN ('Administrator', 'Approver', 'Agent', 'Auditor', 'DPO')
    `);
  }
}
