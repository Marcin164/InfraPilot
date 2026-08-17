import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRespondedAtToSlaInstance1786889043965 implements MigrationInterface {
    name = 'AddRespondedAtToSlaInstance1786889043965'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sla_instance" ADD "respondedAt" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sla_instance" DROP COLUMN "respondedAt"`);
    }

}
