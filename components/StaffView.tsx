"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { money, vehicleLabel } from "@/lib/format";
import { Avatar } from "./people";
import { Button, Card, Empty, Notice, SectionTitle, Stat, StatusBadge } from "./ui";

type Req = {
  id: string;
  description: string;
  status: string;
  vehicle: { make: string; model: string; year: number };
  customer: { name: string; email: string };
};
type Order = {
  id: string;
  status: string;
  technicianId: string | null;
  serviceRequest: { description: string; vehicle: { make: string; model: string; year: number } };
  technician: { name: string; avatarUrl: string | null } | null;
  estimate?: { status: string; items: { amountCents: number }[] } | null;
};
type Tech = { id: string; name: string };
type PublicTech = { id: string; avatarUrl: string | null; avgRating: number | null; reviewCount: number };
type TechInfo = Tech & { avatarUrl: string | null; avgRating: number | null; reviewCount: number };

const CLOSED = ["COMPLETED", "REJECTED"];

export default function StaffView() {
  const [queue, setQueue] = useState<Req[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [techs, setTechs] = useState<TechInfo[]>([]);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const [a, b, c, d] = await Promise.all([
      api<Req[]>("/api/service-requests?status=REQUESTED"),
      api<Order[]>("/api/work-orders"),
      api<Tech[]>("/api/technicians"),
      api<{ technicians: PublicTech[] }>("/api/reviews"),
    ]);
    if (a.ok) setQueue(a.data);
    if (b.ok) setOrders(b.data);
    if (c.ok) {
      const extra = new Map((d.ok ? d.data.technicians : []).map((t) => [t.id, t]));
      setTechs(
        c.data.map((t) => ({
          ...t,
          avatarUrl: extra.get(t.id)?.avatarUrl ?? null,
          avgRating: extra.get(t.id)?.avgRating ?? null,
          reviewCount: extra.get(t.id)?.reviewCount ?? 0,
        }))
      );
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function checkIn(id: string) {
    const res = await api<{ error?: string }>(`/api/service-requests/${id}/check-in`, { method: "POST" });
    setMsg(res.ok ? "Vehicle checked in, work order created" : res.data?.error ?? "Check-in failed");
    load();
  }

  async function assign(orderId: string, technicianId: string) {
    const res = await api<{ error?: string }>(`/api/work-orders/${orderId}/assign`, {
      method: "POST",
      body: JSON.stringify({ technicianId }),
    });
    setMsg(res.ok ? "Technician assigned" : res.data?.error ?? "Assignment failed");
    load();
  }

  const open = orders.filter((o) => !CLOSED.includes(o.status));

  return (
    <div className="space-y-10">
      <Notice message={msg} onClose={() => setMsg("")} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Awaiting check-in" value={queue.length} accent={queue.length > 0} />
        <Stat label="Open work orders" value={open.length} />
        <Stat label="Unassigned" value={open.filter((o) => !o.technicianId).length} />
      </div>

      <section>
        <SectionTitle title="Service request queue" hint="Requests waiting to be checked in." />
        {queue.length === 0 ? (
          <Empty>No requests awaiting check-in.</Empty>
        ) : (
          <div className="space-y-3">
            {queue.map((q) => (
              <Card key={q.id} className="flex items-center justify-between gap-4 !p-4">
                <div className="text-sm">
                  <div className="font-medium text-slate-900">
                    {vehicleLabel(q.vehicle)} <span className="font-normal text-slate-500">· {q.customer.name}</span>
                  </div>
                  <div className="text-slate-600">{q.description}</div>
                </div>
                <Button onClick={() => checkIn(q.id)}>Check in</Button>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionTitle title="Work orders" hint="Choose a technician for each open order." />
        {orders.length === 0 ? (
          <Empty>No work orders yet.</Empty>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <Card key={o.id} className="!p-4">
                <div className="text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-slate-900">{vehicleLabel(o.serviceRequest.vehicle)}</span>
                    <StatusBadge status={o.status} />
                  </div>
                  <div className="text-slate-600">{o.serviceRequest.description}</div>
                  <div className="mt-1 flex items-center gap-2 text-slate-500">
                    <span>Technician:</span>
                    {o.technician ? (
                      <>
                        <Avatar name={o.technician.name} src={o.technician.avatarUrl} size={22} />
                        <span>{o.technician.name}</span>
                      </>
                    ) : (
                      <span>Unassigned</span>
                    )}
                    {o.estimate && <span>· Estimate {money(o.estimate.items.reduce((s, i) => s + i.amountCents, 0))}</span>}
                  </div>
                </div>

                {!CLOSED.includes(o.status) && (
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                      {o.technicianId ? "Reassign technician" : "Assign technician"}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {techs.map((t) => {
                        const selected = o.technicianId === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            disabled={selected}
                            onClick={() => assign(o.id, t.id)}
                            className={`flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm transition ${
                              selected
                                ? "border-indigo-500 bg-indigo-50 text-indigo-900"
                                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <Avatar name={t.name} src={t.avatarUrl} size={28} />
                            <span>{t.name}</span>
                            {t.reviewCount > 0 && t.avgRating !== null && (
                              <span className="text-xs text-amber-600">★ {t.avgRating.toFixed(1)}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}