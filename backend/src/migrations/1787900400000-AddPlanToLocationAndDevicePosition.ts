import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPlanToLocationAndDevicePosition1787900400000 implements MigrationInterface {
    name = 'AddPlanToLocationAndDevicePosition1787900400000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "location" ADD "planPath" character varying`);
        await queryRunner.query(`ALTER TABLE "location" ADD "planMimetype" character varying`);
        await queryRunner.query(`ALTER TABLE "location" ADD "planOriginalName" character varying`);
        await queryRunner.query(`ALTER TABLE "devices" ADD "locationX" double precision`);
        await queryRunner.query(`ALTER TABLE "devices" ADD "locationY" double precision`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "locationY"`);
        await queryRunner.query(`ALTER TABLE "devices" DROP COLUMN "locationX"`);
        await queryRunner.query(`ALTER TABLE "location" DROP COLUMN "planOriginalName"`);
        await queryRunner.query(`ALTER TABLE "location" DROP COLUMN "planMimetype"`);
        await queryRunner.query(`ALTER TABLE "location" DROP COLUMN "planPath"`);
    }

}
