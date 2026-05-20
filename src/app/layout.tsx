import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

// ─── next/font ────────────────────────────────────────────────────
// next/font downloads the font at BUILD TIME and self-hosts it.
// Zero runtime requests to Google's servers — better privacy,
// better performance, no layout shift (the font is always available).
// ─────────────────────────────────────────────────────────────────
const inter = Inter({
  subsets: ["latin"],
  // variable lets us use the font as a CSS variable in Tailwind
  variable: "--font-inter",
  display: "swap", // show fallback font while inter loads
});

// ─── Metadata ─────────────────────────────────────────────────────
// Next.js uses this object to generate <head> tags automatically.
// Exported from any layout.tsx or page.tsx — no manual <Head> needed.
// ─────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    // %s is replaced by each page's own title
    // Result: "Login | NextAuth" or "Dashboard | NextAuth"
    template: "%s | NextAuth",
    default: "NextAuth",
  },
  description: "Secure authentication built with Next.js 15",
};

// ─── Root Layout ──────────────────────────────────────────────────
// This layout wraps EVERY page in the app — it is never unmounted.
// Rules:
//   1. Must contain <html> and <body>
//   2. Must be a Server Component (no "use client")
//   3. AuthProvider is a Client Component — but we can render it
//      here because Next.js allows Client Components as children
//      of Server Components. The boundary is fine-grained.
// ─────────────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-gray-50 text-gray-900 antialiased">
        {/*
          AuthProvider wraps everything so any component in any route
          can call useAuth() and get the current user / token.
          It also runs the silent session-restore on first mount.
        */}
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
