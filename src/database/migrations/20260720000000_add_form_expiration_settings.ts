import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddFormExpirationSettings20260720000000
  implements MigrationInterface
{
  name = 'AddFormExpirationSettings20260720000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.addColumnIfMissing(
      queryRunner,
      new TableColumn({
        name: 'expirationDate',
        type: 'varchar',
        length: '50',
        isNullable: true,
      }),
    );

    await this.addColumnIfMissing(
      queryRunner,
      new TableColumn({
        name: 'expirationTime',
        type: 'varchar',
        length: '50',
        isNullable: true,
      }),
    );

    await this.addColumnIfMissing(
      queryRunner,
      new TableColumn({
        name: 'submissionLimit',
        type: 'int',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.dropColumnIfExists(queryRunner, 'submissionLimit');
    await this.dropColumnIfExists(queryRunner, 'expirationTime');
    await this.dropColumnIfExists(queryRunner, 'expirationDate');
  }

  private async addColumnIfMissing(
    queryRunner: QueryRunner,
    column: TableColumn,
  ): Promise<void> {
    const hasColumn = await queryRunner.hasColumn('forms', column.name);
    if (!hasColumn) {
      await queryRunner.addColumn('forms', column);
    }
  }

  private async dropColumnIfExists(
    queryRunner: QueryRunner,
    columnName: string,
  ): Promise<void> {
    const hasColumn = await queryRunner.hasColumn('forms', columnName);
    if (hasColumn) {
      await queryRunner.dropColumn('forms', columnName);
    }
  }
}
