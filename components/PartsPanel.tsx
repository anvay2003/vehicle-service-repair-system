"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { money } from "@/lib/format";
import { Button, Field, field } from "./ui";

type Catalog = { id: string; name: string; unitPriceCents: number; stock: number };
export type UsedPart = { id: string; quantity: number; unitPriceCents: number; part: { name: string } };

export default function PartsPanel({
  orderId,
  used,
  editable,
  onDone,
}: {
  orderId: string;
  used: UsedPart[];
  editable: boolean;
  onDone: (msg: string) => void;
}) {
  const [catalog, setCatalog] = useState<Catalog[]>([]);
  const [partId, setPartId] = useState("");
  const [qty, setQty] = useState("1");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!editable) return;
    api<Catalog[]>("/api/parts").then((res) => res.ok && setCatalog(res.data));
  }, [editable, used.length]);

  async function add() {
    const quantity = Number(qty);
    if (!partId || !Number.isInteger(quantity) || quantity < 1) {
      onDone("Choose a part and a whole-number quantity");
      return;
    }
    setBusy(true);
    const res = await api<{ error?: string }>(`/api/work-orders/${orderId}/parts`, {
      method: "POST",
      body: JSON.stringify({ partId, quantity }),
    });
    setBusy(false);
    if (res.ok) {
      setPartId("");
      setQty("1");
    }
    onDone(res.ok ? "Part recorded" : res.data?.error ?? "Could not record part");
  }

  const total = used.reduce((s, u) => s + u.quantity * u.unitPriceCents, 0);

  return (
    <div className="mt-3 space-y-3 rounded-lg bg-slate-50 p-3 text-sm ring-1 ring-inset ring-slate-200">
      <div className="font-medium text-slate-700">Parts used</div>
      {used.length === 0 ? (
        <p className="text-slate-500">No parts recorded yet.</p>
      ) : (
        <ul className="divide-y divide-slate-200">
          {used.map((u) => (
            <li key={u.id} className="flex justify-between gap-4 py-1.5">
              <span>{u.part.name} × {u.quantity}</span>
              <span className="shrink-0 font-medium">{money(u.quantity * u.unitPriceCents)}</span>
            </li>
          ))}
          <li className="flex justify-between py-1.5 font-semibold">
            <span>Parts total</span>
            <span>{money(total)}</span>
          </li>
        </ul>
      )}
      {editable && (
        <div className="flex flex-wrap items-end gap-2">
          <Field label="Part" className="min-w-56 flex-1">
            <select className={field} value={partId} onChange={(e) => setPartId(e.target.value)}>
              <option value="">Select a part</option>
              {catalog.map((c) => (
                <option key={c.id} value={c.id} disabled={c.stock === 0}>
                  {c.name} · {money(c.unitPriceCents)} · {c.stock} in stock
                </option>
              ))}
            </select>
          </Field>
          <Field label="Qty" className="w-24">
            <input className={field} type="number" min="1" max="99" value={qty} onChange={(e) => setQty(e.target.value)} />
          </Field>
          <Button type="button" disabled={busy} onClick={add}>
            {busy ? "Adding..." : "Add part"}
          </Button>
        </div>
      )}
    </div>
  );
}