// ─── Server Component ─────────────────────────────────────────────
// The page itself has zero client-side code. It just renders
// a heading and mounts the LoginForm (Client Component).
// Next.js streams the heading to the browser instantly, then
// hydrates the form. Best of both worlds.
// ─────────────────────────────────────────────────────────────────
import type { Metadata } from "next";
import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";

// Page-level metadata — fills in the %s in the root layout template
// Result: <title>Login | NextAuth</title>
export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to your NextAuth account",
};

export default function LoginPage() {
  return (
    <div className="space-y-6">
      {/* Page heading — server rendered, instant */}
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900">Welcome back</h2>
        <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
      </div>

      {/*
        Suspense is required here because LoginForm uses useSearchParams().
        Next.js requires any component that reads search params to be
        wrapped in Suspense — otherwise the build fails with an error.
        The fallback shows while the component hydrates on the client.
      */}
      <Suspense fallback={<FormSkeleton />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────
// Shown for the brief moment between server render and client hydration.
// Matches the approximate shape of the form so there's no layout shift.
// ─────────────────────────────────────────────────────────────────
function FormSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2].map((i) => (
        <div key={i} className="space-y-1.5">
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-100 rounded-lg" />
        </div>
      ))}
      <div className="h-10 bg-indigo-100 rounded-lg mt-2" />
    </div>
  );
}
