"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { pretty } from "@/lib/format";

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
  technician: { name: string } | null;
};
type Tech = { id: string; name: string };

export default function StaffView() {
  const [queue, setQueue] = useState<Req[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [techs, setTechs] = useState<Tech[]>([]);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const [a, b, c] = await Promise.all([
      api<Req[]>("/api/service-requests?status=REQUESTED"),
      api<Order[]>("/api/work-orders"),
      api<Tech[]>("/api/technicians"),
    ]);
    if (a.ok) setQueue(a.data);
    if (b.ok) setOrders(b.data);
    if (c.ok) setTechs(c.data);
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
    if (!technicianId) return;
    const res = await api<{ error?: string }>(`/api/work-orders/${orderId}/assign`, {
      method: "POST",
      body: JSON.stringify({ technicianId }),
    });
    setMsg(res.ok ? "Technician assigned" : res.data?.error ?? "Assignment failed");
    load();
  }

  return (
    <div className="space-y-8">
      {msg && <p className="rounded bg-blue-50 p-2 text-sm">{msg}</p>}

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Service request queue</h2>
        {queue.length === 0 && <p className="text-sm text-gray-500">No requests awaiting check-in.</p>}
        <ul className="space-y-2">
          {queue.map((q) => (
            <li key={q.id} className="flex items-center justify-between rounded border p-3 text-sm">
              <div>
                <b>{q.vehicle.year} {q.vehicle.make} {q.vehicle.model}</b> · {q.customer.name}
                <div className="text-gray-600">{q.description}</div>
              </div>
              <button onClick={() => checkIn(q.id)} className="rounded bg-black px-3 py-1 text-white">
                Check in
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Work orders</h2>
        {orders.length === 0 && <p className="text-sm text-gray-500">No work orders yet.</p>}
        <ul className="space-y-2">
          {orders.map((o) => (
            <li key={o.id} className="flex items-center justify-between rounded border p-3 text-sm">
              <div>
                <b>{o.serviceRequest.vehicle.year} {o.serviceRequest.vehicle.make} {o.serviceRequest.vehicle.model}</b>
                <span className="ml-2 rounded bg-green-100 px-2 py-0.5">{pretty(o.status)}</span>
                <div className="text-gray-600">{o.serviceRequest.description}</div>
              </div>
              <select
                className="rounded border p-1"
                value={o.technicianId ?? ""}
                onChange={(e) => assign(o.id, e.target.value)}
              >
                <option value="">Assign technician</option>
                {techs.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}