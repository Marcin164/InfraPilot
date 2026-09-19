import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomRolesAndPermissions1787900600000
  implements MigrationInterface
{
  name = 'AddCustomRolesAndPermissions1787900600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "custom_role" (
                "id" character varying NOT NULL,
                "name" character varying(255) NOT NULL,
                "description" text,
                "isBuiltIn" boolean NOT NULL DEFAULT false,
                "grantsAllPermissions" boolean NOT NULL DEFAULT false,
                "permissions" text array NOT NULL DEFAULT '{}',
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_custom_role_name" UNIQUE ("name"),
                CONSTRAINT "PK_custom_role" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "user_custom_role" (
                "id" character varying NOT NULL,
                "userId" character varying NOT NULL,
                "roleId" character varying NOT NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_user_custom_role" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(
      `CREATE INDEX "IDX_user_custom_role_userId" ON "user_custom_role" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_custom_role_roleId" ON "user_custom_role" ("roleId")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_user_custom_role_userId_roleId" ON "user_custom_role" ("userId", "roleId")`,
    );
    await queryRunner.query(`
            ALTER TABLE "user_custom_role" ADD CONSTRAINT "FK_user_custom_role_user"
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "user_custom_role" ADD CONSTRAINT "FK_user_custom_role_role"
            FOREIGN KEY ("roleId") REFERENCES "custom_role"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_custom_role" DROP CONSTRAINT "FK_user_custom_role_role"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_custom_role" DROP CONSTRAINT "FK_user_custom_role_user"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_user_custom_role_userId_roleId"`);
    await queryRunner.query(`DROP INDEX "IDX_user_custom_role_roleId"`);
    await queryRunner.query(`DROP INDEX "IDX_user_custom_role_userId"`);
    await queryRunner.query(`DROP TABLE "user_custom_role"`);
    await queryRunner.query(`DROP TABLE "custom_role"`);
  }
}
