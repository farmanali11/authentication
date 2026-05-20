"use client";

import { useAuth } from "@/context/AuthContext";
import type { Metadata } from "next";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          You are securely authenticated. Here is your session summary.
        </p>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <InfoCard
          label="Email"
          value={user?.email ?? "—"}
          icon="✉️"
          sub="Your login email"
        />

        <InfoCard
          label="Role"
          value={user?.role ?? "—"}
          icon="🔑"
          sub="Access level"
        />

        <InfoCard
          label="Email verified"
          value={user?.isEmailVerified ? "Yes" : "No"}
          icon={user?.isEmailVerified ? "✅" : "⚠️"}
          sub="Account status"
        />

        <InfoCard
          label="Member since"
          value={
            user?.createdAt
              ? new Date(user.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "—"
          }
          icon="📅"
          sub="Registration date"
        />

        <InfoCard
          label="Token storage"
          value="In memory"
          icon="🔒"
          sub="Access token location — not localStorage"
        />

        <InfoCard
          label="Session refresh"
          value="Every 14 min"
          icon="♻️"
          sub="Silent background refresh"
        />
      </div>

      {/* Token strategy note */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 text-sm text-indigo-800 space-y-1">
        <p className="font-semibold">How your session works</p>
        <p>
          Your <strong>access token</strong> lives in JavaScript memory — never
          in localStorage. It expires every 15 minutes.
        </p>
        <p>
          Your <strong>refresh token</strong> is in an httpOnly cookie the
          browser manages automatically. Every 14 minutes, it silently issues a
          new access token so you never get logged out mid-session.
        </p>
      </div>
    </div>
  );
}

// ─── Reusable info card ───────────────────────────────────────────
function InfoCard({
  label,
  value,
  icon,
  sub,
}: {
  label: string;
  value: string;
  icon: string;
  sub: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
      <div className="flex items-center gap-2 text-gray-500 text-xs font-medium uppercase tracking-wide">
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      <p className="text-lg font-semibold text-gray-900 truncate">{value}</p>
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
  );
}
