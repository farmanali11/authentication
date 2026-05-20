// ─── Why "use client" is NOT here ────────────────────────────────
// Button is a pure presentational component. It receives props and
// renders HTML. It has no state, no effects, no browser APIs.
// It can be used in BOTH Server and Client components — Next.js
// handles this automatically. Only add "use client" when you
// actually need useState, useEffect, or browser APIs.
// ─────────────────────────────────────────────────────────────────

import { ButtonHTMLAttributes, forwardRef } from "react";

// ─── Variant system ───────────────────────────────────────────────
// Instead of accepting arbitrary className strings, we define a
// fixed set of variants. This is the "variant prop" pattern —
// used by every major component library (shadcn, Radix, MUI).
// It keeps styling consistent and prevents style drift.
// ─────────────────────────────────────────────────────────────────
type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  fullWidth?: boolean;
}

// ─── Style maps ───────────────────────────────────────────────────
const variantStyles: Record<Variant, string> = {
  primary:
    "bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-500 disabled:bg-indigo-400",
  secondary:
    "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus-visible:ring-gray-400 disabled:bg-gray-100",
  ghost:
    "bg-transparent text-gray-600 hover:bg-gray-100 focus-visible:ring-gray-400",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 disabled:bg-red-400",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

// ─── forwardRef ───────────────────────────────────────────────────
// forwardRef lets parent components attach a ref to our button.
// Example use case: focusing the button programmatically after
// a modal opens, or integrating with a form library like React Hook Form.
// It's a best practice for any reusable interactive element.
// ─────────────────────────────────────────────────────────────────
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      fullWidth = false,
      className = "",
      disabled,
      children,
      ...rest // spread remaining native button props (onClick, type, etc.)
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={[
          // Base styles every button shares
          "inline-flex items-center justify-center gap-2",
          "font-medium rounded-lg",
          "transition-colors duration-150",
          // Focus ring — keyboard accessibility
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          // Disabled state
          "disabled:cursor-not-allowed disabled:opacity-70",
          // Dynamic styles from props
          variantStyles[variant],
          sizeStyles[size],
          fullWidth ? "w-full" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      >
        {/* Loading spinner — only visible when isLoading is true */}
        {isLoading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
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
        )}

        {/* Screen reader text when loading */}
        {isLoading && <span className="sr-only">Loading…</span>}

        {children}
      </button>
    );
  },
);

// displayName is required when using forwardRef.
// Without it, React DevTools shows "ForwardRef" instead of "Button"
// — makes debugging painful.
Button.displayName = "Button";

export default Button;
