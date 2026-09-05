import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCoordinatesToLocation1787900300000 implements MigrationInterface {
    name = 'AddCoordinatesToLocation1787900300000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "location" ADD "latitude" double precision`);
        await queryRunner.query(`ALTER TABLE "location" ADD "longitude" double precision`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "location" DROP COLUMN "longitude"`);
        await queryRunner.query(`ALTER TABLE "location" DROP COLUMN "latitude"`);
    }

}
