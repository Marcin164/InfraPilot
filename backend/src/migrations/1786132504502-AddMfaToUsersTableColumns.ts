import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMfaToUsersTableColumns1786132504502 implements MigrationInterface {
    name = 'AddMfaToUsersTableColumns1786132504502'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_settings" ALTER COLUMN "usersTableColumnOrder" SET DEFAULT '["name","username","currentDevice","lastLogon","department","office","mfa"]'`);
        await queryRunner.query(`UPDATE "user_settings" SET "usersTableColumnOrder" = "usersTableColumnOrder" || '["mfa"]'::jsonb WHERE NOT ("usersTableColumnOrder" @> '["mfa"]'::jsonb)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE "user_settings" SET "usersTableColumnOrder" = "usersTableColumnOrder" - 'mfa'`);
        await queryRunner.query(`ALTER TABLE "user_settings" ALTER COLUMN "usersTableColumnOrder" SET DEFAULT '["name","username","currentDevice","lastLogon","department","office"]'`);
    }

}
