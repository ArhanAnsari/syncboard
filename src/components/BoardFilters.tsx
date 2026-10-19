"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TaskCategory, TaskPriority } from "@/lib/appwrite";
import { Search, SlidersHorizontal } from "lucide-react";

export type BoardFilterState = { search: string; category: TaskCategory | "all"; priority: TaskPriority | "all"; mineOnly: boolean };
type Props = { value: BoardFilterState; onChange: (value: BoardFilterState) => void };
const categories: { value: BoardFilterState["category"]; label: string }[] = [
  { value: "all", label: "All" }, { value: "tech", label: "Tech" }, { value: "logistics", label: "Logistics" }, { value: "catering", label: "Catering" }, { value: "helpdesk", label: "Helpdesk" },
];

export function BoardFilters({ value, onChange }: Props) {
  return (
    <div className="mb-5 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/50">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <label className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" /><Input id="board-search" value={value.search} onChange={(event) => onChange({ ...value, search: event.target.value })} placeholder="Search shifts…" className="h-9 border-zinc-300 bg-white pl-9 dark:border-zinc-800 dark:bg-zinc-950/60" /></label>
        <div className="flex items-center gap-1 overflow-x-auto pb-1 xl:pb-0">{categories.map((category) => <button key={category.value} type="button" onClick={() => onChange({ ...value, category: category.value })} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition ${value.category === category.value ? "bg-cyan-400 text-zinc-950" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"}`}>{category.label}</button>)}</div>
        <Select value={value.priority} onValueChange={(priority) => onChange({ ...value, priority: priority as BoardFilterState["priority"] })}><SelectTrigger className="h-9 w-full border-zinc-300 bg-white sm:w-36 dark:border-zinc-800 dark:bg-zinc-950/60"><SlidersHorizontal className="size-3.5" /><SelectValue placeholder="Priority" /></SelectTrigger><SelectContent><SelectItem value="all">All priorities</SelectItem>{(["critical", "high", "medium", "low"] as TaskPriority[]).map((item) => <SelectItem key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</SelectItem>)}</SelectContent></Select>
        <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap text-xs text-zinc-400"><button type="button" role="switch" aria-checked={value.mineOnly} onClick={() => onChange({ ...value, mineOnly: !value.mineOnly })} className={`relative h-5 w-9 rounded-full transition ${value.mineOnly ? "bg-cyan-400" : "bg-zinc-700"}`}><span className={`absolute top-1 size-3 rounded-full bg-white transition ${value.mineOnly ? "left-5" : "left-1"}`} /></button> My claimed shifts</label>
      </div>
    </div>
  );
}
