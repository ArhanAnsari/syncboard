"use client";

import {
  account,
  avatars,
  ID,
  type Models,
} from "@/lib/appwrite";
import type { OAuthProvider } from "appwrite";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type AuthUser = Models.User<Models.Preferences> | null;
export type AuthProviderName = "appwrite" | "github" | "anonymous" | "email";
type AuthContextValue = {
  user: AuthUser;
  loading: boolean;
  session: Models.Session | null;
  provider: AuthProviderName | null;
  providerLabel: string;
  loginAnonymous: (displayName: string) => Promise<AuthUser>;
  sendEmailOTP: (email: string) => Promise<string>;
  verifyEmailOTP: (userId: string, secret: string) => Promise<AuthUser>;
  loginWithOAuth: (provider: "appwrite" | "github") => void | string;
  getAvatarInitials: (name: string) => string;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Models.Session | null>(null);

  const applySession = useCallback(async (currentUser: AuthUser) => {
    setUser(currentUser);
    try {
      setSession(await account.getSession("current"));
    } catch {
      setSession(null);
    }
  }, []);

  useEffect(() => {
    let active = true;
    account.get()
      .then(async (currentUser) => {
        if (active) await applySession(currentUser);
      })
      .catch(() => {
        if (active) {
          setUser(null);
          setSession(null);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [applySession]);

  const loginAnonymous = useCallback(async (displayName: string) => {
    const name = displayName.trim();
    if (!name) throw new Error("Please enter a display name.");

    let currentUser: AuthUser;
    try {
      currentUser = await account.get();
    } catch {
      await account.createAnonymousSession();
      currentUser = await account.get();
    }
    const updatedUser = await account.updateName(name);
    await applySession(updatedUser);
    return currentUser ? updatedUser : null;
  }, [applySession]);

  const logout = useCallback(async () => {
    await account.deleteSession("current");
    setUser(null);
    setSession(null);
  }, []);

  const sendEmailOTP = useCallback(async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      throw new Error("Enter a valid email address.");
    }
    const token = await account.createEmailToken(ID.unique(), normalizedEmail);
    return token.userId;
  }, []);

  const verifyEmailOTP = useCallback(async (userId: string, secret: string) => {
    if (!userId.trim() || !secret.trim()) throw new Error("Enter the verification code.");
    await account.createSession(userId.trim(), secret.trim());
    const currentUser = await account.get();
    await applySession(currentUser);
    return currentUser;
  }, [applySession]);

  const loginWithOAuth = useCallback((provider: "appwrite" | "github") => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return account.createOAuth2Session(
      provider as OAuthProvider,
      `${origin}/?auth=success`,
      `${origin}/?auth=failed`,
    );
  }, []);

  const getAvatarInitials = useCallback((name: string) => {
    return avatars.getInitials({ name: name.trim(), width: 64, height: 64 });
  }, []);

  const provider = useMemo<AuthProviderName | null>(() => {
    if (!session) return null;
    if (session.provider === "anonymous") return "anonymous";
    if (session.provider === "email") return "email";
    if (session.provider === "github") return "github";
    if (session.provider === "appwrite") return "appwrite";
    return null;
  }, [session]);
  const providerLabel = provider === "appwrite" ? "Signed in via Appwrite"
    : provider === "github" ? "Signed in via GitHub"
    : provider === "email" ? "Email Session"
    : provider === "anonymous" ? "Guest Session"
    : "Not signed in";

  const value = useMemo(
    () => ({ user, loading, session, provider, providerLabel, loginAnonymous, sendEmailOTP, verifyEmailOTP, loginWithOAuth, getAvatarInitials, logout }),
    [user, loading, session, provider, providerLabel, loginAnonymous, sendEmailOTP, verifyEmailOTP, loginWithOAuth, getAvatarInitials, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider.");
  return context;
}

export function AuthProviderBadge() {
  const { providerLabel, provider } = useAuth();
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300">
      <span className={`size-1.5 rounded-full ${provider ? "bg-emerald-400" : "bg-zinc-600"}`} />
      {providerLabel}
    </span>
  );
}
