import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/**
 * OTP Email Service using Nodemailer with Gmail SMTP
 * Uses Gmail SMTP by default, supports other SMTP providers if configured
 */

// SMTP Configuration from environment variables
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER || 'noreply@pce.edu';
const SMTP_SECURE = process.env.SMTP_SECURE === 'true' || SMTP_PORT === 465;

// Cached transporter instance
let transporter: Transporter | null = null;

/**
 * Get or create Nodemailer transporter
 * Uses Gmail SMTP by default
 */
function getTransporter(): Transporter {
  if (transporter) {
    return transporter;
  }

  // Validate SMTP configuration
  if (!SMTP_USER || !SMTP_PASS) {
    throw new Error(
      'SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS in .env file.\n' +
      'For Gmail: Use App Password (https://myaccount.google.com/apppasswords)\n' +
      '1. Enable 2-Step Verification: https://myaccount.google.com/security\n' +
      '2. Generate App Password: https://myaccount.google.com/apppasswords\n' +
      '3. Use the 16-character App Password as SMTP_PASS'
    );
  }

  // Create transporter
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    // Connection timeout settings
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  return transporter;
}

/**
 * Verify SMTP connection
 */
export async function verifySMTPConnection(): Promise<boolean> {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully');
    return true;
  } catch (error: any) {
    console.error('❌ SMTP connection verification failed:', error.message);
    throw new Error(`SMTP connection failed: ${error.message}`);
  }
}

/**
 * Generate OTP email HTML template
 */
function getOTPEmailHTML(otp: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification OTP</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
      <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">PCE Campus Assistant</h1>
                  <p style="color: rgba(255, 255, 255, 0.9); margin: 8px 0 0 0; font-size: 14px;">Email Verification</p>
                </td>
              </tr>
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 22px; font-weight: 600;">Email Verification OTP</h2>
                  <p style="color: #666666; margin: 0 0 24px 0; font-size: 16px; line-height: 1.6;">Thank you for registering with PCE Campus Assistant. Use the verification code below to complete your registration.</p>
                  
                  <!-- OTP Code Box -->
                  <div style="background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%); border: 2px solid #667eea; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                    <p style="color: #666666; margin: 0 0 12px 0; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
                    <div style="background: #ffffff; border-radius: 8px; padding: 20px; display: inline-block; min-width: 200px;">
                      <h1 style="color: #667eea; font-size: 42px; letter-spacing: 12px; margin: 0; font-family: 'Courier New', 'Monaco', monospace; font-weight: 700;">${otp}</h1>
                    </div>
                  </div>
                  
                  <p style="color: #999999; margin: 24px 0 0 0; font-size: 14px; line-height: 1.6;">This verification code will expire in <strong style="color: #667eea;">5 minutes</strong>. If you did not register for PCE Campus Assistant, please ignore this email.</p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding: 30px; background-color: #f9f9f9; border-radius: 0 0 12px 12px; border-top: 1px solid #e0e0e0;">
                  <p style="color: #999999; margin: 0; font-size: 12px; text-align: center; line-height: 1.6;">
                    <strong style="color: #666666;">Providence College of Engineering</strong><br>
                    Campus Assistant<br>
                    <span style="color: #cccccc;">This is an automated message. Please do not reply to this email.</span>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Generate OTP email plain text version
 */
function getOTPEmailText(otp: string): string {
  return `PCE Campus Assistant - Email Verification OTP

Thank you for registering with PCE Campus Assistant.

Your OTP is: ${otp}

Valid for 5 minutes.

If you did not register for PCE Campus Assistant, please ignore this email.

---
Providence College of Engineering
Campus Assistant

This is an automated message. Please do not reply to this email.`.trim();
}

/**
 * Send OTP email using Nodemailer SMTP
 * 
 * @param to - Recipient email address
 * @param otp - 6-digit numeric OTP
 * @param subject - Optional custom subject (default: "Email Verification OTP")
 * @throws Error if email sending fails
 */
export async function sendOTPEmail(to: string, otp: string, subject?: string): Promise<void> {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const normalizedEmail = to.toLowerCase().trim();
  
  if (!emailRegex.test(normalizedEmail)) {
    throw new Error('Invalid email address format');
  }

  // Validate OTP format (6 digits)
  if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
    throw new Error('Invalid OTP format. OTP must be a 6-digit number');
  }

  try {
    const transporter = getTransporter();
    
    // Send email
    const info = await transporter.sendMail({
      from: `"PCE Campus Assistant" <${SMTP_FROM}>`,
      to: normalizedEmail,
      subject: subject || 'Email Verification OTP',
      html: getOTPEmailHTML(otp),
      text: getOTPEmailText(otp),
    });

    console.log('✅ OTP email sent successfully via SMTP');
    console.log('   To:', normalizedEmail);
    console.log('   Message ID:', info.messageId);
    // DO NOT log OTP for security
  } catch (error: any) {
    console.error('❌ Failed to send OTP email:', error.message);
    
    // Provide helpful error messages for common issues
    let errorMessage = `Failed to send OTP email: ${error.message}`;
    
    if (error.message.includes('Invalid login') || error.message.includes('BadCredentials') || error.message.includes('535')) {
      errorMessage = `SMTP Authentication Failed: Please check your Gmail credentials in .env file.\n\n` +
        `For Gmail:\n` +
        `1. Enable 2-Step Verification: https://myaccount.google.com/security\n` +
        `2. Generate App Password: https://myaccount.google.com/apppasswords\n` +
        `3. Select "Mail" and "Other (Custom name)" → Enter "PCE Campus Assistant"\n` +
        `4. Copy the 16-character App Password (remove spaces)\n` +
        `5. Update .env: SMTP_USER=your-email@gmail.com, SMTP_PASS=your-app-password\n` +
        `6. Restart the server after updating .env\n\n` +
        `Important: Use App Password, NOT your regular Gmail password!`;
    } else if (error.message.includes('ECONNREFUSED') || error.message.includes('timeout')) {
      errorMessage = `SMTP Connection Failed: Check your internet connection and SMTP settings.\n` +
        `Verify SMTP_HOST and SMTP_PORT in .env file.`;
    } else if (error.message.includes('not configured')) {
      errorMessage = `SMTP not configured: Please set SMTP_USER and SMTP_PASS in .env file.`;
    }
    
    throw new Error(errorMessage);
  }
}

