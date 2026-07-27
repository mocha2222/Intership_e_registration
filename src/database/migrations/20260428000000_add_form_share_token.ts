import { MigrationInterface, QueryRunner } from 'typeorm';
import * as crypto from 'crypto';

export class AddFormShareToken20260428000000 implements MigrationInterface {
  name = 'AddFormShareToken20260428000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`forms\`
      ADD \`shareToken\` varchar(64) NULL
    `);

    const rows = (await queryRunner.query(
      `SELECT \`id\` FROM \`forms\` WHERE \`shareToken\` IS NULL`,
    )) as Array<{ id: number }>;

    for (const row of rows) {
      await queryRunner.query(
        `UPDATE \`forms\` SET \`shareToken\` = ? WHERE \`id\` = ?`,
        [crypto.randomBytes(24).toString('hex'), row.id],
      );
    }

    await queryRunner.query(`
      ALTER TABLE \`forms\`
      MODIFY \`shareToken\` varchar(64) NOT NULL
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX \`IDX_forms_shareToken\`
      ON \`forms\` (\`shareToken\`)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX \`IDX_forms_shareToken\` ON \`forms\``);
    await queryRunner.query(`
      ALTER TABLE \`forms\`
      DROP COLUMN \`shareToken\`
    `);
  }
}
