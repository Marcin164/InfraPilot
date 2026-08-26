import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSyncFieldsToSoftwareLicense1787743551965 implements MigrationInterface {
    name = 'AddSyncFieldsToSoftwareLicense1787743551965'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."software_license_source_enum" AS ENUM('manual', 'm365', 'google', 'github', 'zoom', 'dropbox')`);
        await queryRunner.query(`ALTER TABLE "software_license" ADD "source" "public"."software_license_source_enum" NOT NULL DEFAULT 'manual'`);
        await queryRunner.query(`ALTER TABLE "software_license" ADD "externalId" character varying(256)`);
        await queryRunner.query(`ALTER TABLE "software_license" ADD "consumedSeats" integer`);
        await queryRunner.query(`ALTER TABLE "software_license" ADD "lastSyncedAt" TIMESTAMP WITH TIME ZONE`);

        await queryRunner.query(`
            CREATE UNIQUE INDEX "software_license_source_externalid_uq"
            ON "software_license" ("source", "externalId")
            WHERE "source" <> 'manual'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "software_license_source_externalid_uq"`);
        await queryRunner.query(`ALTER TABLE "software_license" DROP COLUMN "lastSyncedAt"`);
        await queryRunner.query(`ALTER TABLE "software_license" DROP COLUMN "consumedSeats"`);
        await queryRunner.query(`ALTER TABLE "software_license" DROP COLUMN "externalId"`);
        await queryRunner.query(`ALTER TABLE "software_license" DROP COLUMN "source"`);
        await queryRunner.query(`DROP TYPE "public"."software_license_source_enum"`);
    }

}
