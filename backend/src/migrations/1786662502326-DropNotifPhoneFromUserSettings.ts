import { MigrationInterface, QueryRunner } from "typeorm";

export class DropNotifPhoneFromUserSettings1786662502326 implements MigrationInterface {
    name = 'DropNotifPhoneFromUserSettings1786662502326'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_settings" DROP COLUMN IF EXISTS "notifPhone"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_settings" ADD COLUMN "notifPhone" character varying(32)`);
    }

}
