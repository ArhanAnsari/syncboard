"use client";
/* eslint-disable @next/next/no-img-element */

import { useAuth } from "@/context/AuthContext";
import { avatars } from "@/lib/appwrite";
import { ChevronDown, LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const providerNames = {
  appwrite: "Appwrite",
  github: "GitHub",
  email: "Email OTP",
  anonymous: "Guest",
} as const;

export function UserButton() {
  const { user, provider, providerLabel, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const displayName = user?.name || user?.email || "Volunteer";
  const avatarUrl = avatars.getInitials({ name: displayName, width: 80, height: 80 });

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  const signOut = async () => {
    try {
      await logout();
      setOpen(false);
      toast.success("Signed out");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not sign out.");
    }
  };

  if (!user) return null;
  return (
    <div ref={rootRef} className="relative">
      <button type="button" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((current) => !current)} className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white p-1.5 pr-3 text-left text-zinc-900 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-100 dark:hover:border-zinc-700 dark:hover:bg-zinc-800">
        <img src={avatarUrl} alt="" className="size-8 rounded-full" />
        <span className="hidden max-w-28 truncate text-sm font-medium text-zinc-200 sm:block">{displayName}</span>
        <ChevronDown className={`size-3.5 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-12 z-40 w-72 rounded-2xl border border-zinc-200 bg-white p-2 text-zinc-900 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
          <div className="flex items-center gap-3 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-950/70">
            <img src={avatarUrl} alt="" className="size-10 rounded-full" />
            <div className="min-w-0"><p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{user.name || "Volunteer"}</p><p className="truncate text-xs text-zinc-500">{user.email || user.$id}</p></div>
          </div>
          <div className="px-3 py-3"><p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Active session</p><p className="mt-1 flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300"><span className="size-1.5 rounded-full bg-emerald-400" />{provider ? providerNames[provider] : providerLabel}</p></div>
          <button type="button" role="menuitem" onClick={() => void signOut()} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-red-300 transition hover:bg-red-500/10"><LogOut className="size-4" /> Sign out</button>
        </div>
      )}
    </div>
  );
}
