"use client";

import { client, DATABASE_ID, LOGS_TABLE_ID, Query, tablesDB, type ActivityLogDoc } from "@/lib/appwrite";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function useRealtimeLogs(eventId: string, enabled = true) {
  const [logs, setLogs] = useState<ActivityLogDoc[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!eventId || !enabled) {
      return;
    }
    let active = true;
    const load = async () => {
      try {
        const result = await tablesDB.listRows<ActivityLogDoc>({
          databaseId: DATABASE_ID,
          tableId: LOGS_TABLE_ID,
          queries: [
            Query.equal("event_id", eventId),
            Query.orderDesc("created_at"),
            Query.limit(15),
          ],
        });
        if (active) setLogs(result.rows);
      } catch (error) {
        if (active) toast.error(error instanceof Error ? error.message : "Could not load activity.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    const unsubscribe = client.subscribe<ActivityLogDoc>(
      `databases.${DATABASE_ID}.tables.${LOGS_TABLE_ID}.rows`,
      (response) => {
        const log = response.payload as ActivityLogDoc;
        if (log.event_id !== eventId || !response.events.some((event) => event.endsWith(".create"))) return;
        setLogs((current) => [log, ...current.filter((item) => item.$id !== log.$id)].slice(0, 15));
      },
    );
    return () => {
      active = false;
      unsubscribe();
    };
  }, [enabled, eventId]);
  return { logs, loading };
}
