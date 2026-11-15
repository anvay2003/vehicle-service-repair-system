"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { money } from "@/lib/format";
import { Button, Field, field } from "./ui";

export default function EstimateForm({
  orderId,
  initialDiagnosis,
  onDone,
}: {
  orderId: string;
  initialDiagnosis: string;
  onDone: (msg: string) => void;
}) {
  const [diagnosis, setDiagnosis] = useState(initialDiagnosis);
  const [rows, setRows] = useState([{ description: "", amount: "" }]);
  const [busy, setBusy] = useState(false);

  const total = rows.reduce((s, r) => {
    const n = parseFloat(r.amount);
    return s + (Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0);
  }, 0);

  function update(i: number, patch: Partial<{ description: string; amount: string }>) {
    setRows(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  async function submit() {
    const items = rows.map((r) => ({
      description: r.description.trim(),
      amountCents: Math.round(parseFloat(r.amount) * 100),
    }));
    if (items.some((x) => !x.description || !Number.isFinite(x.amountCents) || x.amountCents <= 0)) {
      onDone("Each estimate line needs a description and a positive amount");
      return;
    }
    setBusy(true);
    const res = await api<{ error?: string }>(`/api/work-orders/${orderId}/estimate`, {
      method: "POST",
      body: JSON.stringify({ ...(diagnosis.trim() ? { diagnosis: diagnosis.trim() } : {}), items }),
    });
    setBusy(false);
    onDone(res.ok ? "Estimate sent to customer for approval" : res.data?.error ?? "Could not submit estimate");
  }

  return (
    <div className="mt-3 space-y-4 rounded-lg bg-slate-50 p-4 ring-1 ring-inset ring-slate-200">
      <Field label="Diagnosis and repair notes">
        <textarea className={field} rows={4} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
      </Field>

      <div className="space-y-3">
        <div>
          <div className="text-sm font-medium text-slate-700">Estimate line items</div>
          <p className="text-xs text-slate-500">The customer sees each description next to its amount, so explain what the charge covers.</p>
        </div>
        {rows.map((r, i) => (
          <div key={i} className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Line {i + 1}</span>
              {rows.length > 1 && (
                <button type="button" className="text-xs text-red-600 hover:underline" onClick={() => setRows(rows.filter((_, idx) => idx !== i))}>
                  Remove
                </button>
              )}
            </div>
            <Field label="What is this charge for?">
              <textarea
                className={field}
                rows={3}
                placeholder="e.g. Front brake pads and labor: pads are worn to 2 mm and must be replaced"
                value={r.description}
                onChange={(e) => update(i, { description: e.target.value })}
              />
            </Field>
            <Field label="Amount ($)" className="sm:w-48">
              <input
                className={field}
                type="number"
                min="0"
                step="0.01"
                value={r.amount}
                onChange={(e) => update(i, { amount: e.target.value })}
              />
            </Field>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button type="button" variant="secondary" onClick={() => setRows([...rows, { description: "", amount: "" }])}>
          Add line
        </Button>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-900">Total {money(total)}</span>
          <Button type="button" disabled={busy} onClick={submit}>
            {busy ? "Sending..." : "Send estimate for approval"}
          </Button>
        </div>
      </div>
    </div>
  );
}