import { DATABASE_ID, EVENTS_TABLE_ID, ID, TASKS_TABLE_ID, tablesDB, type EventDoc, type TaskCategory, type TaskPriority } from "@/lib/appwrite";

const demoTasks: { title: string; category: TaskCategory; priority: TaskPriority; status?: "open" | "claimed"; assigned_name?: string; assigned_to?: string }[] = [
  { title: "Set up welcome desk", category: "logistics", priority: "high" },
  { title: "Prepare volunteer lunch", category: "catering", priority: "medium" },
  { title: "Test presentation projector", category: "tech", priority: "critical" },
  { title: "Cover guest check-in", category: "helpdesk", priority: "low" },
  { title: "Place directional signage", category: "logistics", priority: "medium" },
  { title: "Restock hydration station", category: "catering", priority: "high" },
  { title: "Monitor support inbox", category: "helpdesk", priority: "medium", status: "claimed", assigned_name: "Demo Helper", assigned_to: "demo-helper" },
  { title: "Coordinate closing team", category: "logistics", priority: "low" },
];

export async function seedDemoBoard(ownerId: string) {
  const code = `DEMO${Math.floor(10 + Math.random() * 90)}`;
  const event = await tablesDB.createRow<EventDoc>({
    databaseId: DATABASE_ID,
    tableId: EVENTS_TABLE_ID,
    rowId: ID.unique(),
    data: { name: "SyncBoard Hackathon Demo", code, owner_id: ownerId, created_at: new Date().toISOString() },
  });
  await Promise.all(demoTasks.map((task) => tablesDB.createRow({
    databaseId: DATABASE_ID,
    tableId: TASKS_TABLE_ID,
    rowId: ID.unique(),
    data: {
      event_id: event.$id,
      title: task.title,
      category: task.category,
      priority: task.priority,
      status: task.status ?? "open",
      assigned_name: task.assigned_name ?? null,
      assigned_to: task.assigned_to ?? null,
      due_time: null,
    },
  })));
  return event;
}
