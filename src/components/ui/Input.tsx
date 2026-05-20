import { InputHTMLAttributes, forwardRef, useId } from "react";

// ─── Why useId? ───────────────────────────────────────────────────
// Every input needs a unique id so its <label> can use htmlFor.
// This links them for accessibility — clicking the label focuses
// the input, and screen readers announce "Password, edit field".
//
// useId() generates a stable, unique id that is consistent between
// server render and client hydration (no mismatch warnings).
// It was introduced in React 18 specifically to solve this.
// ─────────────────────────────────────────────────────────────────

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string; // per-field error from Zod
  hint?: string; // optional helper text below the input
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", id: externalId, ...rest }, ref) => {
    // Generate a unique id if one wasn't passed from outside
    const generatedId = useId();
    const id = externalId ?? generatedId;

    // Derived ids for ARIA — screen readers use these to
    // announce the error and hint when the input is focused
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;

    return (
      <div className="flex flex-col gap-1.5">
        {/* Label — always visible, never placeholder-only */}
        {/* Using placeholder as the only label is an accessibility anti-pattern */}
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
          {/* Mark required fields visually */}
          {rest.required && (
            <span className="ml-1 text-red-500" aria-hidden="true">
              *
            </span>
          )}
        </label>

        <input
          ref={ref}
          id={id}
          // aria-describedby links the input to its helper/error text.
          // When the user focuses the input, the screen reader reads
          // the input value AND the linked description automatically.
          aria-describedby={
            [error && errorId, hint && hintId].filter(Boolean).join(" ") ||
            undefined
          }
          aria-invalid={!!error}
          className={[
            "w-full px-3 py-2 text-sm rounded-lg border",
            "bg-white text-gray-900 placeholder:text-gray-400",
            "transition-colors duration-150",
            "focus:outline-none focus:ring-2 focus:ring-offset-1",
            // Error state: red border and ring
            error
              ? "border-red-400 focus:ring-red-400"
              : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500",
            "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...rest}
        />

        {/* Error message — shown when Zod validation fails */}
        {error && (
          <p
            id={errorId}
            role="alert"
            className="text-xs text-red-600 flex items-center gap-1"
          >
            {/* Inline SVG warning icon */}
            <svg
              className="w-3.5 h-3.5 shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}

        {/* Hint text — shown when no error, gives guidance */}
        {hint && !error && (
          <p id={hintId} className="text-xs text-gray-500">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
