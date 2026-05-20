"use client";

// ─── Why a Context for auth? ──────────────────────────────────────
// The access token lives in memory (a JS variable). If we stored it
// inside a single component's useState, it would be lost the moment
// that component unmounts. We need it to persist across the entire
// app while the tab is open.
//
// React Context solves this: one place at the top of the tree holds
// the token and user. Every component that needs it calls useAuth()
// and gets the same data — no prop drilling, no re-fetching.
//
// Context does NOT persist across page refreshes (it's in memory).
// That's intentional — on refresh, the app calls /api/auth/refresh
// using the httpOnly cookie to silently get a new access token.
// ─────────────────────────────────────────────────────────────────

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { SafeUser } from "@/types/auth";

// ─── Shape of the context value ───────────────────────────────────
interface AuthContextValue {
  user: SafeUser | null;
  accessToken: string | null;
  isLoading: boolean; // true during initial session restore
  isAuthenticated: boolean;
  login: (token: string, user: SafeUser) => void;
  logout: () => Promise<void>;
  getToken: () => string | null; // used by fetch helpers
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Auto-refresh timing ──────────────────────────────────────────
// Access token lives 15 minutes (900_000 ms).
// We refresh at 14 minutes to avoid a gap between expiry and refresh.
const REFRESH_INTERVAL_MS = 14 * 60 * 1000;

// ─── Provider ─────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // starts true — restoring session

  // useRef for the interval so we can clear it without stale closures
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Refresh token function ─────────────────────────────────────
  // Called on mount and every 14 minutes.
  // Hits /api/auth/refresh which reads the httpOnly cookie and
  // returns a new access token.
  const refresh = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" });
      const data = await res.json();

      if (data.success && data.data) {
        setAccessToken(data.data.accessToken);
        setUser(data.data.user);
        return true;
      }

      // Refresh failed — clear state (user must log in again)
      setAccessToken(null);
      setUser(null);
      return false;
    } catch {
      setAccessToken(null);
      setUser(null);
      return false;
    }
  }, []);

  // ── Start auto-refresh timer ───────────────────────────────────
  const startRefreshTimer = useCallback(() => {
    // Clear any existing timer first to avoid duplicates
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);

    refreshTimerRef.current = setInterval(async () => {
      const ok = await refresh();
      // If refresh fails mid-session, stop the timer
      if (!ok && refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    }, REFRESH_INTERVAL_MS);
  }, [refresh]);

  // ── On mount: restore session ──────────────────────────────────
  // This runs once when the app loads (page refresh, new tab).
  // We attempt a silent token refresh using the httpOnly cookie.
  // If it works → user is back. If not → user needs to log in.
  useEffect(() => {
    const restoreSession = async () => {
      const ok = await refresh();
      if (ok) startRefreshTimer();
      setIsLoading(false); // done — show the UI
    };

    restoreSession();

    // Cleanup: clear timer when provider unmounts
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [refresh, startRefreshTimer]);

  // ── Login: called after a successful /api/auth/login response ─
  const login = useCallback(
    (token: string, userData: SafeUser) => {
      setAccessToken(token);
      setUser(userData);
      startRefreshTimer();
    },
    [startRefreshTimer],
  );

  // ── Logout: clear memory + call API to clear the cookie ───────
  const logout = useCallback(async () => {
    // Clear client-side state immediately for instant UI feedback
    setAccessToken(null);
    setUser(null);
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);

    // Tell the server to clear the httpOnly refresh token cookie.
    // Even if this fails, the client state is already cleared.
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Silently ignore network errors on logout
    }
  }, []);

  // ── getToken: synchronous accessor for fetch helpers ──────────
  // A ref-based version so callbacks always get the latest token
  // without needing to be in the dependency array.
  const tokenRef = useRef(accessToken);
  useEffect(() => {
    tokenRef.current = accessToken;
  }, [accessToken]);
  const getToken = useCallback(() => tokenRef.current, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        isAuthenticated: !!accessToken && !!user,
        login,
        logout,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── useAuth hook ─────────────────────────────────────────────────
// The clean public API. Every component calls this instead of
// useContext(AuthContext) directly — gives a better error message
// if used outside the provider, and hides the context internals.
// ─────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>.");
  }
  return ctx;
}
