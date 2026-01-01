require('dotenv').config({ path: '.env' });
const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const TEST_EMAIL = process.env.TEST_EMAIL || SMTP_USER;

console.log('\n' + '='.repeat(60));
console.log('📧 Testing Email Configuration');
console.log('='.repeat(60));
console.log('SMTP Host:', SMTP_HOST);
console.log('SMTP Port:', SMTP_PORT);
console.log('SMTP User:', SMTP_USER);
console.log('Test Email:', TEST_EMAIL);
console.log('='.repeat(60) + '\n');

if (!SMTP_USER || !SMTP_PASS || SMTP_USER === 'your-email@gmail.com') {
  console.error('❌ SMTP credentials not configured!');
  console.error('\n📝 To set up Gmail:');
  console.error('1. Go to: https://myaccount.google.com/apppasswords');
  console.error('2. Enable 2-Step Verification first if not enabled');
  console.error('3. Generate an App Password for "Mail"');
  console.error('4. Update your .env file:');
  console.error('   SMTP_USER=your-email@gmail.com');
  console.error('   SMTP_PASS=your-16-character-app-password');
  console.error('\nThen run this test again: node scripts/test-email.js\n');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

async function testEmail() {
  try {
    console.log('🔄 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified!\n');

    const testOTP = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('📤 Sending test email...');
    console.log('To:', TEST_EMAIL);
    console.log('OTP:', testOTP);

    const info = await transporter.sendMail({
      from: `"PCE Campus Assistant" <${SMTP_USER}>`,
      to: TEST_EMAIL,
      subject: 'Test OTP Email - PCE Campus Assistant',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Test OTP Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">PCE Campus Assistant</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
            <h2 style="color: #667eea; margin-top: 0;">Test Email - Password Reset OTP</h2>
            <p>This is a test email to verify email configuration.</p>
            <p>Your test verification code is:</p>
            <div style="background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #667eea; font-size: 36px; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">${testOTP}</h1>
            </div>
            <p style="color: #666; font-size: 14px;">If you received this email, your email configuration is working correctly!</p>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              Providence College of Engineering<br>
              Campus Assistant Admin Portal
            </p>
          </div>
        </body>
        </html>
      `,
      text: `Test OTP: ${testOTP}\n\nIf you received this email, your email configuration is working!`,
    });

    console.log('\n✅ Email sent successfully!');
    console.log('📬 Message ID:', info.messageId);
    console.log('📧 Check your inbox at:', TEST_EMAIL);
    console.log('🔑 Test OTP Code:', testOTP);
    console.log('\n✅ Email configuration is working correctly!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error sending email:', error.message);
    
    if (error.code === 'EAUTH') {
      console.error('\n⚠️  Authentication failed!');
      console.error('Possible issues:');
      console.error('1. Wrong email or password');
      console.error('2. Not using App Password (Gmail requires App Password, not regular password)');
      console.error('3. 2-Step Verification not enabled');
      console.error('\n📝 Fix:');
      console.error('1. Go to: https://myaccount.google.com/apppasswords');
      console.error('2. Generate a new App Password');
      console.error('3. Update SMTP_PASS in .env file with the 16-character App Password\n');
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      console.error('\n⚠️  Connection failed!');
      console.error('Check your internet connection and SMTP settings.\n');
    } else {
      console.error('\nError details:', error);
    }
    
    process.exit(1);
  }
}

testEmail();

