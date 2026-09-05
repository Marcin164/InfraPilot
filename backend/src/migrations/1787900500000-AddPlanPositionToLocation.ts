import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPlanPositionToLocation1787900500000 implements MigrationInterface {
    name = 'AddPlanPositionToLocation1787900500000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "location" ADD "planX" double precision`);
        await queryRunner.query(`ALTER TABLE "location" ADD "planY" double precision`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "location" DROP COLUMN "planY"`);
        await queryRunner.query(`ALTER TABLE "location" DROP COLUMN "planX"`);
    }

}
