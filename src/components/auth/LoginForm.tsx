"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface FormState {
  email: string;
  password: string;
}

interface FieldErrors {
  email?: string;
  password?: string;
}

export default function LoginForm() {
  const router = useRouter();
  // useSearchParams reads the URL query string.
  // We use ?from= to redirect back after login (set by middleware).
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [form, setForm] = useState<FormState>({ email: "", password: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setServerError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setServerError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        // credentials: "include" tells the browser to send AND receive
        // cookies with this fetch request.
        // Without this, the httpOnly refresh token cookie would never
        // be set by the server's Set-Cookie header.
        credentials: "include",
      });

      const data = await res.json();

      if (!data.success) {
        if (data.errors) {
          const fieldErrors: FieldErrors = {};
          data.errors.forEach((err: { field: string; message: string }) => {
            fieldErrors[err.field as keyof FieldErrors] = err.message;
          });
          setErrors(fieldErrors);
        } else {
          setServerError(data.message);
        }
        return;
      }

      // ── Store token in Context (memory) ────────────────────────
      // The refresh token was already set as an httpOnly cookie by
      // the server's Set-Cookie header — we never touch it from JS.
      // We only store the access token in our AuthContext (in memory).
      login(data.data.accessToken, data.data.user);

      // ── Redirect ───────────────────────────────────────────────
      // If middleware sent the user here from a protected route,
      // take them back there. Otherwise go to dashboard.
      const from = searchParams.get("from") ?? "/dashboard";
      router.push(from);
      router.refresh(); // tells Next.js to re-run Server Components
      // so they pick up the new auth state
    } catch {
      setServerError("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
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
        value={form.email}
        onChange={handleChange}
        error={errors.email}
        required
      />

      <Input
        label="Password"
        name="password"
        type="password"
        placeholder="Your password"
        autoComplete="current-password"
        value={form.password}
        onChange={handleChange}
        error={errors.password}
        required
      />

      {/* Forgot password link — route to build later */}
      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-sm text-indigo-600 hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      <Button type="submit" fullWidth isLoading={isLoading}>
        Sign in
      </Button>

      <p className="text-center text-sm text-gray-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="text-indigo-600 font-medium hover:underline"
        >
          Create one
        </Link>
      </p>
    </form>
  );
}
