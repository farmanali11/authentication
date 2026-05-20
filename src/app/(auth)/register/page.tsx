import type { Metadata } from "next";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Register",
  description: "Create your NextAuth account",
};

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Create an account
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Get started — it only takes a minute
        </p>
      </div>

      {/* RegisterForm doesn't use useSearchParams so no Suspense needed */}
      <RegisterForm />
    </div>
  );
}
