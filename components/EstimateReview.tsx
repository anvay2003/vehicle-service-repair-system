"use client";
import { api } from "@/lib/api";
import { money } from "@/lib/format";

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
  const total = items.reduce((s, i) => s + i.amountCents, 0);

  async function decide(decision: "APPROVE" | "REJECT") {
    const res = await api<{ error?: string }>(`/api/work-orders/${orderId}/estimate/decision`, {
      method: "POST",
      body: JSON.stringify({ decision }),
    });
    onDone(
      res.ok
        ? decision === "APPROVE" ? "Estimate approved" : "Estimate rejected"
        : res.data?.error ?? "Could not record decision"
    );
  }

  return (
    <div className="mt-2 space-y-2 rounded border bg-yellow-50 p-3">
      <b>Cost estimate</b>
      <ul>
        {items.map((i) => (
          <li key={i.id} className="flex justify-between">
            <span>{i.description}</span>
            <span>{money(i.amountCents)}</span>
          </li>
        ))}
      </ul>
      <div className="flex justify-between border-t pt-1 font-semibold">
        <span>Total</span>
        <span>{money(total)}</span>
      </div>
      <div className="flex gap-2">
        <button className="rounded bg-black px-3 py-1 text-white" onClick={() => decide("APPROVE")}>Approve</button>
        <button className="rounded border px-3 py-1" onClick={() => decide("REJECT")}>Reject</button>
      </div>
    </div>
  );
}