import { MigrationInterface, QueryRunner } from "typeorm";

export class DropNotifEmailFromUserSettings1786698443026 implements MigrationInterface {
    name = 'DropNotifEmailFromUserSettings1786698443026'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_settings" DROP COLUMN IF EXISTS "notifEmail"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_settings" ADD COLUMN "notifEmail" character varying(255)`);
    }

}
