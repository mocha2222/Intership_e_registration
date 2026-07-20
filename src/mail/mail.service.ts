import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('MAIL_HOST', 'smtp.gmail.com'),
      port: Number(this.config.get<string>('MAIL_PORT', '587')),
      secure: this.config.get<string>('MAIL_SECURE', 'false') === 'true',
      auth: {
        user: this.config.get<string>('MAIL_USER'),
        pass: this.config.get<string>('MAIL_PASS'),
      },
    });
  }

  async sendPasswordResetOtp(to: string, code: string): Promise<void> {
    const from =
      this.config.get<string>('MAIL_FROM') ||
      `"DEBC Event Management" <${this.config.get<string>('MAIL_USER')}>`;

    const mailOptions: nodemailer.SendMailOptions = {
      from,
      to,
      subject: 'Password Reset OTP – DEBC Event Management',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Password Reset OTP</title>
          <style>
            body { margin:0; padding:0; background:#f4f6fb; font-family: 'Segoe UI', Arial, sans-serif; }
            .wrapper { max-width:520px; margin:40px auto; background:#ffffff; border-radius:12px;
              box-shadow:0 4px 24px rgba(34,97,175,0.10); overflow:hidden; }
            .header { background:linear-gradient(135deg,#2261AF 0%,#1A4A8F 100%);
              padding:32px 40px; text-align:center; }
            .header h1 { margin:0; color:#fff; font-size:22px; font-weight:700; letter-spacing:-0.5px; }
            .header p  { margin:6px 0 0; color:rgba(255,255,255,0.8); font-size:13px; }
            .body { padding:36px 40px; }
            .body p { color:#374151; font-size:15px; line-height:1.6; margin:0 0 20px; }
            .otp-box { background:#f0f5ff; border:2px dashed #2261AF; border-radius:10px;
              padding:24px; text-align:center; margin:24px 0; }
            .otp-code { font-size:42px; font-weight:800; letter-spacing:12px;
              color:#2261AF; font-family:monospace; }
            .otp-hint { margin-top:8px; font-size:12px; color:#6B7280; }
            .warning { background:#FFF9E6; border-left:4px solid #F59E0B; border-radius:6px;
              padding:12px 16px; font-size:13px; color:#92400E; margin:20px 0 0; }
            .footer { background:#F9FAFB; padding:20px 40px; text-align:center;
              border-top:1px solid #E5E7EB; }
            .footer p { margin:0; font-size:12px; color:#9CA3AF; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="header">
              <h1>🔐 Password Reset</h1>
              <p>DEBC Event Management</p>
            </div>
            <div class="body">
              <p>Hello,</p>
              <p>We received a request to reset your password. Use the verification code below to continue. This code is valid for <strong>10 minutes</strong>.</p>
              <div class="otp-box">
                <div class="otp-code">${code}</div>
                <div class="otp-hint">Enter this code on the reset password page</div>
              </div>
              <div class="warning">
                ⚠️ <strong>Do not share this code with anyone.</strong> 
              </div>
              <p style="margin-top:20px; font-size:13px; color:#6B7280;">
                If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} DEBC Event Management Inc. · All rights reserved</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset OTP sent to ${to}`);
    } catch (err) {
      this.logger.error(`Failed to send OTP email to ${to}`, err);
      throw new Error('Failed to send email. Please try again later.');
    }
  }
}
