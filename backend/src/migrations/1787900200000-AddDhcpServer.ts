import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDhcpServer1787900200000 implements MigrationInterface {
    name = 'AddDhcpServer1787900200000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."dhcp_server_drivertype_enum" AS ENUM('ssh_scrape')`);
        await queryRunner.query(`
            CREATE TABLE "dhcp_server" (
                "id" character varying NOT NULL,
                "name" character varying(255) NOT NULL,
                "driverType" "public"."dhcp_server_drivertype_enum" NOT NULL DEFAULT 'ssh_scrape',
                "deviceId" character varying,
                "config" jsonb NOT NULL DEFAULT '{}',
                "enabled" boolean NOT NULL DEFAULT false,
                "lastSyncAt" TIMESTAMP WITH TIME ZONE,
                "lastSyncStatus" character varying(16),
                "lastSyncError" text,
                "lastSyncRecordCount" integer,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_dhcp_server" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "dhcp_server" ADD CONSTRAINT "FK_dhcp_server_device"
            FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`ALTER TABLE "ip_allocation" ADD "dhcpServerId" character varying`);
        await queryRunner.query(`CREATE INDEX "IDX_ip_allocation_dhcpServerId" ON "ip_allocation" ("dhcpServerId")`);
        await queryRunner.query(`
            ALTER TABLE "ip_allocation" ADD CONSTRAINT "FK_ip_allocation_dhcp_server"
            FOREIGN KEY ("dhcpServerId") REFERENCES "dhcp_server"("id") ON DELETE SET NULL ON UPDATE NO ACTION
        `);

        // Backfill: every network_device_credential row that had lease sync configured
        // becomes an ssh_scrape DhcpServer, named after the device it's attached to
        // (falls back to the device id if it has no assetName/model set).
        await queryRunner.query(`
            INSERT INTO "dhcp_server" ("id", "name", "driverType", "deviceId", "config", "enabled", "createdAt", "updatedAt")
            SELECT
                uuid_generate_v4()::text,
                COALESCE(d."assetName", d."model", d."id"),
                'ssh_scrape',
                c."deviceId",
                jsonb_build_object('command', c."leaseSyncCommand", 'lineTemplate', c."leaseSyncLineTemplate"),
                c."leaseSyncEnabled",
                now(),
                now()
            FROM "network_device_credential" c
            JOIN "devices" d ON d."id" = c."deviceId"
            WHERE c."leaseSyncCommand" IS NOT NULL AND c."leaseSyncLineTemplate" IS NOT NULL
        `);

        await queryRunner.query(`ALTER TABLE "network_device_credential" DROP COLUMN "leaseSyncCommand"`);
        await queryRunner.query(`ALTER TABLE "network_device_credential" DROP COLUMN "leaseSyncLineTemplate"`);
        await queryRunner.query(`ALTER TABLE "network_device_credential" DROP COLUMN "leaseSyncEnabled"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "network_device_credential" ADD "leaseSyncEnabled" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "network_device_credential" ADD "leaseSyncLineTemplate" text`);
        await queryRunner.query(`ALTER TABLE "network_device_credential" ADD "leaseSyncCommand" text`);

        await queryRunner.query(`
            UPDATE "network_device_credential" c
            SET "leaseSyncCommand" = s."config"->>'command',
                "leaseSyncLineTemplate" = s."config"->>'lineTemplate',
                "leaseSyncEnabled" = s."enabled"
            FROM "dhcp_server" s
            WHERE s."deviceId" = c."deviceId" AND s."driverType" = 'ssh_scrape'
        `);

        await queryRunner.query(`ALTER TABLE "ip_allocation" DROP CONSTRAINT "FK_ip_allocation_dhcp_server"`);
        await queryRunner.query(`DROP INDEX "IDX_ip_allocation_dhcpServerId"`);
        await queryRunner.query(`ALTER TABLE "ip_allocation" DROP COLUMN "dhcpServerId"`);

        await queryRunner.query(`ALTER TABLE "dhcp_server" DROP CONSTRAINT "FK_dhcp_server_device"`);
        await queryRunner.query(`DROP TABLE "dhcp_server"`);
        await queryRunner.query(`DROP TYPE "public"."dhcp_server_drivertype_enum"`);
    }

}
