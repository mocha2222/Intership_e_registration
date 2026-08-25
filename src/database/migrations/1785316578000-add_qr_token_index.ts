import { MigrationInterface, QueryRunner } from "typeorm";

export class AddQrTokenIndex1785316578000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Change qrToken from text to varchar(255) so it is indexable
        await queryRunner.query("ALTER TABLE `form_responses` MODIFY COLUMN `qrToken` varchar(255) NOT NULL;");
        
        // Add index on qrToken
        await queryRunner.query("CREATE INDEX `IDX_responses_qrToken` ON `form_responses` (`qrToken`);");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop index
        await queryRunner.query("DROP INDEX `IDX_responses_qrToken` ON `form_responses`;");

        // Revert qrToken type
        await queryRunner.query("ALTER TABLE `form_responses` MODIFY COLUMN `qrToken` text NOT NULL;");
    }

}
