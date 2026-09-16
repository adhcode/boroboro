import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly fromEmail: string;
  private readonly frontendUrl: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY not configured - emails will not be sent');
    }
    
    this.resend = new Resend(apiKey);
    this.fromEmail = this.configService.get<string>('EMAIL_FROM', 'noreply@boroboro.com');
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
  }

  async sendVerificationEmail(to: string, token: string, firstName: string): Promise<void> {
    const verifyUrl = `${this.frontendUrl}/verify-email?token=${token}`;

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject: 'Verify your email - Boroboro',
        html: this.getVerificationEmailTemplate(firstName, verifyUrl),
      });

      this.logger.log(`Verification email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${to}:`, error);
      // Don't throw - allow registration to succeed even if email fails
    }
  }

  private getVerificationEmailTemplate(firstName: string, verifyUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">Boroboro</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #111827;">
                Hi ${firstName},
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #4b5563;">
                Thanks for signing up! Please verify your email address to start listing items and making bookings.
              </p>
              <p style="margin: 0 0 32px 0; font-size: 16px; line-height: 1.6; color: #4b5563;">
                Click the button below to verify your email:
              </p>
              
              <!-- Button -->
              <table role="presentation" style="margin: 0 auto;">
                <tr>
                  <td style="border-radius: 6px; background-color: #486581;">
                    <a href="${verifyUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none;">
                      Verify Email
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 32px 0 0 0; font-size: 14px; line-height: 1.6; color: #6b7280;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0 0 0; font-size: 14px; line-height: 1.6; color: #486581; word-break: break-all;">
                ${verifyUrl}
              </p>
              
              <p style="margin: 32px 0 0 0; font-size: 14px; line-height: 1.6; color: #9ca3af;">
                This link will expire in 24 hours.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                If you didn't create an account, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }
}
