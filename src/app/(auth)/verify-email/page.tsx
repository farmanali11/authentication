"use client";

// ─── Why client here? ─────────────────────────────────────────────
// We need useSearchParams to read ?token= from the URL,
// useEffect to fire the API call on mount, and useState to
// track the result. All browser-only → "use client".
// ─────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";

type Status = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    // ── Guard: no token in URL ─────────────────────────────────
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("error");
      setMessage("No verification token found. Please check your email link.");
      return;
    }

    // ── Call the API route ─────────────────────────────────────
    // We hit GET /api/auth/verify-email?token=xxxx
    // The server finds the user by token, checks expiry, marks verified.
    const verify = async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await res.json();

        if (data.success) {
          setStatus("success");
          setMessage(data.message);
        } else {
          setStatus("error");
          setMessage(data.message);
        }
      } catch {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    };

    verify();
  }, [token]); // only re-run if the token in the URL changes

  // ─── Loading state ────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="mx-auto w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center">
          <svg
            className="w-7 h-7 text-indigo-600 animate-spin"
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
        </div>
        <h2 className="text-xl font-semibold text-gray-900">
          Verifying your email…
        </h2>
        <p className="text-sm text-gray-500">This only takes a second.</p>
      </div>
    );
  }

  // ─── Success state ────────────────────────────────────────────
  if (status === "success") {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="mx-auto w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
          <svg
            className="w-7 h-7 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Email verified!</h2>
        <p className="text-sm text-gray-600">{message}</p>
        <Button fullWidth onClick={() => router.push("/login")}>
          Go to Login
        </Button>
      </div>
    );
  }

  // ─── Error state ──────────────────────────────────────────────
  return (
    <div className="text-center space-y-4 py-4">
      <div className="mx-auto w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
        <svg
          className="w-7 h-7 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-900">
        Verification failed
      </h2>
      <p className="text-sm text-gray-600">{message}</p>
      <Button
        variant="secondary"
        fullWidth
        onClick={() => router.push("/register")}
      >
        Back to Register
      </Button>
      <p className="text-sm text-gray-500">
        Already verified?{" "}
        <Link href="/login" className="text-indigo-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
