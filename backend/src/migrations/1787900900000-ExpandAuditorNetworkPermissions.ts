import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * ipam.view/ipam.manage, dhcp.view/dhcp.manage and
 * devices.networkBackup.manage are new catalog codes (see
 * permissions.catalog.ts) that replace what used to be reached only via
 * devices.connection.manage's overly-broad reuse for IPAM, DHCP, and
 * network device SSH credentials/backups. The built-in "Auditor" role
 * ("near-admin visibility and management everywhere except the Admin
 * settings group") already had that access through the old reuse -- this
 * backfills the 5 new codes onto its stored permissions array so it keeps
 * that access now that devices.connection.manage is scoped to remote-assist
 * only. Deliberately does NOT touch "Agent": that role only ever needed
 * devices.connection.manage for remote-assist, and its incidental
 * IPAM/DHCP/network-backup reach was the bug being fixed, not a feature to
 * preserve.
 */
export class ExpandAuditorNetworkPermissions1787900900000
  implements MigrationInterface
{
  name = 'ExpandAuditorNetworkPermissions1787900900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "custom_role"
      SET "permissions" = (
        SELECT ARRAY(
          SELECT DISTINCT unnest(
            "permissions" || ARRAY[
              'ipam.view', 'ipam.manage',
              'dhcp.view', 'dhcp.manage',
              'devices.networkBackup.manage'
            ]::text[]
          )
        )
      )
      WHERE "name" = 'Auditor' AND "isBuiltIn" = true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "custom_role"
      SET "permissions" = array_remove(
        array_remove(
          array_remove(
            array_remove(
              array_remove("permissions", 'ipam.view'),
              'ipam.manage'
            ),
            'dhcp.view'
          ),
          'dhcp.manage'
        ),
        'devices.networkBackup.manage'
      )
      WHERE "name" = 'Auditor' AND "isBuiltIn" = true
    `);
  }
}
