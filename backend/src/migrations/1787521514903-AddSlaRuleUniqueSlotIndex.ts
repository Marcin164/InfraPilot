import { MigrationInterface, QueryRunner } from "typeorm";

// The old SlaRuleService.create() used to blind-delete by priority only
// (fixed in the app code separately), which could leave duplicate rows for
// the same (priority, ticketType) slot on databases where it ran. De-dupe
// before adding the constraint so this migration doesn't fail on real data.
export class AddSlaRuleUniqueSlotIndex1787521514903 implements MigrationInterface {
    name = 'AddSlaRuleUniqueSlotIndex1787521514903'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM "sla_rule" WHERE "id" IN (
                SELECT "id" FROM (
                    SELECT "id", ROW_NUMBER() OVER (
                        PARTITION BY "priority", "ticketType" ORDER BY "id"
                    ) AS rn
                    FROM "sla_rule"
                ) ranked
                WHERE rn > 1
            )
        `);

        // Two partial unique indexes: NULL ticketType ("Any") is treated as its
        // own slot per priority, since Postgres unique indexes don't otherwise
        // consider NULLs equal to each other.
        await queryRunner.query(`
            CREATE UNIQUE INDEX "sla_rule_priority_tickettype_uq"
            ON "sla_rule" ("priority", "ticketType")
            WHERE "ticketType" IS NOT NULL
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "sla_rule_priority_any_uq"
            ON "sla_rule" ("priority")
            WHERE "ticketType" IS NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "sla_rule_priority_any_uq"`);
        await queryRunner.query(`DROP INDEX "sla_rule_priority_tickettype_uq"`);
    }

}
