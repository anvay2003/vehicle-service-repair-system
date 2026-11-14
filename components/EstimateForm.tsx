"use client";
import { useState } from "react";
import { api } from "@/lib/api";

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
    const res = await api<{ error?: string }>(`/api/work-orders/${orderId}/estimate`, {
      method: "POST",
      body: JSON.stringify({ ...(diagnosis.trim() ? { diagnosis: diagnosis.trim() } : {}), items }),
    });
    onDone(res.ok ? "Estimate sent to customer for approval" : res.data?.error ?? "Could not submit estimate");
  }

  return (
    <div className="space-y-2">
      <textarea
        className="w-full rounded border p-2"
        placeholder="Diagnosis and repair notes"
        value={diagnosis}
        onChange={(e) => setDiagnosis(e.target.value)}
      />
      {rows.map((r, i) => (
        <div key={i} className="flex gap-2">
          <input
            className="flex-1 rounded border p-2"
            placeholder="Line item (e.g. Front brake pads)"
            value={r.description}
            onChange={(e) => update(i, { description: e.target.value })}
          />
          <input
            className="w-28 rounded border p-2"
            placeholder="Amount $"
            type="number"
            min="0"
            step="0.01"
            value={r.amount}
            onChange={(e) => update(i, { amount: e.target.value })}
          />
        </div>
      ))}
      <div className="flex gap-2">
        <button type="button" className="rounded border px-3 py-1" onClick={() => setRows([...rows, { description: "", amount: "" }])}>
          Add line
        </button>
        <button type="button" className="rounded bg-black px-3 py-1 text-white" onClick={submit}>
          Send estimate for approval
        </button>
      </div>
    </div>
  );
}