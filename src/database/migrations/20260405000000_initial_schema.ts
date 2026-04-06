import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema20260405000000 implements MigrationInterface {
  name = 'InitialSchema20260405000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── CREATE TABLE: users ──
    await queryRunner.query(`
      CREATE TABLE \`users\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`email\` varchar(255) NOT NULL,
        \`passwordHash\` varchar(120) NULL,
        \`name\` varchar(120) NOT NULL,
        \`username\` varchar(120) NULL,
        \`avatarUrl\` varchar(512) NULL,
        \`phoneNumber\` varchar(30) NULL,
        \`organizationName\` varchar(200) NULL,
        \`googleId\` varchar(64) NULL,
        \`language\` varchar(2) NOT NULL DEFAULT 'en',
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`IDX_users_email\` (\`email\`),
        UNIQUE INDEX \`IDX_users_googleId\` (\`googleId\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    // ── CREATE TABLE: forms ──
    await queryRunner.query(`
      CREATE TABLE \`forms\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`ownerId\` int NOT NULL,
        \`title\` varchar(140) NOT NULL,
        \`description\` text NULL,
        \`schema\` json NULL,
        \`status\` varchar(30) NOT NULL DEFAULT 'enabled',
        \`layoutType\` varchar(30) NOT NULL DEFAULT 'classic',
        \`folderKey\` varchar(100) NOT NULL DEFAULT 'all',
        \`label\` varchar(100) NULL,
        \`pages\` json NULL,
        \`nextElementId\` int NOT NULL DEFAULT 1,
        \`logoUrl\` longtext NULL,
        \`design\` json NULL,
        \`isPublished\` tinyint NOT NULL DEFAULT 0,
        \`isFavorite\` tinyint NOT NULL DEFAULT 0,
        \`isArchived\` tinyint NOT NULL DEFAULT 0,
        \`trashedAt\` datetime NULL,
        \`accessMode\` varchar(20) NOT NULL DEFAULT 'public',
        \`permissionMode\` varchar(30) NOT NULL DEFAULT 'submit_and_view',
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        INDEX \`IDX_forms_ownerId\` (\`ownerId\`),
        INDEX \`IDX_forms_isPublished\` (\`isPublished\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_forms_ownerId\` FOREIGN KEY (\`ownerId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    // ── CREATE TABLE: folders ──
    await queryRunner.query(`
      CREATE TABLE \`folders\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`ownerId\` int NOT NULL,
        \`name\` varchar(120) NOT NULL,
        \`color\` varchar(20) NOT NULL DEFAULT '#4eaee7',
        \`parentId\` int NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        INDEX \`IDX_folders_ownerId\` (\`ownerId\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_folders_ownerId\` FOREIGN KEY (\`ownerId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_folders_parentId\` FOREIGN KEY (\`parentId\`) REFERENCES \`folders\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    // ── CREATE TABLE: form_responses ──
    await queryRunner.query(`
      CREATE TABLE \`form_responses\` (
        \`id\` varchar(36) NOT NULL,
        \`formId\` int NOT NULL,
        \`userId\` int NULL,
        \`qrToken\` text NOT NULL,
        \`formData\` json NULL,
        \`status\` varchar(20) NOT NULL DEFAULT 'pending',
        \`submittedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`checkInTime\` datetime NULL,
        \`scanLogs\` json NULL,
        \`metadata\` json NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        INDEX \`IDX_responses_formId\` (\`formId\`),
        INDEX \`IDX_responses_userId\` (\`userId\`),
        INDEX \`IDX_responses_status\` (\`status\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_responses_formId\` FOREIGN KEY (\`formId\`) REFERENCES \`forms\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_responses_userId\` FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`form_responses\``);
    await queryRunner.query(`DROP TABLE \`folders\``);
    await queryRunner.query(`DROP TABLE \`forms\``);
    await queryRunner.query(`DROP TABLE \`users\``);
  }
}
