import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMaterialsSystem20260409000000 implements MigrationInterface {
  name = 'AddMaterialsSystem20260409000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── ALTER TABLE: forms (Add materialUploadEnabled flag) ──
    await queryRunner.query(`
      ALTER TABLE \`forms\` 
      ADD \`materialUploadEnabled\` tinyint NOT NULL DEFAULT 0
    `);

    // ── CREATE TABLE: form_materials ──
    await queryRunner.query(`
      CREATE TABLE \`form_materials\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`formId\` int NOT NULL,
        \`originalName\` varchar(255) NOT NULL,
        \`storedFilename\` varchar(255) NOT NULL,
        \`mimeType\` varchar(100) NOT NULL,
        \`size\` int NOT NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        INDEX \`IDX_form_materials_formId\` (\`formId\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_form_materials_formId\` FOREIGN KEY (\`formId\`) REFERENCES \`forms\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`form_materials\``);
    await queryRunner.query(`
      ALTER TABLE \`forms\` 
      DROP COLUMN \`materialUploadEnabled\`
    `);
  }
}
