import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types/auth";


export async function POST() {
  const response = NextResponse.json<ApiResponse>(
    {
      success: true,
      message: "Logged out successfully",
    },
    { status: 200 },
  );


  response.cookies.set("refreshToken", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0, 
    path: "/",
  });

  return response;
}
