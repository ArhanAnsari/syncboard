"use client";

import type { ActivityLogDoc } from "@/lib/appwrite";
import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";

type Props = {
  alerts: ActivityLogDoc[];
  canResolve?: boolean;
  onResolve?: () => void;
};

export function SOSBanner({ alerts, canResolve = false, onResolve }: Props) {
  const [dismissed, setDismissed] = useState<string | null>(null);
  const latest = alerts[0];

  if (!latest || latest.$id === dismissed) return null;
  return (
    <div className="border-b border-red-300 bg-red-50 px-5 py-3 text-red-900 shadow-sm dark:border-red-400/30 dark:bg-red-500/15 dark:text-red-100 dark:shadow-lg dark:shadow-red-950/20">
      <div className="mx-auto flex max-w-[1600px] items-center gap-3 lg:px-3">
        <span className="flex size-8 shrink-0 animate-pulse items-center justify-center rounded-full bg-red-500 text-white">
          <AlertTriangle className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-300">Emergency broadcast</p>
          <p className="truncate text-sm font-medium">{latest.action_text} <span className="font-normal text-red-700/70 dark:text-red-200/70">— {latest.actor_name}</span></p>
        </div>
        <div className="flex items-center gap-1">
          {canResolve && onResolve && <button type="button" onClick={onResolve} className="rounded-lg border border-red-300 px-2.5 py-1.5 text-xs font-semibold text-red-800 transition hover:bg-red-200 dark:border-red-400/30 dark:text-red-100 dark:hover:bg-red-400/20">Resolve SOS</button>}
          <button type="button" aria-label="Dismiss alert" className="rounded-lg p-2 text-red-700 transition hover:bg-red-200 hover:text-red-950 dark:text-red-200 dark:hover:bg-red-400/20 dark:hover:text-white" onClick={() => setDismissed(latest.$id)}>
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
