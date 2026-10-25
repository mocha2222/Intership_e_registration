import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1790007726592 implements MigrationInterface {
    name = 'InitialSchema1790007726592'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`form_responses\` (\`id\` varchar(36) NOT NULL, \`formId\` int NOT NULL, \`qrToken\` varchar(255) NOT NULL, \`formData\` json NULL, \`status\` varchar(20) NOT NULL DEFAULT 'pending', \`submittedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`checkInTime\` datetime NULL, \`scanLogs\` json NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_8e9a32f15bd2485ea908787b63\` (\`formId\`), INDEX \`IDX_bab212bc50d3ef6a020c6015a5\` (\`qrToken\`), INDEX \`IDX_4bbfa8c61c220c4c34b11d498d\` (\`status\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`form_materials\` (\`id\` int NOT NULL AUTO_INCREMENT, \`formId\` int NOT NULL, \`originalName\` varchar(255) NOT NULL, \`storedFilename\` varchar(255) NOT NULL, \`mimeType\` varchar(100) NOT NULL, \`size\` int NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`IDX_5bc8e22f90a5882e836be8a7e3\` (\`formId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`folders\` (\`id\` int NOT NULL AUTO_INCREMENT, \`ownerId\` int NOT NULL, \`name\` varchar(120) NOT NULL, \`color\` varchar(20) NOT NULL DEFAULT '#4eaee7', \`parentId\` int NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_6228242ce9f7a8f3aec9397c6a\` (\`ownerId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`form_settings\` (\`id\` int NOT NULL AUTO_INCREMENT, \`formId\` int NOT NULL, \`submissionStartTime\` datetime NULL, \`submissionEndTime\` datetime NULL, \`permissionMode\` varchar(255) NOT NULL DEFAULT 'submit_and_view', \`materialUploadEnabled\` tinyint NOT NULL DEFAULT 0, \`expirationAt\` datetime NULL, \`submissionLimit\` int NULL, UNIQUE INDEX \`IDX_743c454af49462477481bcc83a\` (\`formId\`), UNIQUE INDEX \`REL_743c454af49462477481bcc83a\` (\`formId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`form_attendances\` (\`id\` int NOT NULL AUTO_INCREMENT, \`formId\` int NOT NULL, \`attendanceEnabled\` tinyint NOT NULL DEFAULT 0, \`eventStartTime\` datetime NULL, \`eventEndTime\` datetime NULL, \`attendanceCloseTime\` datetime NULL, UNIQUE INDEX \`IDX_f7728648702f71fac54153ff0e\` (\`formId\`), UNIQUE INDEX \`REL_f7728648702f71fac54153ff0e\` (\`formId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`forms\` (\`id\` int NOT NULL AUTO_INCREMENT, \`shareToken\` varchar(64) NOT NULL, \`ownerId\` int NOT NULL, \`title\` varchar(140) NOT NULL, \`description\` text NULL, \`schema\` json NULL, \`status\` varchar(30) NOT NULL DEFAULT 'enabled', \`layoutType\` varchar(30) NOT NULL DEFAULT 'classic', \`folderId\` int NULL, \`pages\` json NULL, \`nextElementId\` int NOT NULL DEFAULT '1', \`logoUrl\` longtext NULL, \`design\` json NULL, \`type\` varchar(30) NOT NULL DEFAULT 'form', \`isFavorite\` tinyint NOT NULL DEFAULT 0, \`isArchived\` tinyint NOT NULL DEFAULT 0, \`trashedAt\` datetime NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_32550cee2e8176c1724d2af81f\` (\`shareToken\`), INDEX \`IDX_7d869fca05264be285d85822df\` (\`ownerId\`), INDEX \`IDX_8252af70112b292f8a129ad1b5\` (\`folderId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` int NOT NULL AUTO_INCREMENT, \`email\` varchar(255) NOT NULL, \`passwordHash\` varchar(120) NOT NULL, \`name\` varchar(120) NOT NULL, \`username\` varchar(120) NULL, \`avatarUrl\` varchar(512) NULL, \`phoneNumber\` varchar(30) NULL, \`organizationName\` varchar(200) NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`form_responses\` ADD CONSTRAINT \`FK_8e9a32f15bd2485ea908787b634\` FOREIGN KEY (\`formId\`) REFERENCES \`forms\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`form_materials\` ADD CONSTRAINT \`FK_5bc8e22f90a5882e836be8a7e33\` FOREIGN KEY (\`formId\`) REFERENCES \`forms\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`folders\` ADD CONSTRAINT \`FK_6228242ce9f7a8f3aec9397c6a7\` FOREIGN KEY (\`ownerId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`folders\` ADD CONSTRAINT \`FK_1be2fce400dcc657602d336f23f\` FOREIGN KEY (\`parentId\`) REFERENCES \`folders\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`form_settings\` ADD CONSTRAINT \`FK_743c454af49462477481bcc83a5\` FOREIGN KEY (\`formId\`) REFERENCES \`forms\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`form_attendances\` ADD CONSTRAINT \`FK_f7728648702f71fac54153ff0e1\` FOREIGN KEY (\`formId\`) REFERENCES \`forms\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`forms\` ADD CONSTRAINT \`FK_7d869fca05264be285d85822df4\` FOREIGN KEY (\`ownerId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`forms\` ADD CONSTRAINT \`FK_8252af70112b292f8a129ad1b5e\` FOREIGN KEY (\`folderId\`) REFERENCES \`folders\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`forms\` DROP FOREIGN KEY \`FK_8252af70112b292f8a129ad1b5e\``);
        await queryRunner.query(`ALTER TABLE \`forms\` DROP FOREIGN KEY \`FK_7d869fca05264be285d85822df4\``);
        await queryRunner.query(`ALTER TABLE \`form_attendances\` DROP FOREIGN KEY \`FK_f7728648702f71fac54153ff0e1\``);
        await queryRunner.query(`ALTER TABLE \`form_settings\` DROP FOREIGN KEY \`FK_743c454af49462477481bcc83a5\``);
        await queryRunner.query(`ALTER TABLE \`folders\` DROP FOREIGN KEY \`FK_1be2fce400dcc657602d336f23f\``);
        await queryRunner.query(`ALTER TABLE \`folders\` DROP FOREIGN KEY \`FK_6228242ce9f7a8f3aec9397c6a7\``);
        await queryRunner.query(`ALTER TABLE \`form_materials\` DROP FOREIGN KEY \`FK_5bc8e22f90a5882e836be8a7e33\``);
        await queryRunner.query(`ALTER TABLE \`form_responses\` DROP FOREIGN KEY \`FK_8e9a32f15bd2485ea908787b634\``);
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
        await queryRunner.query(`DROP INDEX \`IDX_8252af70112b292f8a129ad1b5\` ON \`forms\``);
        await queryRunner.query(`DROP INDEX \`IDX_7d869fca05264be285d85822df\` ON \`forms\``);
        await queryRunner.query(`DROP INDEX \`IDX_32550cee2e8176c1724d2af81f\` ON \`forms\``);
        await queryRunner.query(`DROP TABLE \`forms\``);
        await queryRunner.query(`DROP INDEX \`REL_f7728648702f71fac54153ff0e\` ON \`form_attendances\``);
        await queryRunner.query(`DROP INDEX \`IDX_f7728648702f71fac54153ff0e\` ON \`form_attendances\``);
        await queryRunner.query(`DROP TABLE \`form_attendances\``);
        await queryRunner.query(`DROP INDEX \`REL_743c454af49462477481bcc83a\` ON \`form_settings\``);
        await queryRunner.query(`DROP INDEX \`IDX_743c454af49462477481bcc83a\` ON \`form_settings\``);
        await queryRunner.query(`DROP TABLE \`form_settings\``);
        await queryRunner.query(`DROP INDEX \`IDX_6228242ce9f7a8f3aec9397c6a\` ON \`folders\``);
        await queryRunner.query(`DROP TABLE \`folders\``);
        await queryRunner.query(`DROP INDEX \`IDX_5bc8e22f90a5882e836be8a7e3\` ON \`form_materials\``);
        await queryRunner.query(`DROP TABLE \`form_materials\``);
        await queryRunner.query(`DROP INDEX \`IDX_4bbfa8c61c220c4c34b11d498d\` ON \`form_responses\``);
        await queryRunner.query(`DROP INDEX \`IDX_bab212bc50d3ef6a020c6015a5\` ON \`form_responses\``);
        await queryRunner.query(`DROP INDEX \`IDX_8e9a32f15bd2485ea908787b63\` ON \`form_responses\``);
        await queryRunner.query(`DROP TABLE \`form_responses\``);
    }

}
