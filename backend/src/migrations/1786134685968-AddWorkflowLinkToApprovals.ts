import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWorkflowLinkToApprovals1786134685968 implements MigrationInterface {
    name = 'AddWorkflowLinkToApprovals1786134685968'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tickets_approvals" ADD "workflowId" character varying`);
        await queryRunner.query(`ALTER TABLE "tickets_approvals" ADD "workflowStepId" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tickets_approvals" DROP COLUMN "workflowStepId"`);
        await queryRunner.query(`ALTER TABLE "tickets_approvals" DROP COLUMN "workflowId"`);
    }

}
