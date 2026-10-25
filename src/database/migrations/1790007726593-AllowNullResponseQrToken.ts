import { MigrationInterface, QueryRunner } from 'typeorm';

export class AllowNullResponseQrToken1790007726593 implements MigrationInterface {
  name = 'AllowNullResponseQrToken1790007726593';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `form_responses` MODIFY `qrToken` varchar(500) NULL',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `form_responses` MODIFY `qrToken` varchar(500) NOT NULL',
    );
  }
}