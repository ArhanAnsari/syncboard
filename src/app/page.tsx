"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { UserButton } from "@/components/UserButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DATABASE_ID, EVENTS_TABLE_ID, ID, Query, tablesDB, type EventDoc } from "@/lib/appwrite";
import { seedDemoBoard } from "@/lib/seedDemo";
import { ArrowRight, CalendarDays, CheckCircle2, Copy, Mail, Radio, Sparkles, UsersRound, X } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";

function generateCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, loginAnonymous, sendEmailOTP, verifyEmailOTP, loginWithOAuth } = useAuth();
  const [eventName, setEventName] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [joinCode, setJoinCode] = useState(searchParams.get("join")?.toUpperCase() ?? "");
  const [volunteerName, setVolunteerName] = useState("");
  const [busy, setBusy] = useState<"create" | "join" | null>(null);
  const [showEmailAuth, setShowEmailAuth] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpUserId, setOtpUserId] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [oauthProvider, setOauthProvider] = useState<"appwrite" | "github" | null>(null);
  const [demoBusy, setDemoBusy] = useState(false);

  useEffect(() => {
    if (searchParams.get("auth") === "failed") toast.error("Sign-in was cancelled or could not be completed.");
  }, [searchParams]);

  const startOAuth = (provider: "appwrite" | "github") => {
    setOauthProvider(provider);
    try {
      loginWithOAuth(provider);
    } catch (error) {
      setOauthProvider(null);
      toast.error(error instanceof Error ? error.message : "Could not start sign-in.");
    }
  };

  const createBoard = async () => {
    if (!eventName.trim() || !creatorName.trim()) { toast.error("Add an event name and your name."); return; }
    setBusy("create");
    try {
      const currentUser = await loginAnonymous(creatorName);
      if (!currentUser) throw new Error("Could not start your volunteer session.");
      const code = generateCode();
      const event = await tablesDB.createRow<EventDoc>({ databaseId: DATABASE_ID, tableId: EVENTS_TABLE_ID, rowId: ID.unique(), data: { name: eventName.trim(), code, owner_id: currentUser.$id, created_at: new Date().toISOString() } });
      toast.success("Operations board created");
      router.push(`/board/${event.code}`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not create the board."); }
    finally { setBusy(null); }
  };

  const joinBoard = async () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6 || !volunteerName.trim()) { toast.error("Enter a 6-character code and your name."); return; }
    setBusy("join");
    try {
      const result = await tablesDB.listRows<EventDoc>({ databaseId: DATABASE_ID, tableId: EVENTS_TABLE_ID, queries: [Query.equal("code", code), Query.limit(1)] });
      const board = result.rows[0];
      if (!board) throw new Error("No board found for that join code.");
      if (board.status === "ended" || board.status === "archived") {
        throw new Error("This broadcast has ended and is no longer accepting participants.");
      }
      await loginAnonymous(volunteerName);
      toast.success(`Welcome to ${board.name}`);
      router.push(`/board/${code}`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not join the board."); }
    finally { setBusy(null); }
  };

  const requestOTP = async () => {
    setAuthBusy(true);
    try {
      const userId = await sendEmailOTP(email);
      setOtpUserId(userId);
      setOtpSent(true);
      toast.success("Verification code sent");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not send the code."); }
    finally { setAuthBusy(false); }
  };

  const verifyOTP = async () => {
    setAuthBusy(true);
    try {
      await verifyEmailOTP(otpUserId, otp);
      toast.success("Signed in successfully");
      setShowEmailAuth(false);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not verify the code."); }
    finally { setAuthBusy(false); }
  };

  const tryDemo = async () => {
    setDemoBusy(true);
    try {
      const demoUser = user ?? await loginAnonymous("Hackathon Judge");
      if (!demoUser) throw new Error("Could not start the demo session.");
      const demoEvent = await seedDemoBoard(demoUser.$id);
      toast.success("Demo board ready");
      router.push(`/board/${demoEvent.code}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not seed the demo board.");
    } finally {
      setDemoBusy(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="pointer-events-none absolute left-1/2 top-[-18rem] size-[42rem] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
      <nav className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8"><div className="flex items-center gap-2 font-semibold tracking-tight"><span className="flex size-8 items-center justify-center rounded-lg bg-cyan-400 text-zinc-950"><Radio className="size-4" /></span>SyncBoard</div><div className="flex items-center gap-3"><span className="hidden text-xs text-zinc-500 sm:block">Volunteer operations, in sync</span><ThemeToggle />{!authLoading && <UserButton />}</div></nav>
      <section className="relative mx-auto max-w-7xl px-6 pb-16 pt-16 lg:px-8 lg:pb-28 lg:pt-24">
        <div className="max-w-3xl"><div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1.5 text-xs font-medium text-cyan-700 dark:text-cyan-300"><Sparkles className="size-3.5" /> Built for teams that make things happen</div><h1 className="text-5xl font-semibold tracking-[-0.04em] text-zinc-950 dark:text-white sm:text-7xl">Make every shift <span className="text-cyan-600 dark:text-cyan-300">count.</span></h1><p className="mt-6 max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">A real-time command center for volunteer teams. Create a board, share one code, and keep every handoff moving.</p></div>
        {user && <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-300 bg-emerald-50 p-5 dark:border-emerald-400/20 dark:bg-emerald-400/5"><div><p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Welcome back, {user.name || user.email || "volunteer"}.</p><p className="mt-1 text-sm text-zinc-400">Your workspace is ready for the next shift.</p></div><div className="flex flex-wrap gap-2"><Button onClick={() => document.getElementById("create-board")?.scrollIntoView({ behavior: "smooth" })} variant="outline" className="border-zinc-700">Create board</Button><Button onClick={() => document.getElementById("join-board")?.scrollIntoView({ behavior: "smooth" })} variant="outline" className="border-zinc-700">Jump to a board</Button><Button onClick={() => void tryDemo()} disabled={demoBusy} className="bg-emerald-400 text-zinc-950 hover:bg-emerald-300">{demoBusy ? "Seeding…" : "Try demo event"}</Button></div></div>}
        <div className="mt-12 grid max-w-5xl gap-5 md:grid-cols-2">
          <div id="create-board" className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:shadow-2xl dark:shadow-black/20 dark:hover:border-zinc-700 sm:p-8"><div className="mb-8 flex items-center justify-between"><div><h2 className="text-xl font-semibold">Create operations board</h2><p className="mt-1 text-sm text-zinc-500">For event leads and coordinators</p></div><CalendarDays className="size-6 text-cyan-300" /></div><div className="space-y-4"><label className="block text-sm text-zinc-700 dark:text-zinc-300">Event name<Input value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="e.g. Neighbourhood food drive" className="mt-2 h-11 bg-white dark:bg-zinc-800" /></label>          <label className="block text-sm text-zinc-700 dark:text-zinc-300">Your name<Input value={creatorName} onChange={(e) => setCreatorName(e.target.value)} placeholder="e.g. Alex Morgan" className="mt-2 h-11 bg-white dark:bg-zinc-800" /></label><Button onClick={() => void createBoard()} disabled={busy !== null} className="h-11 w-full bg-cyan-400 font-semibold text-zinc-950 hover:bg-cyan-300">{busy === "create" ? "Creating…" : "Create board"} <ArrowRight /></Button></div></div>
          <div id="join-board" className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:shadow-2xl dark:shadow-black/20 dark:hover:border-zinc-700 sm:p-8"><div className="mb-8 flex items-center justify-between"><div><h2 className="text-xl font-semibold">Join existing board</h2><p className="mt-1 text-sm text-zinc-500">Jump into a team in seconds</p></div><UsersRound className="size-6 text-violet-300" /></div><div className="space-y-4"><label className="block text-sm text-zinc-700 dark:text-zinc-300">6-character join code<Input value={joinCode} maxLength={6} onChange={(e) => setJoinCode(e.target.value.replace(/[^a-z0-9]/gi, "").toUpperCase())} placeholder="ABC123" className="mt-2 h-11 bg-white dark:bg-zinc-800 font-mono uppercase tracking-[0.3em]" /></label><label className="block text-sm text-zinc-700 dark:text-zinc-300">Your name<Input value={volunteerName} onChange={(e) => setVolunteerName(e.target.value)} placeholder="e.g. Jamie Lee" className="mt-2 h-11 bg-white dark:bg-zinc-800" /></label><Button onClick={() => void joinBoard()} disabled={busy !== null} variant="outline" className="h-11 w-full border-zinc-700 bg-white dark:bg-zinc-800 font-semibold hover:bg-zinc-800">{busy === "join" ? "Joining…" : "Join board"} <ArrowRight /></Button></div></div>
        </div>
        {!user && <div className="mt-5"><Button onClick={() => void tryDemo()} disabled={demoBusy} variant="outline" className="border-emerald-400/30 text-emerald-300 hover:bg-emerald-400/10">{demoBusy ? "Seeding demo…" : "Try demo event"} <ArrowRight /></Button></div>}
        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-zinc-500"><span className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-400" /> No account required</span><span className="flex items-center gap-2"><Radio className="size-4 text-cyan-400" /> Live updates</span><span className="flex items-center gap-2"><Copy className="size-4 text-violet-400" /> One simple code</span>{!authLoading && !user && <button type="button" onClick={() => setShowEmailAuth(true)} className="flex items-center gap-2 text-zinc-700 transition hover:text-cyan-600 dark:text-zinc-300 dark:hover:text-cyan-300"><Mail className="size-4" /> Sign in with email</button>}{!authLoading && user && <span className="flex items-center gap-2 text-emerald-300"><CheckCircle2 className="size-4" /> You&apos;re ready to coordinate</span>}</div>
      </section>
      {!authLoading && !user && showEmailAuth && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="email-auth-title"><div className="relative w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl sm:p-8"><button type="button" aria-label="Close email sign in" onClick={() => setShowEmailAuth(false)} className="absolute right-4 top-4 rounded-lg p-2 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"><X className="size-4" /></button><div className="mb-6"><h2 id="email-auth-title" className="text-xl font-semibold">Sign in securely</h2><p className="mt-1 text-sm text-zinc-500">Use a one-time code. No password to remember.</p></div>{!otpSent ? <><label className="block text-sm text-zinc-700 dark:text-zinc-300">Email address<Input type="email" autoFocus value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="mt-2 h-11 bg-white dark:bg-zinc-800" /></label><Button disabled={authBusy || !email.trim()} onClick={() => void requestOTP()} className="mt-5 h-11 w-full bg-cyan-400 font-semibold text-zinc-950 hover:bg-cyan-300">{authBusy ? "Sending…" : "Send one-time code"} <ArrowRight /></Button></> : <><label className="block text-sm text-zinc-700 dark:text-zinc-300">Verification code<Input inputMode="numeric" autoFocus value={otp} onChange={(event) => setOtp(event.target.value)} placeholder="Enter the code from your email" className="mt-2 h-11 bg-white dark:bg-zinc-800 font-mono tracking-[0.2em]" /></label><Button disabled={authBusy || !otp.trim()} onClick={() => void verifyOTP()} className="mt-5 h-11 w-full bg-cyan-400 font-semibold text-zinc-950 hover:bg-cyan-300">{authBusy ? "Verifying…" : "Verify and sign in"} <CheckCircle2 /></Button></>}<div className="my-5 flex items-center gap-3 text-xs text-zinc-600"><span className="h-px flex-1 bg-zinc-800" />or continue with<span className="h-px flex-1 bg-zinc-800" /></div><div className="space-y-2"><Button variant="outline" disabled={oauthProvider !== null} className="h-11 w-full justify-start border-pink-400/40 bg-[#FD366E]/10 text-pink-100 hover:border-[#FD366E] hover:bg-[#FD366E]/20" onClick={() => startOAuth("appwrite")}>{oauthProvider === "appwrite" ? <span className="size-4 animate-spin rounded-full border-2 border-pink-200 border-t-transparent" /> : <Image src="/appwrite.svg" alt="" width={20} height={20} />} Continue with Appwrite</Button><Button variant="outline" disabled={oauthProvider !== null} className="h-11 w-full justify-start border-zinc-700 bg-zinc-950/40 text-zinc-100 hover:border-zinc-500 hover:bg-zinc-800" onClick={() => startOAuth("github")}>{oauthProvider === "github" ? <span className="size-4 animate-spin rounded-full border-2 border-zinc-200 border-t-transparent" /> : <Image src="/github.svg" alt="" width={20} height={20} />} Continue with GitHub</Button></div></div></div>}
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-zinc-950" />}>
      <HomeContent />
    </Suspense>
  );
}
