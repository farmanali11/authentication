import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";
import User from "@/models/User";
import type { ApiResponse } from "@/types/auth";

// ─── GET /api/auth/verify-email?token=xxxxx ───────────────────────
// The user clicks the link in their email → browser hits this route.
// We use GET because the user is navigating to a URL, not submitting a form.
// ─────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    // ── Step 1: Extract token from URL query params ────────────
    // NextRequest.nextUrl is a parsed URL object — cleaner than
    // manually splitting req.url
    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Verification token is missing." },
        { status: 400 },
      );
    }

    await connectDB();

    // ── Step 2: Find user by token ─────────────────────────────
    // We query by the token AND check expiry in one DB call.
    // emailVerificationToken and emailVerificationExpires are
    // select: false in the schema, so we must explicitly include them.
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() }, // $gt = greater than now
    }).select("+emailVerificationToken +emailVerificationExpires");

    // ── Step 3: Handle invalid or expired token ────────────────
    if (!user) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message:
            "Verification link is invalid or has expired. Please request a new one.",
        },
        { status: 400 },
      );
    }

    // ── Step 4: Already verified? ──────────────────────────────
    // Handles the case where the user clicks the link twice.
    if (user.isEmailVerified) {
      return NextResponse.json<ApiResponse>(
        { success: true, message: "Email already verified. You can log in." },
        { status: 200 },
      );
    }

    // ── Step 5: Mark as verified, clear the token ──────────────
    // We delete the token fields after use — one-time use enforced.
    // If the link is clicked again, step 2's query returns null.
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;

    // .save() triggers the pre-save hook — but since we didn't
    // modify password, isModified("password") returns false
    // and the hook skips re-hashing. Safe.
    await user.save();

    // ── Step 6: Send welcome email (best-effort) ───────────────
    await sendWelcomeEmail(user.name, user.email);

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: "Email verified successfully! You can now log in.",
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[verify-email] Unexpected error:", err);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Something went wrong." },
      { status: 500 },
    );
  }
}
