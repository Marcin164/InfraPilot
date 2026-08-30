import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTicketSeveralLocationsImpact1787900100000 implements MigrationInterface {
    name = 'AddTicketSeveralLocationsImpact1787900100000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."tickets_impact_enum" ADD VALUE IF NOT EXISTS 'Several locations'`);

        await queryRunner.query(`CREATE TABLE "ticket_affected_locations" ("ticketId" uuid NOT NULL, "locationId" character varying NOT NULL, CONSTRAINT "PK_ticket_affected_locations" PRIMARY KEY ("ticketId", "locationId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ticket_affected_locations_ticketId" ON "ticket_affected_locations" ("ticketId")`);
        await queryRunner.query(`CREATE INDEX "IDX_ticket_affected_locations_locationId" ON "ticket_affected_locations" ("locationId")`);
        await queryRunner.query(`ALTER TABLE "ticket_affected_locations" ADD CONSTRAINT "FK_ticket_affected_locations_ticket" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ticket_affected_locations" ADD CONSTRAINT "FK_ticket_affected_locations_location" FOREIGN KEY ("locationId") REFERENCES "location"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ticket_affected_locations" DROP CONSTRAINT "FK_ticket_affected_locations_location"`);
        await queryRunner.query(`ALTER TABLE "ticket_affected_locations" DROP CONSTRAINT "FK_ticket_affected_locations_ticket"`);
        await queryRunner.query(`DROP INDEX "IDX_ticket_affected_locations_locationId"`);
        await queryRunner.query(`DROP INDEX "IDX_ticket_affected_locations_ticketId"`);
        await queryRunner.query(`DROP TABLE "ticket_affected_locations"`);

        // Removing an enum value requires rebuilding the type; only safe if no
        // row still uses it.
        await queryRunner.query(`ALTER TYPE "public"."tickets_impact_enum" RENAME TO "tickets_impact_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."tickets_impact_enum" AS ENUM('Single user', 'Multiple users', 'Whole company')`);
        await queryRunner.query(`ALTER TABLE "tickets" ALTER COLUMN "impact" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "tickets" ALTER COLUMN "impact" TYPE "public"."tickets_impact_enum" USING "impact"::text::"public"."tickets_impact_enum"`);
        await queryRunner.query(`ALTER TABLE "tickets" ALTER COLUMN "impact" SET DEFAULT 'Single user'`);
        await queryRunner.query(`DROP TYPE "public"."tickets_impact_enum_old"`);
    }

}
