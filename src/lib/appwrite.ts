"use client";

import { Account, Avatars, Client, Databases, ID, Query, Realtime, TablesDB } from "appwrite";
import type { Models } from "appwrite";
export type { Models } from "appwrite";

export const APPWRITE_ENDPOINT =
  process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? "https://cloud.appwrite.io/v1";
export const APPWRITE_PROJECT_ID =
  process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "";
export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ?? "";
export const EVENTS_TABLE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_TABLE_EVENTS ?? "events";
export const TASKS_TABLE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_TABLE_TASKS ?? "tasks";
export const LOGS_TABLE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_TABLE_LOGS ?? "activity_logs";

export const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);
export const account = new Account(client);
export const avatars = new Avatars(client);
export const databases = new Databases(client);
export const tablesDB = new TablesDB(client);
export const realtime = new Realtime(client);

export type TaskCategory = "logistics" | "catering" | "tech" | "helpdesk";
export type TaskPriority = "low" | "medium" | "high" | "critical";
export type TaskStatus = "open" | "claimed" | "in_progress" | "completed";

export interface EventDoc extends Models.Row {
  name: string;
  code: string;
  owner_id: string;
  created_at: string;
  status?: "active" | "ended" | "archived";
}

export interface TaskDoc extends Models.Row {
  event_id: string;
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  assigned_to: string | null;
  assigned_name: string | null;
  due_time?: string | null;
}

export interface ActivityLogDoc extends Models.Row {
  event_id: string;
  actor_name: string;
  action_text: string;
  created_at: string;
  is_alert?: boolean;
  action?: string;
  details?: string;
}

export { ID, Query };
