// utils/sendEmail.js
import nodemailer from "nodemailer";

/**
 * Create a Nodemailer transporter from environment variables.
 * Criticals retained: EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS.
 */
function createTransporter() {
  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env;

  if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS) {
    throw new Error(
      "Email configuration missing. Ensure EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS are set in .env"
    );
  }

  const port = Number(EMAIL_PORT);
  const secure = port === 465; // TLS for 465, STARTTLS otherwise

  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port,
    secure,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });
}

/**
 * Core email sender.
 * - Keeps generic signature: to, subject, message (critical).
 * - Accepts plain string OR an object { html, text }.
 */
export default async function sendEmail(to, subject, message) {
  const transporter = createTransporter();

  let html, text;
  if (typeof message === "string") {
    html = `<p>${message}</p>`;
    text = message.replace(/<[^>]+>/g, "");
  } else {
    html = message?.html || "<p></p>";
    text =
      message?.text ||
      (message?.html ? message.html.replace(/<[^>]+>/g, "") : "");
  }

  const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const mailOptions = {
    from: fromAddress,
    to,
    subject,
    text,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${to} | subject="${subject}" | id=${info.messageId}`);
    return info;
  } catch (err) {
    console.error("❌ Error sending email:", err);
    throw err;
  }
}

/* -----------------------------
   Polished, ready-to-use templates
   ----------------------------- */

/**
 * Welcome email template (HTML + text).
 */
export function generateWelcomeEmail(name, appUrl = "http://localhost:5000/login") {
  const subject = "Welcome to Gaige's Food Hub 🍳";
  const html = `
    <div style="font-family: Arial, sans-serif; color:#333; line-height:1.6;">
      <h1 style="color:#e67e22; text-align:center; margin:0 0 16px;">Welcome to Gaige's Food Hub!</h1>
      <p>We're excited to have you join our cooking community. Learn, practice, and master culinary skills with guided lessons and AI‑powered quizzes.</p>
      <h2 style="color:#2c3e50; margin:20px 0 8px;">Get started:</h2>
      <ul style="padding-left:20px; margin:0 0 16px;">
        <li><strong>Explore lessons</strong> like Kitchen Basics & Safety.</li>
        <li><strong>Take quizzes</strong> and get instant feedback.</li>
        <li><strong>Track progress</strong> with badges and streaks.</li>
      </ul>
      <div style="text-align:center; margin:24px 0;">
        <a href="${appUrl}" style="background:#e67e22; color:#fff; padding:12px 20px; text-decoration:none; border-radius:6px; display:inline-block;">
          Get Started
        </a>
      </div>
      <p style="font-size:0.9em; color:#777;">Happy cooking,<br/>The Food Hub Team</p>
    </div>
  `;
  const text = `Welcome to Gaige's Food Hub!
We're excited to have you join our cooking community. Learn, practice, and master culinary skills with guided lessons and AI‑powered quizzes.

Get started:
- Explore lessons like Kitchen Basics & Safety
- Take quizzes and get instant feedback
- Track progress with badges and streaks

Visit: ${appUrl}

Happy cooking,
The Food Hub Team`;

  return { subject, html, text };
}

/**
 * Forgot password email template (HTML + text).
 */
export function generatePasswordResetEmail(name, resetUrl) {
  const subject = "Reset your Food Hub password";
  const html = `
    <div style="font-family: Arial, sans-serif; color:#333; line-height:1.6;">
      <h1 style="color:#e67e22; text-align:center; margin:0 0 16px;">Password reset request</h1>
      <p>Hi ${name}, we received a request to reset your Food Hub password.</p>
      <p>Click the button below to choose a new password. If you didn't request this, you can safely ignore this email.</p>
      <div style="text-align:center; margin:24px 0;">
        <a href="${resetUrl}" style="background:#e67e22; color:#fff; padding:12px 20px; text-decoration:none; border-radius:6px; display:inline-block;">
          Reset Password
        </a>
      </div>
      <p style="font-size:0.9em; color:#777;">For security, this link may expire. If it does, request a new reset from the login page.</p>
    </div>
  `;
  const text = `Password reset request

Hi ${name}, we received a request to reset your Food Hub password.
Use this link to set a new password: ${resetUrl}
If you didn't request this, ignore this email. The link may expire; request a new one if needed.`;

  return { subject, html, text };
}

/* -----------------------------
   Convenience wrappers
   ----------------------------- */

/**
 * Send a welcome email using the template.
 */
export async function sendWelcomeEmail(user, appUrl) {
  const { subject, html, text } = generateWelcomeEmail(user?.name || "there", appUrl);
  return sendEmail(user.email, subject, { html, text });
}

/**
 * Send a password reset email using the template.
 */
export async function sendPasswordResetEmail(user, resetUrl) {
  const { subject, html, text } = generatePasswordResetEmail(user?.name || "there", resetUrl);
  return sendEmail(user.email, subject, { html, text });
}