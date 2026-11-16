"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { money, vehicleLabel } from "@/lib/format";
import InvoiceCard, { type InvoiceData } from "./InvoiceCard";
import { Button, Card, Empty, Notice, SectionTitle, Stat } from "./ui";

type Order = {
  id: string;
  status: string;
  serviceRequest: { description: string; vehicle: { make: string; model: string; year: number } };
  technician: { name: string } | null;
  estimate: { status: string; items: { id: string; description: string; amountCents: number }[] } | null;
  parts: { id: string; quantity: number; unitPriceCents: number; part: { name: string } }[];
  invoice: InvoiceData | null;
};

const previewTotal = (o: Order) =>
  (o.estimate?.items.reduce((s, i) => s + i.amountCents, 0) ?? 0) +
  o.parts.reduce((s, p) => s + p.quantity * p.unitPriceCents, 0);

export default function InvoicesPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const res = await api<Order[]>("/api/work-orders");
    if (res.ok) setOrders(res.data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function generate(id: string) {
    const res = await api<{ error?: string }>(`/api/work-orders/${id}/invoice`, { method: "POST" });
    setMsg(res.ok ? "Invoice generated and customer notified" : res.data?.error ?? "Could not generate invoice");
    load();
  }

  const completed = orders.filter((o) => o.status === "COMPLETED");
  const pending = completed.filter((o) => !o.invoice);
  const invoiced = completed.filter((o) => o.invoice);

  return (
    <div className="space-y-10">
      <Notice message={msg} onClose={() => setMsg("")} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Stat label="Ready to invoice" value={pending.length} accent={pending.length > 0} />
        <Stat label="Invoiced" value={invoiced.length} />
      </div>

      <section>
        <SectionTitle title="Ready to invoice" hint="Completed repairs without an invoice. The invoice combines the approved estimate and the parts used." />
        {pending.length === 0 ? (
          <Empty>Nothing waiting for an invoice.</Empty>
        ) : (
          <div className="space-y-3">
            {pending.map((o) => (
              <Card key={o.id} className="!p-4">
                <div className="text-sm">
                  <div className="font-medium text-slate-900">{vehicleLabel(o.serviceRequest.vehicle)}</div>
                  <div className="text-slate-600">{o.serviceRequest.description}</div>
                  <div className="text-slate-500">Technician: {o.technician?.name ?? "Unassigned"}</div>
                </div>
                <ul className="mt-3 divide-y divide-slate-100 text-sm">
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
                <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-3">
                  <span className="font-semibold">Total {money(previewTotal(o))}</span>
                  <Button onClick={() => generate(o.id)}>Generate invoice</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionTitle title="Issued invoices" />
        {invoiced.length === 0 ? (
          <Empty>No invoices yet.</Empty>
        ) : (
          <div className="space-y-3">
            {invoiced.map((o) => (
              <Card key={o.id} className="!p-4">
                <div className="text-sm font-medium text-slate-900">{vehicleLabel(o.serviceRequest.vehicle)}</div>
                <InvoiceCard invoice={o.invoice!} />
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}