"use client";
/* eslint-disable @next/next/no-img-element */

import { avatars, type TaskDoc } from "@/lib/appwrite";
import { X } from "lucide-react";

type Props = { tasks: TaskDoc[]; open: boolean; onClose: () => void };

export function LeaderboardModal({ tasks, open, onClose }: Props) {
  if (!open) return null;
  const rankings = Array.from(tasks.reduce((counts, task) => {
    if (task.status === "completed" && task.assigned_name) counts.set(task.assigned_name, (counts.get(task.assigned_name) ?? 0) + 1);
    return counts;
  }, new Map<string, number>())).sort(([, left], [, right]) => right - left).slice(0, 5);
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="leaderboard-title">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
        <div className="mb-6 flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Team recognition</p><h2 id="leaderboard-title" className="mt-1 text-xl font-semibold">Top helpers</h2></div><button type="button" onClick={onClose} aria-label="Close leaderboard" className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"><X className="size-4" /></button></div>
        {rankings.length === 0 ? <p className="rounded-xl border border-dashed border-zinc-200 p-6 text-center text-sm text-zinc-500 dark:border-zinc-800">Completed shifts will appear here.</p> : <div className="space-y-2">{rankings.map(([name, count], index) => <div key={name} className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800/70 dark:bg-zinc-950/50"><span className="w-7 text-center text-xl">{medals[index] ?? `${index + 1}`}</span><img src={avatars.getInitials({ name, width: 48, height: 48 })} alt="" className="size-9 rounded-full" /><span className="flex-1 truncate text-sm font-medium text-zinc-900 dark:text-zinc-200">{name}</span><span className="text-xs text-zinc-500">{count} completed</span></div>)}</div>}
      </div>
    </div>
  );
}
