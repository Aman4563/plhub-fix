/**
 * Quick Email Configuration Test Script
 * Run this to verify your email setup is working
 * 
 * Usage: node test-email.js
 */

import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

// Load environment variables
dotenv.config();

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

console.log('\n🧪 PLhub Email Configuration Test\n');
console.log('='.repeat(50));

// Step 1: Check if credentials are configured
console.log('\n📋 Step 1: Checking Configuration...\n');

if (!EMAIL_USER) {
  console.log('❌ EMAIL_USER is not configured in .env');
  process.exit(1);
}
console.log(`✅ EMAIL_USER: ${EMAIL_USER}`);

if (!EMAIL_PASS) {
  console.log('❌ EMAIL_PASS is not configured in .env');
  process.exit(1);
}
console.log(`✅ EMAIL_PASS: ${EMAIL_PASS.substring(0, 4)}${'*'.repeat(EMAIL_PASS.length - 4)} (${EMAIL_PASS.length} characters)`);

if (EMAIL_PASS.length !== 16) {
  console.log('⚠️  WARNING: App Password should be exactly 16 characters (without spaces)');
  console.log('   Your password length:', EMAIL_PASS.length);
}

if (!ADMIN_EMAIL) {
  console.log('⚠️  ADMIN_EMAIL is not configured (optional)');
} else {
  console.log(`✅ ADMIN_EMAIL: ${ADMIN_EMAIL}`);
}

// Step 2: Test SMTP connection
console.log('\n📡 Step 2: Testing SMTP Connection...\n');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

try {
  await transporter.verify();
  console.log('✅ SMTP Connection Successful!');
  console.log('   Gmail server is accessible and credentials are valid.\n');
} catch (error) {
  console.log('❌ SMTP Connection Failed!\n');
  console.log('Error:', error.message);
  console.log('\n💡 Common Issues:');
  console.log('   1. Using regular Gmail password instead of App Password');
  console.log('   2. App Password has spaces (remove them!)');
  console.log('   3. 2-Factor Authentication not enabled');
  console.log('   4. Wrong email address');
  console.log('\n📖 Solution:');
  console.log('   1. Enable 2FA: https://myaccount.google.com/security');
  console.log('   2. Create App Password: https://myaccount.google.com/apppasswords');
  console.log('   3. Copy the 16-character code (remove spaces)');
  console.log('   4. Update EMAIL_PASS in .env file\n');
  process.exit(1);
}

// Step 3: Send test email
console.log('📧 Step 3: Sending Test Email...\n');

const testEmail = ADMIN_EMAIL || EMAIL_USER;

try {
  const info = await transporter.sendMail({
    from: `"PLhub Test" <${EMAIL_USER}>`,
    to: testEmail,
    subject: '✅ PLhub Email Test Successful!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #e50914 0%, #b20710 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">🎉 Email Configuration Success!</h1>
        </div>
        <div style="background: #f5f5f5; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333;">Great news!</h2>
          <p style="color: #666; line-height: 1.6;">
            Your PLhub email system is now fully configured and working correctly.
          </p>
          <div style="background: white; padding: 20px; border-left: 4px solid #e50914; margin: 20px 0; border-radius: 4px;">
            <h3 style="margin-top: 0; color: #e50914;">✅ What's Working:</h3>
            <ul style="color: #666;">
              <li>SMTP connection to Gmail</li>
              <li>Authentication with App Password</li>
              <li>Email sending capability</li>
              <li>HTML email rendering</li>
            </ul>
          </div>
          <div style="background: #fff3cd; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;">
              <strong>⚡ Next Steps:</strong><br>
              Users will now receive beautiful confirmation emails when they:
              <ul style="margin: 10px 0;">
                <li>Subscribe to newsletter</li>
                <li>Submit contact forms</li>
                <li>Apply for jobs</li>
              </ul>
            </p>
          </div>
          <p style="color: #666;">
            Test timestamp: ${new Date().toLocaleString()}<br>
            From: ${EMAIL_USER}<br>
            To: ${testEmail}
          </p>
        </div>
      </div>
    `,
  });

  console.log('✅ Test Email Sent Successfully!');
  console.log(`   Message ID: ${info.messageId}`);
  console.log(`   Recipient: ${testEmail}`);
  console.log('\n🎉 ALL TESTS PASSED!\n');
  console.log('='.repeat(50));
  console.log('\n✨ Your email system is fully configured and operational!');
  console.log(`📬 Check ${testEmail} for the test email.\n`);
  console.log('💡 TIP: If you don\'t see it, check your spam folder.\n');

} catch (error) {
  console.log('❌ Failed to Send Test Email!\n');
  console.log('Error:', error.message);
  process.exit(1);
}

process.exit(0);

