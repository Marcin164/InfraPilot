import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCustomFieldsToCategoriesAndTickets1786383130825 implements MigrationInterface {
    name = 'AddCustomFieldsToCategoriesAndTickets1786383130825'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ticket_category" ADD "customFields" jsonb NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "tickets" ADD "customFieldValues" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tickets" DROP COLUMN "customFieldValues"`);
        await queryRunner.query(`ALTER TABLE "ticket_category" DROP COLUMN "customFields"`);
    }

}
