"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { money, pretty } from "@/lib/format";
import EstimateForm from "./EstimateForm";

type Order = {
  id: string;
  status: string;
  diagnosis: string | null;
  serviceRequest: { description: string; vehicle: { make: string; model: string; year: number } };
  estimate: { status: string; items: { id: string; description: string; amountCents: number }[] } | null;
};

// Mirrors lib/workflow.ts TECH_TRANSITIONS (DIAGNOSIS -> AWAITING_APPROVAL is via the estimate form)
const NEXT: Record<string, string | undefined> = {
  CHECKED_IN: "DIAGNOSIS",
  APPROVED: "IN_REPAIR",
  IN_REPAIR: "COMPLETED",
};

const WAITING: Record<string, string> = {
  AWAITING_APPROVAL: "Waiting for the customer to approve the estimate.",
  REJECTED: "The customer rejected the estimate. This work order is closed.",
  COMPLETED: "Repair completed.",
};

function OrderCard({ order, onChanged }: { order: Order; onChanged: (m: string) => void }) {
  const next = NEXT[order.status];

  async function advance() {
    if (!next) return;
    const res = await api<{ error?: string }>(`/api/work-orders/${order.id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: next }),
    });
    onChanged(res.ok ? `Status updated to ${pretty(next)}` : res.data?.error ?? "Update failed");
  }

  const total = order.estimate?.items.reduce((s, i) => s + i.amountCents, 0);

  return (
    <li className="space-y-2 rounded border p-3 text-sm">
      <div>
        <b>{order.serviceRequest.vehicle.year} {order.serviceRequest.vehicle.make} {order.serviceRequest.vehicle.model}</b>
        <span className="ml-2 rounded bg-green-100 px-2 py-0.5">{pretty(order.status)}</span>
        <div className="text-gray-600">{order.serviceRequest.description}</div>
      </div>
      {order.status === "DIAGNOSIS" && (
        <EstimateForm orderId={order.id} initialDiagnosis={order.diagnosis ?? ""} onDone={onChanged} />
      )}
      {order.status !== "DIAGNOSIS" && order.diagnosis && <div>Diagnosis: {order.diagnosis}</div>}
      {order.estimate && total !== undefined && (
        <div>Estimate: {money(total)} ({pretty(order.estimate.status)})</div>
      )}
      {next && (
        <button onClick={advance} className="rounded bg-black px-3 py-1 text-white">
          Move to {pretty(next)}
        </button>
      )}
      {!next && order.status !== "DIAGNOSIS" && (
        <p className="text-gray-500">{WAITING[order.status] ?? "No further action."}</p>
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