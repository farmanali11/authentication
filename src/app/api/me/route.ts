import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyAccessToken } from "@/lib/jwt";
import User from "@/models/User";
import type { ApiResponse, SafeUser } from "@/types/auth";

// ─── GET /api/auth/me ─────────────────────────────────────────────
// Returns the currently logged-in user's profile.
// The client sends the access token in the Authorization header:
//   Authorization: Bearer <accessToken>
//
// This route is the "who am I?" endpoint — called on app startup
// or page refresh to rehydrate the auth state from a valid token.
// ─────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    // ── Step 1: Extract Bearer token from Authorization header ─
    const authHeader = req.headers.get("authorization");

    // Header must exist and start with "Bearer "
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Authorization token is required." },
        { status: 401 },
      );
    }

    // Split "Bearer <token>" and grab the token part
    const token = authHeader.split(" ")[1];

    if (!token) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Malformed authorization header." },
        { status: 401 },
      );
    }

    // ── Step 2: Verify the access token ───────────────────────
    const payload = verifyAccessToken(token);

    if (!payload) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Invalid or expired token." },
        { status: 401 },
      );
    }

    // ── Step 3: Fetch fresh user data from DB ─────────────────
    // We fetch from DB (not just decode the JWT) because:
    // - The user's name/role might have changed since token was issued
    // - We need to confirm the account still exists and is active
    // - JWTs are snapshots in time; DB has the current truth
    await connectDB();
    const user = await User.findById(payload.userId);

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "User not found." },
        { status: 404 },
      );
    }

    // ── Step 4: Return safe user object ───────────────────────
    const safeUser: SafeUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
    };

    return NextResponse.json<ApiResponse<SafeUser>>(
      { success: true, message: "User fetched successfully", data: safeUser },
      { status: 200 },
    );
  } catch (err) {
    console.error("[me] Unexpected error:", err);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Something went wrong." },
      { status: 500 },
    );
  }
}
