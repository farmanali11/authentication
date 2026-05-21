import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
// import { forgotPasswordSchema, parseBody } from "@/lib/validations";
import { generateVerificationToken } from "@/lib/email";
import { sendPasswordResetEmail } from "@/lib/email";
import User from "@/models/User";
import type { ApiResponse } from "@/types/auth";
import { forgotPasswordSchema, parseBody } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const parsed = parseBody(forgotPasswordSchema, body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Validation failed", errors: parsed.errors },
        { status: 400 },
      );
    }

    const { email } = parsed.data;

    // ── ALWAYS return 200 — even if email not found ────────────
    // This is the anti-enumeration pattern again.
    // If we returned 404 for unknown emails, an attacker could
    // probe which emails are registered in your database.
    // We return the same success message regardless of whether
    // the email exists — the user just won't receive a link.
    const SAFE_RESPONSE = NextResponse.json<ApiResponse>(
      {
        success: true,
        message:
          "If an account with that email exists, a reset link has been sent.",
      },
      { status: 200 },
    );

    const user = await User.findOne({ email });
    if (!user) return SAFE_RESPONSE; // silently do nothing

    // ── Rate limit: don't spam reset emails ───────────────────
    // If a valid (unexpired) reset token already exists, the user
    // requested one recently. Make them wait before requesting again.
    // This prevents abuse (someone hammering the endpoint).
    if (
      user.passwordResetToken &&
      user.passwordResetExpires &&
      user.passwordResetExpires > new Date()
    ) {
      // Still return the safe response — don't reveal a token exists
      return SAFE_RESPONSE;
    }

    // ── Generate and save reset token ─────────────────────────
    const { token, expires } = generateVerificationToken(); // reuse same util

    // We must explicitly select these fields since they're select:false
    user.passwordResetToken = token;
    user.passwordResetExpires = expires;

    // { validateBeforeSave: false } skips all schema validators on save.
    // We only changed the reset token fields — we don't want Mongoose
    // to re-validate name, email, password etc. unnecessarily.
    await user.save({ validateBeforeSave: false });

    // ── Send email ────────────────────────────────────────────
    await sendPasswordResetEmail(user.name, user.email, token);

    return SAFE_RESPONSE;
  } catch (err) {
    console.error("[forgot-password] Error:", err);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
