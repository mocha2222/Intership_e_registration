import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorFolderAndUser1785313578244 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Refactor Users table: drop googleId and language columns
        await queryRunner.query("ALTER TABLE `users` DROP COLUMN `googleId`;");
        await queryRunner.query("ALTER TABLE `users` DROP COLUMN `language`;");

        // Refactor Forms table:
        // 1. Add folderId column
        await queryRunner.query("ALTER TABLE `forms` ADD COLUMN `folderId` int NULL;");
        
        // 2. Map existing folderKey numeric records into folderId
        await queryRunner.query("UPDATE `forms` SET `folderId` = CAST(`folderKey` AS SIGNED) WHERE `folderKey` REGEXP '^[0-9]+$';");

        // 3. Drop old folderKey column
        await queryRunner.query("ALTER TABLE `forms` DROP COLUMN `folderKey`;");

        // 4. Add index and foreign key constraints
        await queryRunner.query("CREATE INDEX `IDX_forms_folderId` ON `forms` (`folderId`);");
        await queryRunner.query("ALTER TABLE `forms` ADD CONSTRAINT `FK_forms_folderId` FOREIGN KEY (`folderId`) REFERENCES `folders` (`id`) ON DELETE SET NULL;");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key and index
        await queryRunner.query("ALTER TABLE `forms` DROP FOREIGN KEY `FK_forms_folderId`;");
        await queryRunner.query("DROP INDEX `IDX_forms_folderId` ON `forms`;");

        // Restore folderKey column
        await queryRunner.query("ALTER TABLE `forms` ADD COLUMN `folderKey` varchar(100) NOT NULL DEFAULT 'all';");
        await queryRunner.query("UPDATE `forms` SET `folderKey` = CAST(`folderId` AS CHAR) WHERE `folderId` IS NOT NULL;");
        await queryRunner.query("ALTER TABLE `forms` DROP COLUMN `folderId`;");

        // Restore Users columns
        await queryRunner.query("ALTER TABLE `users` ADD COLUMN `googleId` varchar(64) NULL;");
        await queryRunner.query("ALTER TABLE `users` ADD COLUMN `language` varchar(2) NOT NULL DEFAULT 'en';");
    }

}
