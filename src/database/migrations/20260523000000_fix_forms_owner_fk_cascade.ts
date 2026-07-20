import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

export class FixFormsOwnerFkCascade20260523000000 implements MigrationInterface {
  name = 'FixFormsOwnerFkCascade20260523000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('forms');
    if (!table) return;

    const ownerFk = table.foreignKeys.find((fk) => fk.columnNames.includes('ownerId'));
    if (ownerFk) {
      await queryRunner.dropForeignKey('forms', ownerFk);
    }

    await queryRunner.createForeignKey(
      'forms',
      new TableForeignKey({
        name: 'FK_forms_ownerId',
        columnNames: ['ownerId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('forms');
    if (!table) return;

    const ownerFk = table.foreignKeys.find((fk) => fk.columnNames.includes('ownerId'));
    if (ownerFk) {
      await queryRunner.dropForeignKey('forms', ownerFk);
    }

    await queryRunner.createForeignKey(
      'forms',
      new TableForeignKey({
        name: 'FK_forms_ownerId',
        columnNames: ['ownerId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
      }),
    );
  }
}
