import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class RefactorExpirationToDatetime1785317578000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop old expiration columns if they exist
        const hasDate = await queryRunner.hasColumn('forms', 'expirationDate');
        if (hasDate) {
            await queryRunner.query("ALTER TABLE `forms` DROP COLUMN `expirationDate`;");
        }
        
        const hasTime = await queryRunner.hasColumn('forms', 'expirationTime');
        if (hasTime) {
            await queryRunner.query("ALTER TABLE `forms` DROP COLUMN `expirationTime`;");
        }

        // Add new expirationAt datetime column if missing
        const hasExpAt = await queryRunner.hasColumn('forms', 'expirationAt');
        if (!hasExpAt) {
            await queryRunner.query("ALTER TABLE `forms` ADD COLUMN `expirationAt` datetime NULL;");
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Re-create old expiration columns if missing
        const hasDate = await queryRunner.hasColumn('forms', 'expirationDate');
        if (!hasDate) {
            await queryRunner.query("ALTER TABLE `forms` ADD COLUMN `expirationDate` varchar(50) NULL;");
        }

        const hasTime = await queryRunner.hasColumn('forms', 'expirationTime');
        if (!hasTime) {
            await queryRunner.query("ALTER TABLE `forms` ADD COLUMN `expirationTime` varchar(50) NULL;");
        }

        // Drop expirationAt datetime column if exists
        const hasExpAt = await queryRunner.hasColumn('forms', 'expirationAt');
        if (hasExpAt) {
            await queryRunner.query("ALTER TABLE `forms` DROP COLUMN `expirationAt`;");
        }
    }

}
