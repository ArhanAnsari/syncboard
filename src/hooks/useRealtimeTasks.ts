"use client";

import {
  client,
  DATABASE_ID,
  EVENTS_TABLE_ID,
  ID,
  LOGS_TABLE_ID,
  Query,
  tablesDB,
  TASKS_TABLE_ID,
  type TaskCategory,
  type TaskDoc,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/appwrite";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const channel = `databases.${DATABASE_ID}.tables.${TASKS_TABLE_ID}.rows`;

async function addActivity(eventId: string, actorName: string, actionText: string, details?: string, action?: string) {
  await tablesDB.createRow({
    databaseId: DATABASE_ID,
    tableId: LOGS_TABLE_ID,
    rowId: ID.unique(),
    data: {
      event_id: eventId,
      actor_name: actorName,
      action_text: actionText,
      ...(action ? { action } : {}),
      ...(details ? { details } : {}),
      created_at: new Date().toISOString(),
    },
  });
}

export function useRealtimeTasks(eventId: string, enabled = true) {
  const [tasks, setTasks] = useState<TaskDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTasks = useCallback(async () => {
    if (!eventId || !enabled) return;
    setLoading(true);
    try {
      const result = await tablesDB.listRows<TaskDoc>({
        databaseId: DATABASE_ID,
        tableId: TASKS_TABLE_ID,
        queries: [Query.equal("event_id", eventId), Query.orderAsc("title")],
      });
      setTasks(result.rows);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load shifts.");
    } finally {
      setLoading(false);
    }
  }, [enabled, eventId]);

  useEffect(() => {
    void (async () => {
      await Promise.resolve();
      await loadTasks();
    })();
    if (!eventId || !enabled) return;
    const unsubscribe = client.subscribe<TaskDoc>(channel, (response) => {
      const row = response.payload as TaskDoc;
      if (row.event_id !== eventId) return;
      if (response.events.some((event) => event.endsWith(".create"))) {
        setTasks((current) => current.some((task) => task.$id === row.$id) ? current : [...current, row]);
      } else if (response.events.some((event) => event.endsWith(".update"))) {
        setTasks((current) => current.map((task) => task.$id === row.$id ? row : task));
      } else if (response.events.some((event) => event.endsWith(".delete"))) {
        setTasks((current) => current.filter((task) => task.$id !== row.$id));
      }
    });
    return unsubscribe;
  }, [enabled, eventId, loadTasks]);

  const createTask = useCallback(async (
    title: string,
    category: TaskCategory,
    priority: TaskPriority,
    actorName: string,
  ) => {
    const task = await tablesDB.createRow<TaskDoc>({
      databaseId: DATABASE_ID,
      tableId: TASKS_TABLE_ID,
      rowId: ID.unique(),
      data: {
        event_id: eventId,
        title: title.trim(),
        category,
        priority,
        status: "open",
        assigned_to: null,
        assigned_name: null,
        due_time: null,
      },
    });
    await addActivity(eventId, actorName, `created “${task.title}”`);
    toast.success("Shift created");
    return task;
  }, [eventId]);

  const updateTaskStatus = useCallback(async (
    taskId: string,
    newStatus: TaskStatus,
    actorName: string,
    taskTitle: string,
  ) => {
    await tablesDB.updateRow<TaskDoc>({
      databaseId: DATABASE_ID,
      tableId: TASKS_TABLE_ID,
      rowId: taskId,
      data: { status: newStatus },
    });
    await addActivity(eventId, actorName, `moved “${taskTitle}” to ${newStatus.replace("_", " ")}`);
    toast.success("Shift status updated");
  }, [eventId]);

  const claimTask = useCallback(async (taskId: string, userId: string, userName: string, taskTitle: string) => {
    await tablesDB.updateRow<TaskDoc>({
      databaseId: DATABASE_ID,
      tableId: TASKS_TABLE_ID,
      rowId: taskId,
      data: { status: "claimed", assigned_to: userId, assigned_name: userName },
    });
    await addActivity(eventId, userName, `claimed “${taskTitle}”`);
    toast.success("Shift claimed");
  }, [eventId]);

  const deleteTask = useCallback(async (taskId: string, actorName: string, taskTitle: string) => {
    await tablesDB.deleteRow({ databaseId: DATABASE_ID, tableId: TASKS_TABLE_ID, rowId: taskId });
    await addActivity(eventId, actorName, `removed “${taskTitle}”`);
    toast.success("Shift removed");
  }, [eventId]);

  const triggerSOS = useCallback(async (alertMessage: string, actorName: string) => {
    const message = alertMessage.trim();
    if (!message) throw new Error("Enter an alert message.");
    await tablesDB.createRow({
      databaseId: DATABASE_ID,
      tableId: LOGS_TABLE_ID,
      rowId: ID.unique(),
      data: {
        event_id: eventId,
        actor_name: actorName,
        action_text: message,
        created_at: new Date().toISOString(),
        is_alert: true,
      },
    });
    toast.success("SOS broadcast to the team");
  }, [eventId]);

  const resolveSOS = useCallback(async (targetEventId: string, actorName: string) => {
    const resolvedEventId = targetEventId || eventId;
    await addActivity(
      resolvedEventId,
      actorName,
      "SOS_RESOLVED",
      `SOS incident resolved by ${actorName}`,
      "SOS_RESOLVED",
    );
    toast.success("SOS incident resolved");
  }, [eventId]);

  const endBroadcast = useCallback(async (actorName: string) => {
    await tablesDB.updateRow({
      databaseId: DATABASE_ID,
      tableId: EVENTS_TABLE_ID,
      rowId: eventId,
      data: { status: "ended" },
    });
    await addActivity(eventId, actorName, "SESSION_ENDED", `Broadcast ended by ${actorName}`, "SESSION_ENDED");
  }, [eventId]);

  return { tasks, loading, createTask, updateTaskStatus, claimTask, deleteTask, triggerSOS, resolveSOS, endBroadcast, reload: loadTasks };
}
