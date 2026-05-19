import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters long")
    .max(50, "Name must be less than 50 characters long")
    .trim(),

  email: z
    .string()
    .email("Please enter a valid email address")
    .toLowerCase()
    .trim(),

  password: z.string()
    .min(6, "Password must be at least 6 characters long")
    .max(100, "Password must be less than 100 characters long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,100}$/,
      "Password must contain uppercase, lowercase, number, and special character"
    ),

  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

//_____________________Login Schema_________________________

export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Please enter a valid email address")
    .toLowerCase()
    .trim(),
  password: z.string({ required_error: "Password is required" }).min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export function parseBody<T>(schema: z.ZodSchema<T>, body: unknown):
  | { success: true; data: T }
  | { success: false; errors: { field: string; message: string }[] }
{
  const result = schema.safeParse(body);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
  return { success: false, errors };
}


