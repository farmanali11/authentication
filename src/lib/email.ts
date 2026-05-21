import { Resend } from "resend";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = "NextAuth <onboarding@resend.dev>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export function generateVerificationToken(): { token: string; expires: Date } {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000);
  return { token, expires };
}

export async function sendVerificationEmail(
  name: string,
  email: string,
  token: string,
): Promise<{ success: boolean; error?: string }> {
  const verifyUrl = `${APP_URL}/verify-email?token=${token}`;

  // ── DEV MODE BYPASS ───────────────────────────────────────────
  // In development, print the verification link to the terminal
  // instead of sending a real email. This lets you test the full
  // flow without needing Resend configured.
  // Remove this block (or set DEV_SKIP_EMAIL=false) when you're
  // ready to test real email delivery.
  // ─────────────────────────────────────────────────────────────
  if (process.env.NODE_ENV === "development") {
    console.log("\n──────────────────────────────────────────────");
    console.log("📧  DEV EMAIL — verification link for:", email);
    console.log("🔗  " + verifyUrl);
    console.log("──────────────────────────────────────────────\n");
    return { success: true };
  }

  // ── PRODUCTION: use Resend ────────────────────────────────────
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Verify your email address",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #111827;">Hi ${name}, welcome!</h2>
          <p style="color: #374151; font-size: 15px; line-height: 1.6;">
            Please verify your email address. This link expires in <strong>1 hour</strong>.
          </p>
          <a href="${verifyUrl}"
            style="display:inline-block;margin:24px 0;padding:12px 28px;
            background-color:#4f46e5;color:#fff;text-decoration:none;
            border-radius:6px;font-size:15px;font-weight:600;">
            Verify Email Address
          </a>
          <p style="color:#6b7280;font-size:13px;">
            If you didn't create an account, ignore this email.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("[sendVerificationEmail] Resend error:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error("[sendVerificationEmail] Unexpected error:", err);
    return { success: false, error: "Failed to send verification email" };
  }
}

// ─── Send password reset email ────────────────────────────────────
export async function sendPasswordResetEmail(
  name: string,
  email: string,
  token: string,
): Promise<{ success: boolean; error?: string }> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  if (process.env.NODE_ENV === "development") {
    console.log("\n──────────────────────────────────────────────");
    console.log("📧  DEV EMAIL — password reset link for:", email);
    console.log("🔗  " + resetUrl);
    console.log("──────────────────────────────────────────────\n");
    return { success: true };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Reset your password",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
          <h2 style="color:#111827;">Hi ${name},</h2>
          <p style="color:#374151;font-size:15px;line-height:1.6;">
            We received a request to reset your password.
            This link expires in <strong>1 hour</strong>.
            If you didn't request this, ignore this email.
          </p>
          <a href="${resetUrl}"
            style="display:inline-block;margin:24px 0;padding:12px 28px;
            background-color:#4f46e5;color:#fff;text-decoration:none;
            border-radius:6px;font-size:15px;font-weight:600;">
            Reset Password
          </a>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
          <p style="color:#9ca3af;font-size:12px;">
            Or copy: <span style="color:#4f46e5;">${resetUrl}</span>
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("[sendPasswordResetEmail] Resend error:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error("[sendPasswordResetEmail] Unexpected error:", err);
    return { success: false, error: "Failed to send reset email" };
  }
}

export async function sendWelcomeEmail(
  name: string,
  email: string,
): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    console.log(`📧  DEV EMAIL — welcome email would be sent to: ${email}`);
    return;
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Your account is verified 🎉",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
          <h2 style="color:#111827;">You're all set, ${name}!</h2>
          <p style="color:#374151;font-size:15px;">Your email has been verified. You can now log in.</p>
          <a href="${APP_URL}/login"
            style="display:inline-block;margin:24px 0;padding:12px 28px;
            background-color:#4f46e5;color:#fff;text-decoration:none;
            border-radius:6px;font-size:15px;font-weight:600;">
            Go to Login
          </a>
        </div>
      `,
    });
  } catch (err) {
    console.error("[sendWelcomeEmail] Failed:", err);
  }
}
