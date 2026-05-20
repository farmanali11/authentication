"use client";

import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Your account details</p>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {/* Avatar row */}
        <div className="p-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
            <span className="text-2xl font-bold text-indigo-700">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-lg">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            {/* Role badge */}
            <span
              className={[
                "inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium",
                user?.role === "admin"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-gray-100 text-gray-600",
              ].join(" ")}
            >
              {user?.role}
            </span>
          </div>
        </div>

        {/* Detail rows */}
        <ProfileRow label="Full name" value={user?.name} />
        <ProfileRow label="Email" value={user?.email} />
        <ProfileRow
          label="Email verified"
          value={user?.isEmailVerified ? "Verified" : "Not verified"}
          valueClass={user?.isEmailVerified ? "text-green-600" : "text-red-500"}
        />
        <ProfileRow
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
        />
        <ProfileRow label="User ID" value={user?.id} mono />
      </div>
    </div>
  );
}

function ProfileRow({
  label,
  value,
  valueClass = "text-gray-900",
  mono = false,
}: {
  label: string;
  value?: string;
  valueClass?: string;
  mono?: boolean;
}) {
  return (
    <div className="px-6 py-4 flex items-center justify-between gap-4">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span
        className={[
          "text-sm font-medium truncate text-right",
          valueClass,
          mono ? "font-mono text-xs" : "",
        ].join(" ")}
      >
        {value ?? "—"}
      </span>
    </div>
  );
}
