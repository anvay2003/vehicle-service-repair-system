"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { money } from "@/lib/format";
import { DIAGNOSES, buildDiagnosis } from "@/lib/issues";
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
  const [findings, setFindings] = useState<string[]>([]);
  const [notes, setNotes] = useState(initialDiagnosis);
  const [rows, setRows] = useState([{ description: "", amount: "" }]);
  const [busy, setBusy] = useState(false);

  const total = rows.reduce((s, r) => {
    const n = parseFloat(r.amount);
    return s + (Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0);
  }, 0);

  function toggle(f: string) {
    setFindings((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
  }

  function update(i: number, patch: Partial<{ description: string; amount: string }>) {
    setRows(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  async function submit() {
    const diagnosis = buildDiagnosis(findings, notes);
    if (!diagnosis) {
      onDone("Select at least one finding or add notes");
      return;
    }
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
      body: JSON.stringify({ diagnosis, items }),
    });
    setBusy(false);
    onDone(res.ok ? "Estimate sent to customer for approval" : res.data?.error ?? "Could not submit estimate");
  }

  return (
    <div className="mt-3 space-y-4 rounded-lg bg-slate-50 p-4 ring-1 ring-inset ring-slate-200">
      <div className="space-y-2">
        <span className="text-sm font-medium text-slate-700">Diagnosis: what did you find?</span>
        <div className="grid gap-2 sm:grid-cols-2">
          {DIAGNOSES.map((f) => {
            const on = findings.includes(f);
            return (
              <button
                key={f}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(f)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${
                  on
                    ? "border-indigo-500 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-500"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] ${
                    on ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-400"
                  }`}
                >
                  {on ? "✓" : ""}
                </span>
                {f}
              </button>
            );
          })}
        </div>
      </div>

      <Field label="Additional diagnosis notes (optional if you selected findings)">
        <textarea className={field} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
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
              <input className={field} type="number" min="0" step="0.01" value={r.amount} onChange={(e) => update(i, { amount: e.target.value })} />
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