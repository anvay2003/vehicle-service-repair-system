"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button, Empty, SectionTitle } from "./ui";

type Item = { id: string; message: string; readAt: string | null; createdAt: string };

export default function NotificationList() {
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    const res = await api<{ unread: number; items: Item[] }>("/api/notifications");
    if (res.ok) {
      setItems(res.data.items);
      setUnread(res.data.unread);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function markAll() {
    await api("/api/notifications/read", { method: "POST" });
    await load();
    window.dispatchEvent(new Event("notifications:changed"));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <SectionTitle title="Notifications" hint={unread > 0 ? `${unread} unread` : "You're all caught up."} />
        {unread > 0 && (
          <Button variant="secondary" onClick={markAll}>
            Mark all as read
          </Button>
        )}
      </div>
      {items.length === 0 ? (
        <Empty>No notifications yet. Updates about your repairs appear here.</Empty>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li
              key={n.id}
              className={`rounded-lg border p-3 text-sm ${
                n.readAt ? "border-slate-200 bg-white text-slate-600" : "border-indigo-200 bg-indigo-50 text-slate-900"
              }`}
            >
              <div>{n.message}</div>
              <div className="mt-1 text-xs text-slate-500">{new Date(n.createdAt).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}