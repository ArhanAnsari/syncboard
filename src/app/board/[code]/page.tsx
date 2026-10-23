"use client";

import { ActivityFeed } from "@/components/ActivityFeed";
import { BoardFilters, type BoardFilterState } from "@/components/BoardFilters";
import { JoinModalWithQR } from "@/components/JoinModalWithQR";
import { LeaderboardModal } from "@/components/LeaderboardModal";
import { SOSBanner } from "@/components/SOSBanner";
import { TaskCard } from "@/components/TaskCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AuthProviderBadge, useAuth } from "@/context/AuthContext";
import { client, DATABASE_ID, EVENTS_TABLE_ID, Query, realtime, tablesDB, type EventDoc, type Models, type TaskCategory, type TaskPriority, type TaskStatus } from "@/lib/appwrite";
import { Channel } from "appwrite";
import { AlertTriangle, ArrowLeft, CheckCircle2, Clipboard, Download, Plus, QrCode, Sparkles, Trophy, UsersRound, X } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useRealtimeLogs } from "@/hooks/useRealtimeLogs";
import { useRealtimeTasks } from "@/hooks/useRealtimeTasks";
import { exportBoardCsv } from "@/lib/exportCsv";

const columns: { status: TaskStatus; label: string; color: string }[] = [
  { status: "open", label: "Open shifts", color: "bg-cyan-400" },
  { status: "claimed", label: "Claimed", color: "bg-violet-400" },
  { status: "in_progress", label: "In progress", color: "bg-amber-400" },
  { status: "completed", label: "Completed", color: "bg-emerald-400" },
];

