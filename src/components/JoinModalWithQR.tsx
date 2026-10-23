"use client";
/* eslint-disable @next/next/no-img-element */

import { Button } from "@/components/ui/button";
import { avatars } from "@/lib/appwrite";
import { Check, Clipboard, QrCode, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type Props = { code: string; open: boolean; onClose: () => void };

export function JoinModalWithQR({ code, open, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== "undefined" && window.location.origin ? window.location.origin : "https://syncboard.app";
  const boardUrl = useMemo(() => `${origin}/?join=${encodeURIComponent(code)}`, [code, origin]);
  const qrUrl = useMemo(() => avatars.getQR({ text: boardUrl, size: 320, margin: 10 }), [boardUrl]);
  if (!open) return null;
  const copyUrl = async () => {
    await navigator.clipboard.writeText(boardUrl);
    setCopied(true);
    toast.success("Board URL copied");
    window.setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="share-board-title">
      <div className="relative max-h-[90vh] w-[95vw] max-w-lg overflow-y-auto rounded-3xl border border-zinc-200 bg-white p-5 text-center text-zinc-900 shadow-xl sm:p-6 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
        <button type="button" aria-label="Close share dialog" onClick={onClose} className="absolute right-4 top-4 rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"><X className="size-4" /></button>
        <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300"><QrCode className="size-5" /></div>
        <h2 id="share-board-title" className="text-lg font-semibold">Invite volunteers</h2>
        <p className="mt-1 text-sm text-zinc-500">Scan the QR code or share the join link.</p>
        <div className="mx-auto my-6 flex size-[min(16rem,70vw)] items-center justify-center rounded-2xl bg-white p-3"><img src={qrUrl} alt="Scan to join board" className="size-full rounded-xl border border-zinc-800 bg-white p-2" onError={(event) => { event.currentTarget.style.display = "none"; toast.error("Failed to load Appwrite QR code."); }} /></div>
        <p className="font-mono text-2xl font-bold tracking-[0.35em] text-cyan-300">{code}</p>
        <Button className="mt-5 h-11 w-full bg-cyan-400 font-semibold text-zinc-950 hover:bg-cyan-300" onClick={() => void copyUrl()}>{copied ? <Check /> : <Clipboard />}{copied ? "Copied" : "Copy URL"}</Button>
      </div>
    </div>
  );
}
