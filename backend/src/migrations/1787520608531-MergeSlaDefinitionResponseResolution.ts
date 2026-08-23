import { MigrationInterface, QueryRunner } from "typeorm";

// Merges SlaDefinition.type/targetMinutes (one row per RESPONSE-or-RESOLUTION
// target) into responseMinutes/resolutionMinutes (both optional on the same
// row). SlaInstance gains its own type/targetMinutes snapshot since a single
// definition can now spawn both a RESPONSE and a RESOLUTION instance.
// Existing definitions are NOT auto-merged into one row (they're referenced
// by SlaRule/SlaEscalationDefinition FKs) -- each keeps its single-purpose
// value, migrated into whichever new column matches its old `type`.
export class MergeSlaDefinitionResponseResolution1787520608531 implements MigrationInterface {
    name = 'MergeSlaDefinitionResponseResolution1787520608531'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. New optional columns on sla_definition, backfilled from the old ones.
        await queryRunner.query(`ALTER TABLE "sla_definition" ADD "responseMinutes" integer`);
        await queryRunner.query(`ALTER TABLE "sla_definition" ADD "resolutionMinutes" integer`);
        await queryRunner.query(`UPDATE "sla_definition" SET "responseMinutes" = "targetMinutes" WHERE "type" = 'RESPONSE'`);
        await queryRunner.query(`UPDATE "sla_definition" SET "resolutionMinutes" = "targetMinutes" WHERE "type" = 'RESOLUTION'`);
        // Legacy rows with no type recorded default to RESPONSE so the value isn't silently dropped.
        await queryRunner.query(`UPDATE "sla_definition" SET "responseMinutes" = "targetMinutes" WHERE "type" IS NULL`);

        // 2. New type/targetMinutes snapshot on sla_instance, backfilled from its
        //    (still-present) sla_definition while the old columns still exist.
        await queryRunner.query(`CREATE TYPE "public"."sla_instance_type_enum" AS ENUM('RESPONSE', 'RESOLUTION')`);
        await queryRunner.query(`ALTER TABLE "sla_instance" ADD "type" "public"."sla_instance_type_enum"`);
        await queryRunner.query(`ALTER TABLE "sla_instance" ADD "targetMinutes" integer`);
        await queryRunner.query(`
            UPDATE "sla_instance" si
            SET "type" = COALESCE(sd."type"::text, 'RESPONSE')::"sla_instance_type_enum",
                "targetMinutes" = sd."targetMinutes"
            FROM "sla_definition" sd
            WHERE si."sla_definition_id" = sd."id"
        `);
        await queryRunner.query(`ALTER TABLE "sla_instance" ALTER COLUMN "type" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "sla_instance" ALTER COLUMN "targetMinutes" SET NOT NULL`);

        // 3. Drop the now-superseded columns on sla_definition.
        await queryRunner.query(`ALTER TABLE "sla_definition" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "public"."sla_definition_type_enum"`);
        await queryRunner.query(`ALTER TABLE "sla_definition" DROP COLUMN "targetMinutes"`);

        // 4. Escalation scoping: null = applies to both instance types (unchanged behavior).
        await queryRunner.query(`CREATE TYPE "public"."sla_escalation_definition_appliesto_enum" AS ENUM('RESPONSE', 'RESOLUTION')`);
        await queryRunner.query(`ALTER TABLE "sla_escalation_definition" ADD "appliesTo" "public"."sla_escalation_definition_appliesto_enum"`);
    }

    // Note: a definition with BOTH responseMinutes and resolutionMinutes set
    // (only possible after this migration, via the merged UI) can't round-trip
    // losslessly -- the old schema has one type/targetMinutes per row, so the
    // resolution side wins and the response side is dropped. Acceptable for a
    // rollback path; not expected to be exercised against post-merge data.
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sla_escalation_definition" DROP COLUMN "appliesTo"`);
        await queryRunner.query(`DROP TYPE "public"."sla_escalation_definition_appliesto_enum"`);

        await queryRunner.query(`ALTER TABLE "sla_definition" ADD "targetMinutes" integer`);
        await queryRunner.query(`CREATE TYPE "public"."sla_definition_type_enum" AS ENUM('RESPONSE', 'RESOLUTION')`);
        await queryRunner.query(`ALTER TABLE "sla_definition" ADD "type" "public"."sla_definition_type_enum"`);
        await queryRunner.query(`UPDATE "sla_definition" SET "type" = 'RESPONSE', "targetMinutes" = "responseMinutes" WHERE "responseMinutes" IS NOT NULL`);
        await queryRunner.query(`UPDATE "sla_definition" SET "type" = 'RESOLUTION', "targetMinutes" = "resolutionMinutes" WHERE "resolutionMinutes" IS NOT NULL AND "type" IS NULL`);
        await queryRunner.query(`ALTER TABLE "sla_definition" ALTER COLUMN "targetMinutes" SET NOT NULL`);

        await queryRunner.query(`ALTER TABLE "sla_instance" DROP COLUMN "targetMinutes"`);
        await queryRunner.query(`ALTER TABLE "sla_instance" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "public"."sla_instance_type_enum"`);

        await queryRunner.query(`ALTER TABLE "sla_definition" DROP COLUMN "resolutionMinutes"`);
        await queryRunner.query(`ALTER TABLE "sla_definition" DROP COLUMN "responseMinutes"`);
    }

}
