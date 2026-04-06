import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAttendanceSystem20260405000001 implements MigrationInterface {
  name = 'AddAttendanceSystem20260405000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── ALTER TABLE: forms (Adding Attendance and Timing fields) ──
    await queryRunner.query(`
      ALTER TABLE \`forms\` 
      ADD \`type\` varchar(30) NOT NULL DEFAULT 'form',
      ADD \`attendanceEnabled\` tinyint NOT NULL DEFAULT 0,
      ADD \`attendanceToken\` varchar(255) NULL,
      ADD \`attendanceStartAt\` datetime NULL,
      ADD \`attendanceEndAt\` datetime NULL,
      ADD \`submissionStartTime\` datetime NULL,
      ADD \`submissionEndTime\` datetime NULL,
      ADD \`eventStartTime\` datetime NULL,
      ADD \`eventEndTime\` datetime NULL,
      ADD \`attendanceCloseTime\` datetime NULL
    `);

    // ── CREATE TABLE: attendance ──
    await queryRunner.query(`
      CREATE TABLE \`attendance\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`formId\` int NOT NULL,
        \`userId\` int NOT NULL,
        \`checkedInAt\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX \`IDX_attendance_formId\` (\`formId\`),
        INDEX \`IDX_attendance_userId\` (\`userId\`),
        UNIQUE INDEX \`IDX_attendance_form_user\` (\`formId\`, \`userId\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_attendance_formId\` FOREIGN KEY (\`formId\`) REFERENCES \`forms\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`FK_attendance_userId\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`attendance\``);
    
    await queryRunner.query(`
      ALTER TABLE \`forms\` 
      DROP COLUMN \`attendanceCloseTime\`,
      DROP COLUMN \`eventEndTime\`,
      DROP COLUMN \`eventStartTime\`,
      DROP COLUMN \`submissionEndTime\`,
      DROP COLUMN \`submissionStartTime\`,
      DROP COLUMN \`attendanceEndAt\`,
      DROP COLUMN \`attendanceStartAt\`,
      DROP COLUMN \`attendanceToken\`,
      DROP COLUMN \`attendanceEnabled\`,
      DROP COLUMN \`type\`
    `);
  }
}
