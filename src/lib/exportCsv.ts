import type { ActivityLogDoc, TaskDoc } from "@/lib/appwrite";

function escapeCsv(value: string | null | undefined) {
  const normalized = value ?? "";
  return `"${normalized.replaceAll('"', '""')}"`;
}

export function exportBoardCsv(tasks: TaskDoc[], logs: ActivityLogDoc[], eventName: string) {
  const lines = [
    `SyncBoard export: ${escapeCsv(eventName)}`,
    "",
    "Tasks",
    ["Title", "Category", "Priority", "Status", "Assigned Volunteer", "Due Time"].map(escapeCsv).join(","),
    ...tasks.map((task) => [
      task.title, task.category, task.priority, task.status, task.assigned_name, task.due_time,
    ].map(escapeCsv).join(",")),
    "",
    "Activity and incident log",
    ["Actor", "Action", "Created At", "SOS Alert"].map(escapeCsv).join(","),
    ...logs.map((log) => [log.actor_name, log.action_text, log.created_at, log.is_alert ? "Yes" : "No"].map(escapeCsv).join(",")),
  ];
  const blob = new Blob([`\uFEFF${lines.join("\r\n")}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${eventName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "syncboard"}-export.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
