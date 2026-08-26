import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTicketAffectedUsers1787900000000 implements MigrationInterface {
    name = 'AddTicketAffectedUsers1787900000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "ticket_affected_users" ("ticketId" uuid NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "PK_ticket_affected_users" PRIMARY KEY ("ticketId", "userId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ticket_affected_users_ticketId" ON "ticket_affected_users" ("ticketId")`);
        await queryRunner.query(`CREATE INDEX "IDX_ticket_affected_users_userId" ON "ticket_affected_users" ("userId")`);
        await queryRunner.query(`ALTER TABLE "ticket_affected_users" ADD CONSTRAINT "FK_ticket_affected_users_ticket" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ticket_affected_users" ADD CONSTRAINT "FK_ticket_affected_users_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ticket_affected_users" DROP CONSTRAINT "FK_ticket_affected_users_user"`);
        await queryRunner.query(`ALTER TABLE "ticket_affected_users" DROP CONSTRAINT "FK_ticket_affected_users_ticket"`);
        await queryRunner.query(`DROP INDEX "IDX_ticket_affected_users_userId"`);
        await queryRunner.query(`DROP INDEX "IDX_ticket_affected_users_ticketId"`);
        await queryRunner.query(`DROP TABLE "ticket_affected_users"`);
    }

}
