"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function NotificationBell() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let alive = true;
    async function poll() {
      const res = await api<{ unread: number }>("/api/notifications");
      if (alive && res.ok) setUnread(res.data.unread);
    }
    poll();
    const timer = setInterval(poll, 30_000);
    window.addEventListener("notifications:changed", poll);
    return () => {
      alive = false;
      clearInterval(timer);
      window.removeEventListener("notifications:changed", poll);
    };
  }, []);

  return (
    <Link
      href="/dashboard/notifications"
      aria-label={`Notifications, ${unread} unread`}
      className="relative rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
    >
      🔔
      {unread > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-semibold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}