function BoardPageContent() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [event, setEvent] = useState<EventDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showSOS, setShowSOS] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showEndBroadcast, setShowEndBroadcast] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(2);
  const [showActivity, setShowActivity] = useState(false);
  const [sosMessage, setSosMessage] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TaskCategory>("logistics");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [filters, setFilters] = useState<BoardFilterState>({ search: "", category: "all", priority: "all", mineOnly: false });
  const [presenceIds, setPresenceIds] = useState<Set<string>>(new Set());
  const { tasks, createTask, updateTaskStatus, claimTask, deleteTask, triggerSOS, resolveSOS, endBroadcast, loading: tasksLoading } = useRealtimeTasks(event?.$id ?? "", !sessionEnded);
  const { logs, loading: logsLoading } = useRealtimeLogs(event?.$id ?? "", !sessionEnded);
  const previousTaskStatuses = useRef(new Map<string, TaskStatus>());
  const tasksInitialized = useRef(false);
  const logsInitialized = useRef(false);
  const previousLogIds = useRef(new Set<string>());

  useEffect(() => {
    if (tasksLoading) return;
    if (!tasksInitialized.current) {
      previousTaskStatuses.current = new Map(tasks.map((task) => [task.$id, task.status]));
      tasksInitialized.current = true;
      return;
    }
    for (const task of tasks) {
      if (task.status === "completed" && previousTaskStatuses.current.get(task.$id) !== "completed") {
      }
    }
    previousTaskStatuses.current = new Map(tasks.map((task) => [task.$id, task.status]));
  }, [tasks, tasksLoading]);

  useEffect(() => {
    if (logsLoading) return;
    if (!logsInitialized.current) {
      previousLogIds.current = new Set(logs.map((log) => log.$id));
      logsInitialized.current = true;
      return;
    }
    const incomingResolution = logs.some((log) => (log.action === "SOS_RESOLVED" || log.action_text === "SOS_RESOLVED") && !previousLogIds.current.has(log.$id));
    if (incomingResolution) {
      setShowActivity(true);
    }
    if (logs.some((log) => (log.action === "SESSION_ENDED" || log.action_text === "SESSION_ENDED") && !previousLogIds.current.has(log.$id))) {
      toast.error("This broadcast has been ended by the host. Redirecting to home...");
      setSessionEnded(true);
    }
    previousLogIds.current = new Set(logs.map((log) => log.$id));
  }, [logs, logsLoading]);

  useEffect(() => {
    if (!sessionEnded) return;
    const timer = window.setInterval(() => {
      setRedirectCountdown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [sessionEnded]);

  useEffect(() => {
    if (sessionEnded && redirectCountdown === 0) {
      router.push("/");
    }
  }, [redirectCountdown, router, sessionEnded]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const typing = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      if (event.key === "Escape") {
        setShowCreate(false);
        setShowSOS(false);
        setShowQR(false);
        setShowLeaderboard(false);
      } else if (!typing && event.key.toLowerCase() === "c") {
        setShowCreate(true);
      } else if (!typing && event.key === "/") {
        event.preventDefault();
        document.getElementById("board-search")?.focus();
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace(`/?join=${encodeURIComponent(code)}`); return; }
    tablesDB.listRows<EventDoc>({ databaseId: DATABASE_ID, tableId: EVENTS_TABLE_ID, queries: [Query.equal("code", code.toUpperCase()), Query.limit(1)] })
      .then((result) => {
        const board = result.rows[0] ?? null;
        if (board?.status === "ended" || board?.status === "archived") {
          toast.error("This broadcast has ended");
          router.replace("/");
          return;
        }
        setEvent(board);
      })
      .catch(() => toast.error("Could not find this board."))
      .finally(() => setLoading(false));
  }, [authLoading, code, router, user]);

  useEffect(() => {
    if (!user || sessionEnded) return;
    void realtime.upsertPresence({ presenceId: user.$id, status: "online", metadata: { name: user.name } }).catch(() => undefined);
    const unsubscribe = client.subscribe<Models.Presence>(Channel.presences(), (response) => {
      const presence = response.payload;
      if (!presence?.userId) return;
      setPresenceIds((current) => {
        const next = new Set(current);
        if (response.events.some((event) => event.endsWith(".delete"))) next.delete(presence.userId);
        else next.add(presence.userId);
        return next;
      });
    });
    return unsubscribe;
  }, [sessionEnded, user]);

  useEffect(() => {
    if (!event?.$id || sessionEnded) return;
    const unsubscribe = client.subscribe<EventDoc>(
      `databases.${DATABASE_ID}.tables.${EVENTS_TABLE_ID}.rows`,
      (response) => {
        const updatedEvent = response.payload as EventDoc;
        if (updatedEvent.$id !== event.$id) return;
        if (updatedEvent.status === "ended" || updatedEvent.status === "archived") {
          toast.error("This broadcast has been ended by the host. Redirecting to home...");
          setSessionEnded(true);
        } else {
          setEvent(updatedEvent);
        }
      },
    );
    return unsubscribe;
  }, [event?.$id, sessionEnded]);

  const filteredTasks = useMemo(() => tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(filters.search.trim().toLowerCase());
    const matchesCategory = filters.category === "all" || task.category === filters.category;
    const matchesPriority = filters.priority === "all" || task.priority === filters.priority;
    const matchesMine = !filters.mineOnly || task.assigned_to === user?.$id;
    return matchesSearch && matchesCategory && matchesPriority && matchesMine;
  }), [filters, tasks, user?.$id]);
  const grouped = useMemo(() => Object.fromEntries(columns.map((column) => [column.status, filteredTasks.filter((task) => task.status === column.status)])), [filteredTasks]);
  const latestAlert = logs.find((log) => log.is_alert);
  const latestResolution = logs.find((log) => log.action === "SOS_RESOLVED" || log.action_text === "SOS_RESOLVED");
  const alerts = latestAlert && (!latestResolution || new Date(latestAlert.created_at) > new Date(latestResolution.created_at)) ? [latestAlert] : [];
  const completedCount = tasks.filter((task) => task.status === "completed").length;
  const completionPercent = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;
  const copyCode = async () => { await navigator.clipboard.writeText(code.toUpperCase()); toast.success("Join code copied"); };
  const submitTask = async () => {
    if (!title.trim() || !user || !event) return;
    try { await createTask(title, category, priority, user.name || "Anonymous volunteer"); setTitle(""); setShowCreate(false); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not create shift."); }
  };
  const submitSOS = async () => {
    if (!user || !sosMessage.trim()) return;
    try { await triggerSOS(sosMessage, user.name || "Volunteer"); setSosMessage(""); setShowSOS(false); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not broadcast the SOS."); }
  };
  const submitResolveSOS = async () => {
    if (!user || !event) return;
    try {
      await resolveSOS(event.$id, user.name || "Coordinator");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not resolve the SOS.");
    }
  };
  const submitEndBroadcast = async () => {
    if (!user || !event || event.owner_id !== user.$id) return;
    try {
      await endBroadcast(user.name || "Coordinator");
      setShowEndBroadcast(false);
      setSessionEnded(true);
      toast.success("Broadcast ended for everyone");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not end the broadcast.");
    }
  };

  if (loading || authLoading) return <main className="flex min-h-screen items-center justify-center bg-zinc-50 text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">Loading your board…</main>;
  if (sessionEnded) return <main className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center bg-zinc-950 p-6 text-center text-zinc-100"><div className="max-w-md"><div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300"><CheckCircle2 className="size-8" /></div><h1 className="text-2xl font-semibold">Broadcast ended</h1><p className="mt-3 text-zinc-400">The host has ended this live broadcast. Thank you for your contribution!</p><p className="mt-6 text-sm text-zinc-500">Returning home in {redirectCountdown}…</p></div></main>;
  if (!event) return <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 text-center dark:bg-zinc-950"><p className="text-zinc-700 dark:text-zinc-300">This board could not be found.</p><Link href="/" className="text-cyan-600 hover:underline dark:text-cyan-300">Return home</Link></main>;

  return (
    <main className="min-h-screen overflow-x-hidden bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <SOSBanner alerts={alerts} canResolve={event.owner_id === user?.$id} onResolve={() => void submitResolveSOS()} />
      <header className="border-b border-zinc-200 bg-white/90 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3"><Link href="/" aria-label="Back home" className="shrink-0 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"><ArrowLeft className="size-5" /></Link><div className="min-w-0"><p className="truncate text-base font-semibold sm:text-lg">{event.name}</p><p className="text-xs text-zinc-500">Operations board</p></div></div>
          <div className="flex w-full flex-wrap items-center justify-end gap-1.5 sm:w-auto sm:gap-2"><span className="mr-auto flex items-center gap-1.5 text-xs text-zinc-500 sm:mr-0"><UsersRound className="size-3.5 text-emerald-400" />{Math.max(1, presenceIds.size)} live</span><ThemeToggle /><Button variant="outline" size="sm" onClick={() => setShowActivity((current) => !current)} className="lg:hidden">{showActivity ? "Hide feed" : "Activity"}</Button><Button variant="outline" size="sm" onClick={() => setShowLeaderboard(true)}><Trophy /><span className="hidden sm:inline">Top helpers</span></Button><Button variant="outline" size="sm" onClick={() => exportBoardCsv(tasks, logs, event.name)}><Download /><span className="hidden sm:inline">Export</span></Button><Button variant="outline" size="sm" onClick={() => setShowQR(true)}><QrCode /><span className="hidden sm:inline">Invite</span></Button>{event.owner_id === user?.$id && <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-500/10" onClick={() => setShowEndBroadcast(true)}>End broadcast</Button>}<Button variant="outline" size="sm" onClick={() => void copyCode()}><Clipboard /><span className="hidden sm:inline">Code</span> <span className="font-mono text-cyan-600 dark:text-cyan-300">{code.toUpperCase()}</span></Button><span className="hidden items-center gap-2 md:flex"><AuthProviderBadge /></span></div>
        </div>
      </header>
      <div className="mx-auto max-w-[1600px] px-5 py-6 lg:px-8">
        <div className="mb-5 flex flex-col items-stretch gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-1 flex items-center gap-2 text-sm font-medium text-cyan-300"><Sparkles className="size-4" /> Live coordination</p><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Today&apos;s shifts</h1></div><div className="flex w-full gap-2 sm:w-auto"><Button variant="outline" className="min-h-11 flex-1 border-red-500/40 text-red-300 hover:bg-red-500/10 sm:flex-none" onClick={() => setShowSOS(true)}><AlertTriangle /> Broadcast SOS</Button><Button onClick={() => setShowCreate(true)} className="min-h-11 flex-1 bg-cyan-400 font-semibold text-zinc-950 hover:bg-cyan-300 sm:flex-none"><Plus /><span className="hidden sm:inline">New shift</span></Button></div></div>
        <div className="mb-5 rounded-xl border border-zinc-200 bg-white px-3 py-2 shadow-sm dark:border-zinc-800/70 dark:bg-zinc-900/40"><div className="mb-2 flex justify-between text-xs text-zinc-500"><span>{completedCount}/{tasks.length} shifts completed</span><span>{completionPercent}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-zinc-800"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-500" style={{ width: `${completionPercent}%` }} /></div></div>
        <BoardFilters value={filters} onChange={setFilters} />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-2 md:overflow-visible md:pb-0 xl:grid-cols-4">{columns.map((column) => <div key={column.status} className="min-h-[420px] min-w-[min(86vw,340px)] snap-start rounded-2xl border border-zinc-200 bg-zinc-100/70 p-3 md:min-w-0 dark:border-zinc-800/80 dark:bg-zinc-900/40"><div className="mb-4 flex items-center justify-between px-1"><h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{column.label}</h2><span className={`size-2 rounded-full ${column.color}`} /></div><div className="space-y-3">{grouped[column.status].map((task) => <TaskCard key={task.$id} task={task} currentUserId={user?.$id} onClaim={(item) => claimTask(item.$id, user?.$id || "", user?.name || "Volunteer", item.title)} onStatusChange={(item, status) => updateTaskStatus(item.$id, status, user?.name || "Volunteer", item.title)} onDelete={(item) => deleteTask(item.$id, user?.name || "Volunteer", item.title)} />)}</div></div>)}</section>
          <div className={`${showActivity ? "block" : "hidden"} lg:block`}><ActivityFeed logs={logs} loading={logsLoading} /></div>
        </div>
      </div>
      <JoinModalWithQR code={code.toUpperCase()} open={showQR} onClose={() => setShowQR(false)} />
      <LeaderboardModal tasks={tasks} open={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
      {showCreate && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm dark:bg-black/70" role="dialog" aria-modal="true"><div className="max-h-[90vh] w-[95vw] max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-5 text-zinc-900 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"><div className="mb-6 flex justify-between"><div><h2 className="text-lg font-semibold">Create a new shift</h2><p className="mt-1 text-sm text-zinc-500">Give your team a clear next action.</p></div><button onClick={() => setShowCreate(false)} aria-label="Close"><X className="text-zinc-500" /></button></div>      <label className="mb-5 block text-sm text-zinc-700 dark:text-zinc-300">Shift title<Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Set up welcome desk" className="mt-2 h-10" /></label><div className="mb-6 grid grid-cols-2 gap-3"><label className="text-sm text-zinc-700 dark:text-zinc-300">Category<Select value={category} onValueChange={(value) => setCategory(value as TaskCategory)}><SelectTrigger className="mt-2 w-full"><SelectValue /></SelectTrigger><SelectContent>{(["logistics", "catering", "tech", "helpdesk"] as TaskCategory[]).map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></label><label className="text-sm text-zinc-700 dark:text-zinc-300">Priority<Select value={priority} onValueChange={(value) => setPriority(value as TaskPriority)}><SelectTrigger className="mt-2 w-full"><SelectValue /></SelectTrigger><SelectContent>{(["low", "medium", "high", "critical"] as TaskPriority[]).map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></label></div><div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button><Button disabled={!title.trim()} onClick={() => void submitTask()} className="bg-cyan-400 text-zinc-950 hover:bg-cyan-300">Create shift</Button></div></div></div>}
      {showSOS && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm dark:bg-black/70" role="dialog" aria-modal="true"><div className="max-h-[90vh] w-[95vw] max-w-lg overflow-y-auto rounded-2xl border border-red-300 bg-white p-5 text-zinc-900 shadow-xl dark:border-red-500/30 dark:bg-zinc-900 dark:text-zinc-100"><div className="mb-5 flex justify-between"><div><h2 className="flex items-center gap-2 text-lg font-semibold       text-red-700 dark:text-red-200"><AlertTriangle className="size-5" /> Broadcast urgent alert</h2><p className="mt-1 text-sm text-zinc-500">Every volunteer on this board will see it immediately.</p></div><button onClick={() => setShowSOS(false)} aria-label="Close"><X className="text-zinc-500" /></button></div><label className="block text-sm text-zinc-700 dark:text-zinc-300">What does the team need to know?<Input autoFocus value={sosMessage} onChange={(e) => setSosMessage(e.target.value)} placeholder="e.g. Medical support needed at entrance" className="mt-2 h-11 border-red-500/30" /></label><Button disabled={!sosMessage.trim()} onClick={() => void submitSOS()} className="mt-5 h-11 w-full bg-red-500 font-semibold text-white hover:bg-red-400">Broadcast SOS</Button></div></div>}
      {showEndBroadcast && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm dark:bg-black/70" role="dialog" aria-modal="true" aria-labelledby="end-broadcast-title"><div className="max-h-[90vh] w-[95vw] max-w-lg overflow-y-auto rounded-2xl border border-red-300 bg-white p-5 text-zinc-900 shadow-xl dark:border-red-500/30 dark:bg-zinc-900 dark:text-zinc-100"><div className="mb-5 flex justify-between"><div><h2 id="end-broadcast-title" className="text-lg font-semibold">End broadcast for everyone?</h2><p className="mt-2 text-sm text-zinc-500">All volunteers will be disconnected and returned to the landing page.</p></div><button onClick={() => setShowEndBroadcast(false)} aria-label="Close"><X className="text-zinc-500" /></button></div><div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setShowEndBroadcast(false)}>Keep live</Button><Button className="bg-red-500 font-semibold text-white hover:bg-red-400" onClick={() => void submitEndBroadcast()}>End broadcast</Button></div></div></div>}
    </main>
  );
}

export default function BoardPage() {
  return <Suspense fallback={<main className="min-h-screen bg-zinc-950" />}><BoardPageContent /></Suspense>;
}
