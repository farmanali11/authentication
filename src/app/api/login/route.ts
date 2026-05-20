import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { loginSchema, parseBody } from "@/lib/validation";
import {
  signAccessToken,
  signRefreshToken,
  refreshCookieOptions,
} from "@/lib/jwt";
import User from "@/models/User";
import type { ApiResponse, AuthRespone } from "@/types/auth";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // ── Step 1: Validate input ─────────────────────────────────
    const body = await req.json();
    const parsed = parseBody(loginSchema, body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Validation failed", errors: parsed.errors },
        { status: 400 },
      );
    }

    const { email, password } = parsed.data;

    // ── Step 2: Find user — explicitly include password ────────
    // Remember: password has select: false in the schema.
    // Without .select("+password"), user.password is undefined
    // and comparePassword() will always return false.
    const user = await User.findOne({ email }).select(
      "+password +emailVerificationToken",
    );

    // ── Step 3: Verify credentials ─────────────────────────────
    // IMPORTANT: We check user existence AND password in the same
    // condition and return the SAME error message for both cases.
    //
    // Why? If we said "user not found" vs "wrong password" separately,
    // an attacker could enumerate which emails are registered.
    // This is called a "timing-safe" / "user enumeration prevention" pattern.
    if (!user || !(await user.comparePassword(password))) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Invalid email or password" },
        { status: 401 },
      );
    }

    // ── Step 4: Check email verification ──────────────────────
    // Block unverified users from logging in.
    // This enforces the email verification step we built in register.
    if (!user.isEmailVerified) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message:
            "Please verify your email before logging in. Check your inbox.",
        },
        { status: 403 }, // 403 Forbidden — identity known, but access denied
      );
    }

    // ── Step 5: Sign both tokens ───────────────────────────────
    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    // ── Step 6: Build the response ─────────────────────────────
    const response = NextResponse.json<ApiResponse<AuthRespone>>(
      {
        success: true,
        message: "Login successful",
        data: {
          // Access token goes in the JSON body.
          // The client stores it in a JS variable (memory) — NOT localStorage.
          accessToken,
          user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            createdAt: user.createdAt,
          },
        },
      },
      { status: 200 },
    );

    // ── Step 7: Set refresh token as httpOnly cookie ───────────
    // This is the critical security step.
    // The refresh token never appears in the JSON response.
    // It lives in a cookie JavaScript cannot read (httpOnly).
    // Even if an XSS attack runs arbitrary JS on your page,
    // it cannot steal the refresh token.
    response.cookies.set(
      refreshCookieOptions.name,
      refreshToken,
      refreshCookieOptions.options,
    );

    return response;
  } catch (err) {
    console.error("[login] Unexpected error:", err);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
