import { MigrationInterface, QueryRunner } from "typeorm";

export class CleanupDatabaseColumns1785315578000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop attendance table first
        await queryRunner.query("DROP TABLE IF EXISTS `attendance`;");

        // Drop forms table unused columns & indexes
        await queryRunner.query("ALTER TABLE `forms` DROP INDEX `IDX_forms_isPublished`;");
        await queryRunner.query("ALTER TABLE `forms` DROP COLUMN `label`;");
        await queryRunner.query("ALTER TABLE `forms` DROP COLUMN `isPublished`;");
        await queryRunner.query("ALTER TABLE `forms` DROP COLUMN `accessMode`;");

        // Drop form_responses table unused columns & constraints & indexes
        await queryRunner.query("ALTER TABLE `form_responses` DROP FOREIGN KEY `FK_responses_userId`;");
        await queryRunner.query("ALTER TABLE `form_responses` DROP INDEX `IDX_responses_userId`;");
        await queryRunner.query("ALTER TABLE `form_responses` DROP COLUMN `userId`;");
        await queryRunner.query("ALTER TABLE `form_responses` DROP COLUMN `metadata`;");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Re-create form_responses columns
        await queryRunner.query("ALTER TABLE `form_responses` ADD COLUMN `userId` int NULL;");
        await queryRunner.query("ALTER TABLE `form_responses` ADD COLUMN `metadata` json NULL;");
        await queryRunner.query("CREATE INDEX `IDX_responses_userId` ON `form_responses` (`userId`);");
        await queryRunner.query("ALTER TABLE `form_responses` ADD CONSTRAINT `FK_responses_userId` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL;");

        // Re-create forms columns
        await queryRunner.query("ALTER TABLE `forms` ADD COLUMN `label` varchar(100) NULL;");
        await queryRunner.query("ALTER TABLE `forms` ADD COLUMN `isPublished` tinyint NOT NULL DEFAULT 0;");
        await queryRunner.query("ALTER TABLE `forms` ADD COLUMN `accessMode` varchar(20) NOT NULL DEFAULT 'public';");
        await queryRunner.query("CREATE INDEX `IDX_forms_isPublished` ON `forms` (`isPublished`);");

        // Re-create attendance table
        await queryRunner.query(`
            CREATE TABLE \`attendance\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`formId\` int NOT NULL,
                \`userId\` int NOT NULL,
                \`checkedInAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                INDEX \`IDX_attendance_formId\` (\`formId\`),
                INDEX \`IDX_attendance_userId\` (\`userId\`),
                UNIQUE INDEX \`IDX_attendance_form_user\` (\`formId\`, \`userId\`),
                PRIMARY KEY (\`id\`),
                CONSTRAINT \`FK_attendance_formId\` FOREIGN KEY (\`formId\`) REFERENCES \`forms\`(\`id\`) ON DELETE CASCADE,
                CONSTRAINT \`FK_attendance_userId\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
            ) ENGINE=InnoDB;
        `);
    }

}
