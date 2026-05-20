"use client";

// ─── Why "use client" here? ───────────────────────────────────────
// This component uses:
//   - useState  → form field values, errors, loading state
//   - useRouter → programmatic navigation after register
//   - onChange  → listening to browser input events
// All of these require the browser environment → "use client" is mandatory.
// The parent page (page.tsx) stays a Server Component — only this
// form subtree runs on the client.
// ─────────────────────────────────────────────────────────────────

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

// ─── Local form state type ────────────────────────────────────────
interface FormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const INITIAL_STATE: FormState = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterForm() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // ── Generic change handler ─────────────────────────────────────
  // One handler for all fields — uses the input's name attribute
  // to update the correct key in form state.
  // Clears the field's error as the user types (better UX than
  // showing stale errors while correcting).
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setServerError("");
  };

  // ── Submit ─────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // prevent browser's native form submission
    setIsLoading(true);
    setErrors({});
    setServerError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // We send the raw form values — Zod on the server validates them.
        // We intentionally do NOT validate client-side with Zod here
        // (though you could) because the server is the source of truth.
        // Never trust client-side validation alone.
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!data.success) {
        if (data.errors) {
          // Map Zod field errors back to our FieldErrors shape
          const fieldErrors: FieldErrors = {};
          data.errors.forEach((err: { field: string; message: string }) => {
            fieldErrors[err.field as keyof FieldErrors] = err.message;
          });
          setErrors(fieldErrors);
        } else {
          // Non-field error (e.g. email already exists)
          setServerError(data.message);
        }
        return;
      }

      // ── Success ────────────────────────────────────────────────
      // We do NOT log the user in automatically after registration.
      // They must verify their email first. Show a success message
      // and let them navigate to login themselves.
      setIsSuccess(true);
    } catch {
      setServerError("Network error. Please check your connection.");
    } finally {
      // Always reset loading — even if an error occurred
      setIsLoading(false);
    }
  };

  // ── Success state ──────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="text-center space-y-4 py-4">
        {/* Checkmark icon */}
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
        <h2 className="text-xl font-semibold text-gray-900">
          Check your email
        </h2>
        <p className="text-sm text-gray-600">
          We sent a verification link to <strong>{form.email}</strong>. Click it
          to activate your account before logging in.
        </p>
        <Button
          variant="secondary"
          fullWidth
          onClick={() => router.push("/login")}
        >
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {/*
        noValidate disables the browser's built-in HTML5 validation popups.
        We handle all validation ourselves (Zod on server, error display here).
        Browser validation is inconsistent across browsers and can't be styled.
      */}

      {/* Server-level error banner */}
      {serverError && (
        <div
          role="alert"
          className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
        >
          {serverError}
        </div>
      )}

      <Input
        label="Full name"
        name="name"
        type="text"
        placeholder="John Doe"
        autoComplete="name"
        value={form.name}
        onChange={handleChange}
        error={errors.name}
        required
      />

      <Input
        label="Email address"
        name="email"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        value={form.email}
        onChange={handleChange}
        error={errors.email}
        required
      />

      <Input
        label="Password"
        name="password"
        type="password"
        placeholder="Min 8 chars, mixed case + symbol"
        autoComplete="new-password"
        value={form.password}
        onChange={handleChange}
        error={errors.password}
        hint="Use uppercase, lowercase, a number, and a special character"
        required
      />

      <Input
        label="Confirm password"
        name="confirmPassword"
        type="password"
        placeholder="Re-enter your password"
        autoComplete="new-password"
        value={form.confirmPassword}
        onChange={handleChange}
        error={errors.confirmPassword}
        required
      />

      <Button type="submit" fullWidth isLoading={isLoading} className="mt-2">
        Create account
      </Button>

      <p className="text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-indigo-600 font-medium hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
