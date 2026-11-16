"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { money, pretty, vehicleLabel } from "@/lib/format";
import EstimateForm from "./EstimateForm";
import PartsPanel, { type UsedPart } from "./PartsPanel";
import { Stars } from "./people";
import { Button, Card, Empty, Notice, SectionTitle, Stat, StatusBadge, Timeline } from "./ui";

type Order = {
  id: string;
  status: string;
  diagnosis: string | null;
  serviceRequest: { description: string; vehicle: { make: string; model: string; year: number } };
  estimate: { status: string; items: { id: string; description: string; amountCents: number }[] } | null;
  review: { rating: number; comment: string | null } | null;
  parts: UsedPart[];
};

export type TechSection = "overview" | "orders";

// Mirrors lib/workflow.ts TECH_TRANSITIONS (DIAGNOSIS -> AWAITING_APPROVAL happens via the estimate form)
const NEXT: Record<string, string | undefined> = {
  CHECKED_IN: "DIAGNOSIS",
  APPROVED: "IN_REPAIR",
  IN_REPAIR: "COMPLETED",
};
const ACTION: Record<string, string> = {
  CHECKED_IN: "Start diagnosis",
  APPROVED: "Start repair",
  IN_REPAIR: "Mark repair completed",
};
const WAITING: Record<string, string> = {
  AWAITING_APPROVAL: "Waiting for the customer to approve the estimate.",
  REJECTED: "The customer rejected the estimate. This work order is closed.",
  COMPLETED: "Repair completed.",
};
const NEEDS_ACTION = ["CHECKED_IN", "DIAGNOSIS", "APPROVED", "IN_REPAIR"];

function OrderCard({ order, onChanged }: { order: Order; onChanged: (m: string) => void }) {
  const next = NEXT[order.status];
  const total = order.estimate?.items.reduce((s, i) => s + i.amountCents, 0) ?? 0;

  async function advance() {
    if (!next) return;
    const res = await api<{ error?: string }>(`/api/work-orders/${order.id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: next }),
    });
    onChanged(res.ok ? `Status updated to ${pretty(next)}` : res.data?.error ?? "Update failed");
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="font-medium text-slate-900">{vehicleLabel(order.serviceRequest.vehicle)}</div>
          <div className="text-sm text-slate-500">{order.serviceRequest.description}</div>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <Timeline status={order.status} />

      {order.status === "DIAGNOSIS" && (
        <EstimateForm orderId={order.id} initialDiagnosis={order.diagnosis ?? ""} onDone={onChanged} />
      )}
      {order.status !== "DIAGNOSIS" && order.diagnosis && (
        <p className="whitespace-pre-wrap text-sm text-slate-600">
          <span className="font-medium text-slate-700">Diagnosis: </span>
          {order.diagnosis}
        </p>
      )}

      {order.estimate && (
        <div className="mt-2 rounded-lg bg-slate-50 p-3 text-sm ring-1 ring-inset ring-slate-200">
          <div className="mb-1 flex justify-between font-medium text-slate-700">
            <span>Estimate ({pretty(order.estimate.status)})</span>
            <span>{money(total)}</span>
          </div>
          <ul className="divide-y divide-slate-200">
            {order.estimate.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-4 py-1.5">
                <span className="whitespace-pre-wrap break-words text-slate-600">{i.description}</span>
                <span className="shrink-0 font-medium text-slate-800">{money(i.amountCents)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(order.status === "IN_REPAIR" || order.parts.length > 0) && (
        <PartsPanel orderId={order.id} used={order.parts} editable={order.status === "IN_REPAIR"} onDone={onChanged} />
      )}

      {order.review && (
        <div className="mt-2 text-sm text-slate-600">
          <span className="font-medium text-slate-700">Customer rating: </span>
          <Stars value={order.review.rating} />
          {order.review.comment && <p className="mt-1 whitespace-pre-wrap">{order.review.comment}</p>}
        </div>
      )}

      {next && (
        <div className="mt-3">
          <Button onClick={advance}>{ACTION[order.status] ?? `Move to ${pretty(next)}`}</Button>
        </div>
      )}
      {!next && order.status !== "DIAGNOSIS" && (
        <p className="mt-2 text-sm text-slate-500">{WAITING[order.status] ?? "No further action."}</p>
      )}
    </Card>
  );
}

export default function TechView({ section }: { section: TechSection }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const res = await api<Order[]>("/api/work-orders");
    if (res.ok) setOrders(res.data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rated = orders.filter((o) => o.review);
  const avg = rated.length ? (rated.reduce((s, o) => s + o.review!.rating, 0) / rated.length).toFixed(1) : "No reviews yet";
  const actionable = orders.filter((o) => NEEDS_ACTION.includes(o.status)).length;

  return (
    <div className="space-y-8">
      <Notice message={msg} onClose={() => setMsg("")} />

      {section === "overview" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Assigned to me" value={orders.length} />
            <Stat label="Needs my action" value={actionable} accent={actionable > 0} />
            <Stat label="Awaiting customer" value={orders.filter((o) => o.status === "AWAITING_APPROVAL").length} />
            <Stat label="Average rating" value={avg} />
          </div>
          <Link
            href="/dashboard/orders"
            className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300 hover:shadow"
          >
            <div className="font-medium text-slate-900">My work orders</div>
            <div className="text-sm text-slate-500">Diagnose vehicles, send estimates, record parts and finish repairs.</div>
          </Link>
        </>
      )}

      {section === "orders" && (
        <section>
          <SectionTitle title="My work orders" />
          {orders.length === 0 ? (
            <Empty>No work orders assigned to you.</Empty>
          ) : (
            <div className="space-y-4">
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
            </div>
          )}
        </section>
      )}
    </div>
  );
}