import { z } from "zod";

// ─── Why Zod? ─────────────────────────────────────────────────────
// TypeScript types only exist at compile time. At runtime, when a
// real HTTP request hits your API, TypeScript is gone — it's just JS.
// Someone can send { email: 123, password: null } and TypeScript
// won't catch it. Zod validates the actual runtime data and gives
// you typed, safe objects after validation passes.
//
// Rule: NEVER trust req.body directly. Always parse it through Zod first.
// ─────────────────────────────────────────────────────────────────

// ─── Register Schema ─────────────────────────────────────────────
export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name cannot exceed 50 characters")
      .trim(),

    email: z
      .string()
      .nonempty("Email is required")
      .email("Please enter a valid email address")
      .toLowerCase() // Zod transform — normalizes before saving
      .trim(),

    password: z
      .string()
      .nonempty("Password is required")
      .min(8, "Password must be at least 8 characters")
      .max(64, "Password cannot exceed 64 characters")
      // Regex: at least one uppercase, one lowercase, one digit, one special char
      // This is a 2026 standard — weak passwords are a top attack vector
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        "Password must contain uppercase, lowercase, number, and special character",
      ),

    confirmPassword: z.string().nonempty("Please confirm your password"),
  })
  // .refine() lets us add cross-field validation.
  // Zod runs this AFTER all individual field checks pass.
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"], // which field the error is attached to
  });

// ─── Login Schema ─────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Please enter a valid email address")
    .toLowerCase()
    .trim(),

  password: z.string({ required_error: "Password is required" }).min(1),
});

// ─── Forgot Password Schema ───────────────────────────────────────
export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Please enter a valid email address")
    .toLowerCase()
    .trim(),
});

// ─── Reset Password Schema ────────────────────────────────────────
export const resetPasswordSchema = z
  .object({
    token: z.string({ required_error: "Reset token is required" }).min(1),
    password: z
      .string({ required_error: "Password is required" })
      .min(8, "Password must be at least 8 characters")
      .max(64, "Password cannot exceed 64 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        "Password must contain uppercase, lowercase, number, and special character",
      ),
    confirmPassword: z.string({
      required_error: "Please confirm your password",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ─── Inferred Types ───────────────────────────────────────────────
// z.infer<> extracts the TypeScript type from the Zod schema.
// We get one source of truth — the schema — instead of maintaining
// a separate TS interface and a Zod schema separately.
// ─────────────────────────────────────────────────────────────────
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// ─── Reusable parse helper ────────────────────────────────────────
// safeParse() never throws — it returns { success, data } or
// { success: false, error }. We wrap it here to return a clean
// error message array that our API routes can send directly.
// ─────────────────────────────────────────────────────────────────
export function parseBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown,
):
  | { success: true; data: T }
  | { success: false; errors: { field: string; message: string }[] } {
  const result = schema.safeParse(body);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Zod's error.issues is an array of all validation failures.
  // We map it to a flat array of { field, message } objects —
  // easy to display per-field errors on the frontend form.
  const errors = result.error.issues.map((issue) => ({
    field: issue.path.join("."), // e.g. "confirmPassword"
    message: issue.message, // e.g. "Passwords do not match"
  }));

  return { success: false, errors };
}
