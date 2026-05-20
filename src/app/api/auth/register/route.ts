import { NextRequest,NextResponse } from "next/server";

import { connectDB } from "@/lib/db";

import { registerSchema,parseBody } from "@/lib/validation";

import {generateVerificationToken,sendVerificationEmail} from "@/lib/email";

import User from "@/models/User";

import type { ApiResponse } from "@/types/auth";  


export async function POST(req:NextRequest){
  try {
    await connectDB();
    const body = await req.json();
    const parsed = parseBody(registerSchema, body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Validation failed",
          errors: parsed.errors,
        },
        { status: 400 },
      );
    }

    const { name, email, password } = parsed.data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Email already in use",
        },
        { status: 409 },
      );
    }

    const { token, expires } = generateVerificationToken();

    const user = await User.create({
      name,
      email,
      password,
      emailVerificationToken: token,
      emailVerificationExpires: expires,
      isEmailVerified: false,
    });

    const emailResult = await sendVerificationEmail(name, email, token);
    if (!emailResult.success) {
      console.warn(
        "[register] Email send failed for user:",
        email,
        "Error:",
        emailResult.error,
      );
    }

    return NextResponse.json<
      ApiResponse<{
        user: {
          id: string;
          name: string;
          email: string;
          role: "user" | "admin";
          isEmailVerified: boolean;
          createdAt: string;
        };
      }>
    >(
      {
        success: true,
        message: emailResult.success
          ? "Account created! Please check your email to verify your account."
          : "Account created! Email delivery failed — contact support.",
        data: {
          user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            createdAt: user.createdAt.toISOString(),
          },
        },
      },
      { status: 201 }, // 201 Created — not 200, because a resource was created
    );
  } catch (err) {
    // ── Global error handler ───────────────────────────────────
    // Log the real error on the server, send a generic message to
    // the client. Never expose stack traces or DB errors to users.
    console.error("[register] Unexpected error:", err);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: "Something went wrong. Please try again.",
      },
      { status: 500 },
    );
  }
}