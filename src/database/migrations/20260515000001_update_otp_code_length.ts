import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateOtpCodeLength20260515000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `password_reset_otps` MODIFY `code` varchar(255) NOT NULL',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `password_reset_otps` MODIFY `code` varchar(6) NOT NULL',
    );
  }
}
