import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import {
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
  refreshCookieOptions,
} from "@/lib/jwt";
import User from "@/models/User";
import type { ApiResponse, AuthRespone } from "@/types/auth";

// ─── What this route does ─────────────────────────────────────────
// The access token expires every 15 minutes. When it does, the
// frontend silently calls this route. We:
//   1. Read the refresh token from the httpOnly cookie
//   2. Verify it is valid and not expired
//   3. Check the user still exists in DB (not deleted/banned)
//   4. Issue a brand-new access token AND a new refresh token
//
// Step 4 is called "Refresh Token Rotation" — every refresh
// issues a new refresh token and invalidates the old one (by
// overwriting the cookie). This limits the damage if a refresh
// token is somehow stolen — it can only be used once.
// ─────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // ── Step 1: Read refresh token from cookie ─────────────────
    // cookies().get() reads the httpOnly cookie — this is SERVER
    // side code so it CAN read httpOnly cookies. Browser JS cannot.
    const refreshToken = req.cookies.get("refreshToken")?.value;

    if (!refreshToken) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "No refresh token found. Please log in." },
        { status: 401 },
      );
    }

    // ── Step 2: Verify the refresh token ──────────────────────
    const payload = verifyRefreshToken(refreshToken);

    if (!payload) {
      // Token is expired, tampered, or wrong type.
      // Clear the cookie so the client is in a clean state.
      const response = NextResponse.json<ApiResponse>(
        { success: false, message: "Session expired. Please log in again." },
        { status: 401 },
      );
      response.cookies.set("refreshToken", "", { maxAge: 0, path: "/" });
      return response;
    }

    // ── Step 3: Confirm user still exists ─────────────────────
    // The token could be valid but the user deleted their account
    // or was banned by an admin after the token was issued.
    // JWTs don't know about DB changes — we must check manually.
    await connectDB();
    const user = await User.findById(payload.userId);

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "User no longer exists." },
        { status: 401 },
      );
    }

    // ── Step 4: Issue fresh tokens (rotation) ─────────────────
    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const newAccessToken = signAccessToken(tokenPayload);
    const newRefreshToken = signRefreshToken(tokenPayload);

    // ── Step 5: Send new access token in body, refresh in cookie
    const response = NextResponse.json<ApiResponse<AuthRespone>>(
      {
        success: true,
        message: "Token refreshed",
        data: {
          accessToken: newAccessToken,
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

    // Overwrite the old refresh token cookie with the new one
    response.cookies.set(
      refreshCookieOptions.name,
      newRefreshToken,
      refreshCookieOptions.options,
    );

    return response;
  } catch (err) {
    console.error("[refresh] Unexpected error:", err);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Something went wrong." },
      { status: 500 },
    );
  }
}
