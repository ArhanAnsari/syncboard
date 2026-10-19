"use client";

import type { ActivityLogDoc } from "@/lib/appwrite";
import { CheckCircle2, Radio } from "lucide-react";

function relativeTime(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function ActivityFeed({ logs, loading }: { logs: ActivityLogDoc[]; loading?: boolean }) {
  return (
    <aside className="flex min-h-[280px] flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Live activity</h2>
          <p className="mt-1 text-xs text-zinc-500">Every shift change, in real time</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
          <span className="size-1.5 animate-pulse rounded-full bg-emerald-300" /> Live
        </span>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        {loading && <p className="text-sm text-zinc-500">Loading activity…</p>}
        {!loading && logs.length === 0 && <p className="text-sm text-zinc-500">No activity yet. Be the first to move a shift.</p>}
        {logs.map((log) => (
          <div key={log.$id} className="flex gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-cyan-700 dark:bg-zinc-800 dark:text-cyan-300">{log.actor_name.slice(0, 2).toUpperCase()}</div>
            <div className="min-w-0">
              {log.action === "SOS_RESOLVED" || log.action_text === "SOS_RESOLVED" ? <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"><CheckCircle2 className="size-3" /> SOS Resolved by {log.actor_name}</span> : <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300"><strong className="font-medium text-zinc-900 dark:text-zinc-100">{log.actor_name}</strong>{" "}{log.action_text}</p>}
              {log.action === "SOS_RESOLVED" || log.action_text === "SOS_RESOLVED" ? <p className="text-xs text-zinc-600 dark:text-zinc-400">{log.details || `SOS incident resolved by ${log.actor_name}`}</p> : null}
              <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-600">{relativeTime(log.created_at)}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center gap-2 border-t border-zinc-200 pt-4 text-xs text-zinc-500 dark:border-zinc-800/70 dark:text-zinc-600"><Radio className="size-3.5 text-emerald-400" /> Connected to your board</div>
    </aside>
  );
}
