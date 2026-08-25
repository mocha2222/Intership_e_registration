import { MigrationInterface, QueryRunner } from "typeorm";

export class DropPasswordResetOtpTable1785311198697 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP TABLE IF EXISTS `password_reset_otps`;");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Since we are completely dropping this feature, we don't need a down migration to recreate the table.
    }

}
