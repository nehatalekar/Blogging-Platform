import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function sendOtpEmail(
  email: string,
  otp: string
): Promise<void> {
  // Determine the 'From' header. Use EMAIL_FROM if provided, otherwise fall back to EMAIL_USER.
  const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  if (!fromAddress) {
    throw new Error(
      "No sender configured. Set EMAIL_FROM (preferred) or EMAIL_USER in your environment variables."
    );
  }

  // Log warning only in development
  if (!process.env.EMAIL_FROM && process.env.NODE_ENV === "development") {
    console.warn(
      `Warning: EMAIL_FROM not set. Using ${fromAddress} as the From header. Some SMTP relays require a verified sender address; set EMAIL_FROM to a verified email in your Brevo dashboard.`
    );
  }

  try {
    await transporter.sendMail({
      from: `BlogPlatform <${fromAddress}>`,
      to: email,
      subject: "Your OTP Code for Email Verification",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Email Verification</h2>
          <p>Your OTP code is:</p>
          <h1 style="color: #007bff; letter-spacing: 5px;">${otp}</h1>
          <p>This code is valid for 5 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });
  } catch (error: any) {
    // Provide more context including response if available
    const details = error.response || error.message || String(error);
    const errorMsg = `Failed to send OTP email to ${email}: ${details}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
}
