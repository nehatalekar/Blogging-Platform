// scripts/test-smtp.js
// Usage: set env vars in your shell or in a .env file, then run: node scripts/test-smtp.js
// Required env vars: SMTP_HOST, SMTP_PORT, EMAIL_USER, EMAIL_PASSWORD, EMAIL_TEST_RECEIVER (optional)

require('dotenv').config();
const nodemailer = require('nodemailer');

const host = process.env.SMTP_HOST;
const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
const user = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASSWORD;
const testTo = process.env.EMAIL_TEST_RECEIVER || user;

if (!host || !user || !pass) {
  console.error('Missing required env vars. Please set SMTP_HOST, EMAIL_USER and EMAIL_PASSWORD.');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: String(port) === '465',
  auth: {
    user,
    pass,
  },
});

async function run() {
  try {
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('SMTP verification succeeded. Attempting to send a test message...');

    if (!process.env.EMAIL_FROM) {
      console.warn('EMAIL_FROM is not set; the test will use the SMTP username as the From address. Some SMTP relays reject messages from unverified senders.');
    }

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || user,
      to: testTo,
      subject: 'SMTP Test from BlogPlatform',
      text: `This is a test email. If you received this, SMTP is working.`,
    });

    console.log('Test message sent successfully:', info.messageId || info.response);
  } catch (err) {
    console.error('SMTP test failed. Full error:');
    // Print full error including SMTP response details when available
    console.error(err);
    if (err && err.response) {
      console.error('SMTP server response:\n', err.response.toString());
    }
    if (err && err.code) {
      console.error('Error code:', err.code);
    }
    process.exit(2);
  }
}

run();
