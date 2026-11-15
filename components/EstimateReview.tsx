"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { money } from "@/lib/format";
import { Button } from "./ui";

type Item = { id: string; description: string; amountCents: number };

export default function EstimateReview({
  orderId,
  items,
  onDone,
}: {
  orderId: string;
  items: Item[];
  onDone: (msg: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const total = items.reduce((s, i) => s + i.amountCents, 0);

  async function decide(decision: "APPROVE" | "REJECT") {
    if (decision === "REJECT" && !window.confirm("Rejecting closes this work order. Continue?")) return;
    setBusy(true);
    const res = await api<{ error?: string }>(`/api/work-orders/${orderId}/estimate/decision`, {
      method: "POST",
      body: JSON.stringify({ decision }),
    });
    setBusy(false);
    onDone(
      res.ok
        ? decision === "APPROVE" ? "Estimate approved" : "Estimate rejected"
        : res.data?.error ?? "Could not record decision"
    );
  }

  return (
    <div className="mt-3 space-y-3 rounded-lg bg-amber-50 p-4 ring-1 ring-inset ring-amber-200">
      <div className="text-sm font-semibold text-amber-900">Cost estimate</div>
      <ul className="divide-y divide-amber-200 text-sm">
        {items.map((i) => (
          <li key={i.id} className="flex justify-between gap-4 py-2">
            <span className="whitespace-pre-wrap break-words">{i.description}</span>
            <span className="shrink-0 font-medium">{money(i.amountCents)}</span>
          </li>
        ))}
      </ul>
      <div className="flex justify-between border-t border-amber-300 pt-2 text-base font-semibold">
        <span>Total</span>
        <span>{money(total)}</span>
      </div>
      <div className="flex gap-2">
        <Button disabled={busy} onClick={() => decide("APPROVE")}>Approve estimate</Button>
        <Button variant="danger" disabled={busy} onClick={() => decide("REJECT")}>Reject</Button>
      </div>
    </div>
  );
}