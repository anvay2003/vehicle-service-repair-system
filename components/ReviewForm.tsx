"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button, field } from "./ui";
import { StarInput } from "./people";

export default function ReviewForm({
  orderId,
  technicianName,
  onDone,
}: {
  orderId: string;
  technicianName: string;
  onDone: (msg: string) => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (rating < 1) {
      onDone("Choose a star rating first");
      return;
    }
    setBusy(true);
    const res = await api<{ error?: string }>(`/api/work-orders/${orderId}/review`, {
      method: "POST",
      body: JSON.stringify({ rating, ...(comment.trim() ? { comment: comment.trim() } : {}) }),
    });
    setBusy(false);
    onDone(res.ok ? "Thanks for your review" : res.data?.error ?? "Could not save review");
  }

  return (
    <div className="mt-3 space-y-3 rounded-lg bg-slate-50 p-4 ring-1 ring-inset ring-slate-200">
      <div className="text-sm font-semibold text-slate-900">How was your experience with {technicianName}?</div>
      <StarInput value={rating} onChange={setRating} />
      <textarea
        className={field}
        rows={3}
        maxLength={500}
        placeholder="Optional: tell others about the repair"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500">Your first name and last initial are shown publicly with your review.</p>
        <Button type="button" disabled={busy} onClick={submit}>
          {busy ? "Saving..." : "Submit review"}
        </Button>
      </div>
    </div>
  );
}