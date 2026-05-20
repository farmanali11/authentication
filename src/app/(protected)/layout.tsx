"use client";

// ─── Why client here? ─────────────────────────────────────────────
// This layout renders the navbar with the user's name and a logout
// button. Both need useAuth() → which is a hook → client only.
// ─────────────────────────────────────────────────────────────────

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  // ── Client-side auth guard ─────────────────────────────────────
  // Middleware protects routes at the edge (fast), but middleware
  // only checks the access token header — which requires the client
  // to send it. On first load, the client hasn't sent it yet.
  //
  // This effect is a safety net: if AuthContext finishes loading
  // and there's no authenticated user, redirect to login.
  // This handles edge cases middleware might miss (e.g. direct URL
  // navigation with an expired token that was never refreshed).
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // ── Loading state ──────────────────────────────────────────────
  // Show a full-page spinner while AuthContext restores the session.
  // Without this, the layout flashes as "unauthenticated" for a
  // split second before the refresh call completes.
  if (isLoading) {
    return (
      <div className="min-h-svh flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="w-8 h-8 text-indigo-600 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p className="text-sm text-gray-500">Restoring session…</p>
        </div>
      </div>
    );
  }

  // ── Not authenticated → render nothing (redirect in progress) ──
  if (!isAuthenticated) return null;

  const handleLogout = async () => {
    await logout();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-svh bg-gray-50 flex flex-col">
      {/* ── Navbar ────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Brand */}
          <Link
            href="/dashboard"
            className="font-bold text-gray-900 hover:text-indigo-600 transition-colors"
          >
            NextAuth
          </Link>

          {/* Nav links */}
          <nav className="hidden sm:flex items-center gap-6 text-sm text-gray-600">
            <Link
              href="/dashboard"
              className="hover:text-gray-900 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/profile"
              className="hover:text-gray-900 transition-colors"
            >
              Profile
            </Link>
          </nav>

          {/* User info + logout */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900 leading-none">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{user?.role}</p>
            </div>

            {/* Avatar initials */}
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-indigo-700">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>

            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* ── Page content ──────────────────────────────────────── */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {children}
      </main>
    </div>
  );
}
