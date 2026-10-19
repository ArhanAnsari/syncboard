"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { avatars, type TaskDoc, type TaskStatus } from "@/lib/appwrite";
import { Check, Clock3, GripVertical, Trash2, UserRound } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

const priorityStyles = {
  critical: "border-red-300 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300",
  high: "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
  medium: "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300",
  low: "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/70 dark:text-zinc-300",
};
const categoryStyles = {
  logistics: "text-violet-700 bg-violet-50 dark:text-violet-300 dark:bg-violet-500/10",
  catering: "text-orange-700 bg-orange-50 dark:text-orange-300 dark:bg-orange-500/10",
  tech: "text-cyan-700 bg-cyan-50 dark:text-cyan-300 dark:bg-cyan-500/10",
  helpdesk: "text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-500/10",
};

type Props = {
  task: TaskDoc;
  currentUserId?: string;
  onClaim: (task: TaskDoc) => Promise<void>;
  onStatusChange: (task: TaskDoc, status: TaskStatus) => Promise<void>;
  onDelete: (task: TaskDoc) => Promise<void>;
};

export function TaskCard({ task, currentUserId, onClaim, onStatusChange, onDelete }: Props) {
  const canEdit = !task.assigned_to || task.assigned_to === currentUserId;
  const [optimisticStatus, setOptimisticStatus] = useState(task.status);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!task.due_time) return;
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, [task.due_time]);
  const dueLabel = useMemo(() => {
    if (!task.due_time) return null;
    const delta = new Date(task.due_time).getTime() - now;
    if (delta <= 0) return "Overdue";
    const minutes = Math.max(1, Math.round(delta / 60_000));
    return minutes < 60 ? `Due in ${minutes}m` : `Due in ${Math.round(minutes / 60)}h`;
  }, [now, task.due_time]);
  const avatarUrl = task.assigned_name ? avatars.getInitials({ name: task.assigned_name, width: 48, height: 48 }) : null;
  const transitionStatus = async (status: TaskStatus) => {
    const previous = optimisticStatus;
    setOptimisticStatus(status);
    try {
      await onStatusChange(task, status);
    } catch (error) {
      setOptimisticStatus(previous);
      throw error;
    }
  };
  return (
    <article className="group rounded-2xl border border-zinc-200 bg-white p-4 text-zinc-900 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-700 dark:hover:bg-zinc-900">
      <div className="flex items-start gap-2">
        <GripVertical className="mt-0.5 size-4 shrink-0 text-zinc-300 transition-colors group-hover:text-zinc-500 dark:text-zinc-700" />
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-start justify-between gap-2">
            <h3 className="font-medium leading-snug text-zinc-900 dark:text-zinc-100">{task.title}</h3>
            <Button aria-label={`Delete ${task.title}`} variant="ghost" size="icon-xs" className="text-zinc-600 hover:text-red-300" onClick={() => void onDelete(task)}>
              <Trash2 />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge className={`border ${priorityStyles[task.priority]}`}>{task.priority}</Badge>
            <Badge className={`border-transparent ${categoryStyles[task.category]}`}>{task.category}</Badge>
          </div>
          <div className="mt-4 flex items-center justify-between gap-2">
            {task.assigned_name ? (
              <span className="flex min-w-0 items-center gap-1.5 text-xs text-zinc-400">
                {avatarUrl ? <Image src={avatarUrl} alt="" className="size-6 shrink-0 rounded-full" width={24} height={24} unoptimized /> : <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-400 to-cyan-400 text-[10px] font-bold text-zinc-950">{task.assigned_name.slice(0, 2).toUpperCase()}</span>}
                <span className="truncate">{task.assigned_name}</span>
              </span>
            ) : <span className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-600"><UserRound className="size-3.5" /> Unassigned</span>}
            {dueLabel && <span className={`flex items-center gap-1 text-xs ${dueLabel === "Overdue" ? "animate-pulse font-semibold text-red-300" : "text-zinc-500"}`}><Clock3 className="size-3" />{dueLabel}</span>}
          </div>
          {optimisticStatus === "open" && (
            <Button className="mt-4 h-9 w-full bg-cyan-400 font-semibold text-zinc-950 hover:bg-cyan-300" disabled={!currentUserId} onClick={() => void onClaim(task)}>
              <Check /> Claim Shift
            </Button>
          )}
          {optimisticStatus !== "open" && canEdit && (
            <Select value={optimisticStatus} onValueChange={(value) => void transitionStatus(value as TaskStatus)}>
              <SelectTrigger className="mt-4 h-9 w-full border-zinc-300 bg-zinc-50 text-xs dark:border-zinc-700 dark:bg-zinc-950/60"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="claimed">Claimed</SelectItem>
                <SelectItem value="in_progress">In progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    </article>
  );
}
