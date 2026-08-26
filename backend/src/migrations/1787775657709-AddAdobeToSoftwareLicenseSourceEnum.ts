import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAdobeToSoftwareLicenseSourceEnum1787775657709 implements MigrationInterface {
    name = 'AddAdobeToSoftwareLicenseSourceEnum1787775657709'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."software_license_source_enum" ADD VALUE 'adobe'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Postgres has no DROP VALUE for enums -- removing 'adobe' would require
        // recreating the whole type, which is disproportionate for this change.
        // No-op: the extra enum value is harmless if left in place.
    }

}
