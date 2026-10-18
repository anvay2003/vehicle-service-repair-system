"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { pretty } from "@/lib/format";

type Order = {
  id: string;
  status: string;
  diagnosis: string | null;
  serviceRequest: { description: string; vehicle: { make: string; model: string; year: number } };
};

// Mirrors lib/workflow.ts TECH_TRANSITIONS
const NEXT: Record<string, string | undefined> = {
  CHECKED_IN: "DIAGNOSIS",
  DIAGNOSIS: "AWAITING_APPROVAL",
  APPROVED: "IN_REPAIR",
  IN_REPAIR: "COMPLETED",
};

function OrderCard({ order, onChanged }: { order: Order; onChanged: (m: string) => void }) {
  const [diagnosis, setDiagnosis] = useState(order.diagnosis ?? "");
  const next = NEXT[order.status];

  async function advance() {
    if (!next) return;
    const res = await api<{ error?: string }>(`/api/work-orders/${order.id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: next, ...(diagnosis ? { diagnosis } : {}) }),
    });
    onChanged(res.ok ? `Status updated to ${pretty(next)}` : res.data?.error ?? "Update failed");
  }

  return (
    <li className="space-y-2 rounded border p-3 text-sm">
      <div>
        <b>{order.serviceRequest.vehicle.year} {order.serviceRequest.vehicle.make} {order.serviceRequest.vehicle.model}</b>
        <span className="ml-2 rounded bg-green-100 px-2 py-0.5">{pretty(order.status)}</span>
        <div className="text-gray-600">{order.serviceRequest.description}</div>
      </div>
      {order.status === "DIAGNOSIS" && (
        <textarea
          className="w-full rounded border p-2"
          placeholder="Diagnosis and repair notes"
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
        />
      )}
      {order.status !== "DIAGNOSIS" && order.diagnosis && <div>Diagnosis: {order.diagnosis}</div>}
      {next ? (
        <button onClick={advance} className="rounded bg-black px-3 py-1 text-white">
          Move to {pretty(next)}
        </button>
      ) : (
        <p className="text-gray-500">Waiting on customer or no further action.</p>
      )}
    </li>
  );
}

export default function TechView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const res = await api<Order[]>("/api/work-orders");
    if (res.ok) setOrders(res.data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      {msg && <p className="rounded bg-blue-50 p-2 text-sm">{msg}</p>}
      <h2 className="text-xl font-semibold">My work orders</h2>
      {orders.length === 0 && <p className="text-sm text-gray-500">No work orders assigned to you.</p>}
      <ul className="space-y-2">
        {orders.map((o) => (
          <OrderCard
            key={`${o.id}-${o.status}`}
            order={o}
            onChanged={(m) => {
              setMsg(m);
              load();
            }}
          />
        ))}
      </ul>
    </div>
  );
}