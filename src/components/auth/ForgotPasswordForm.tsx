"use client";

import { useState } from "react";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

type Status = "idle" | "loading" | "sent";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [serverError, setServerError] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setEmailError("");
    setServerError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!data.success) {
        if (data.errors?.[0]) {
          setEmailError(data.errors[0].message);
        } else {
          setServerError(data.message);
        }
        setStatus("idle");
        return;
      }

      // Always show the sent state — even if the email wasn't found.
      // This is the anti-enumeration UX pattern on the frontend too.
      setStatus("sent");
    } catch {
      setServerError("Network error. Please check your connection.");
      setStatus("idle");
    }
  };

  // ── Sent state ────────────────────────────────────────────────
  if (status === "sent") {
    return (
      <div className="text-center space-y-4 py-2">
        <div className="mx-auto w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center">
          <svg
            className="w-7 h-7 text-indigo-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">
          Check your inbox
        </h2>
        <p className="text-sm text-gray-600">
          If <strong>{email}</strong> is registered, a password reset link has
          been sent. Check your spam folder too.
        </p>
        <p className="text-xs text-gray-400">The link expires in 1 hour.</p>
        <Link
          href="/login"
          className="block text-sm text-indigo-600 hover:underline"
        >
          Back to Login
        </Link>
      </div>
    );
  }

  // ── Form state ────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <p className="text-sm text-gray-600 text-center -mt-2">
         Enter your email and we&apos;ll send you a reset link. </p>

      {serverError && (
        <div
          role="alert"
          className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
        >
          {serverError}
        </div>
      )}

      <Input
        label="Email address"
        name="email"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setEmailError("");
        }}
        error={emailError}
        required
      />

      <Button type="submit" fullWidth isLoading={status === "loading"}>
        Send reset link
      </Button>

      <p className="text-center text-sm text-gray-500">
        Remembered it?{" "}
        <Link
          href="/login"
          className="text-indigo-600 font-medium hover:underline"
        >
          Back to Login
        </Link>
      </p>
    </form>
  );
}
