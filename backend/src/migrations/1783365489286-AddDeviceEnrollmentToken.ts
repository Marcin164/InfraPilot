import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeviceEnrollmentToken1783365489286 implements MigrationInterface {
    name = 'AddDeviceEnrollmentToken1783365489286'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."device_enrollment_token_status_enum" AS ENUM('pending', 'used', 'revoked')`);
        await queryRunner.query(`CREATE TABLE "device_enrollment_token" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tokenHash" character varying NOT NULL, "label" character varying, "createdBy" character varying, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "public"."device_enrollment_token_status_enum" NOT NULL DEFAULT 'pending', "usedAt" TIMESTAMP WITH TIME ZONE, "deviceId" character varying, CONSTRAINT "UQ_2b0fcfe0173f65c382cd1a18163" UNIQUE ("tokenHash"), CONSTRAINT "PK_82ec373120373627314fcf68a6e" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "device_enrollment_token"`);
        await queryRunner.query(`DROP TYPE "public"."device_enrollment_token_status_enum"`);
    }

}
