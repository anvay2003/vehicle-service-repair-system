"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { money, vehicleLabel } from "@/lib/format";
import InvoiceCard, { type InvoiceData } from "./InvoiceCard";
import { Avatar } from "./people";
import { Empty, Field, SectionTitle, Stat, field } from "./ui";

type Vehicle = { id: string; make: string; model: string; year: number };
type Order = {
  id: string;
  status: string;
  diagnosis: string | null;
  createdAt: string;
  serviceRequest: { description: string; vehicle: Vehicle };
  technician: { name: string; avatarUrl: string | null } | null;
  estimate: { items: { id: string; description: string; amountCents: number }[] } | null;
  parts: { id: string; quantity: number; unitPriceCents: number; part: { name: string } }[];
  invoice: InvoiceData | null;
};

const estimated = (o: Order) =>
  (o.estimate?.items.reduce((s, i) => s + i.amountCents, 0) ?? 0) +
  o.parts.reduce((s, p) => s + p.quantity * p.unitPriceCents, 0);

export default function HistoryPanel() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [vehicleId, setVehicleId] = useState("");

  useEffect(() => {
    Promise.all([api<Vehicle[]>("/api/vehicles"), api<Order[]>("/api/work-orders")]).then(([a, b]) => {
      if (a.ok) setVehicles(a.data);
      if (b.ok) setOrders(b.data);
    });
  }, []);

  const history = orders.filter(
    (o) => o.status === "COMPLETED" && (!vehicleId || o.serviceRequest.vehicle.id === vehicleId)
  );
  const billed = history.reduce((s, o) => s + (o.invoice?.totalCents ?? 0), 0);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <Stat label="Completed repairs" value={history.length} />
        <Stat label="Total billed" value={money(billed)} />
      </div>

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <SectionTitle title="Service history" hint="Past repairs and what they cost. Open a repair for details." />
          <Field label="Vehicle" className="w-full sm:w-64">
            <select className={field} value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
              <option value="">All vehicles</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{vehicleLabel(v)}</option>
              ))}
            </select>
          </Field>
        </div>

        {history.length === 0 ? (
          <Empty>No completed repairs yet.</Empty>
        ) : (
          <div className="space-y-3">
            {history.map((o) => (
              <details key={o.id} className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 p-4">
                  <div>
                    <div className="font-medium text-slate-900">{vehicleLabel(o.serviceRequest.vehicle)}</div>
                    <div className="text-sm text-slate-500">
                      {new Date(o.createdAt).toLocaleDateString()} · {o.serviceRequest.description}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-semibold text-slate-900">
                      {money(o.invoice ? o.invoice.totalCents : estimated(o))}
                    </div>
                    <div className="text-xs text-slate-500">{o.invoice ? "Invoiced" : "Estimated, invoice pending"}</div>
                  </div>
                </summary>
                <div className="space-y-2 border-t border-slate-100 p-4 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-700">Technician:</span>
                    {o.technician ? (
                      <>
                        <Avatar name={o.technician.name} src={o.technician.avatarUrl} size={24} />
                        <span>{o.technician.name}</span>
                      </>
                    ) : (
                      "Unassigned"
                    )}
                  </div>
                  {o.diagnosis && (
                    <div className="whitespace-pre-wrap">
                      <span className="font-medium text-slate-700">Diagnosis: </span>
                      {o.diagnosis}
                    </div>
                  )}
                  {o.invoice ? (
                    <InvoiceCard invoice={o.invoice} />
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {o.estimate?.items.map((i) => (
                        <li key={i.id} className="flex justify-between gap-4 py-1.5">
                          <span className="whitespace-pre-wrap break-words">{i.description}</span>
                          <span className="shrink-0 font-medium">{money(i.amountCents)}</span>
                        </li>
                      ))}
                      {o.parts.map((p) => (
                        <li key={p.id} className="flex justify-between gap-4 py-1.5">
                          <span>{p.part.name} × {p.quantity}</span>
                          <span className="shrink-0 font-medium">{money(p.quantity * p.unitPriceCents)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </details>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}