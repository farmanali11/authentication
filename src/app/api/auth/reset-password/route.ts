import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import type { ApiResponse } from "@/types/auth";
import { parseBody, resetPasswordSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const parsed = parseBody(resetPasswordSchema, body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Validation failed", errors: parsed.errors },
        { status: 400 },
      );
    }

    const { token, password } = parsed.data;

    // ── Find user by valid, unexpired token ────────────────────
    // We query passwordResetToken AND check expiry in one shot.
    // select("+field") is required since both are select:false.
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    }).select("+passwordResetToken +passwordResetExpires");

    if (!user) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message:
            "Reset link is invalid or has expired. Please request a new one.",
        },
        { status: 400 },
      );
    }

    // ── Update password ────────────────────────────────────────
    // We set the new plain-text password — the pre-save hook in
    // User.ts will hash it automatically when .save() runs.
    user.password = password;
    user.passwordResetToken = null; // one-time use — invalidate immediately
    user.passwordResetExpires = null;

    // .save() triggers the pre-save hook → password gets hashed.
    // We do NOT use { validateBeforeSave: false } here because we
    // WANT Mongoose to validate the new password length etc.
    await user.save();

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message:
          "Password reset successfully. You can now log in with your new password.",
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[reset-password] Error:", err);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
