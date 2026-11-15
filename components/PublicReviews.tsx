"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Avatar, Stars } from "./people";
import { Empty } from "./ui";

type Data = {
  reviews: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    customerName: string;
    technician: { name: string; avatarUrl: string | null };
  }[];
  technicians: { id: string; name: string; avatarUrl: string | null; avgRating: number | null; reviewCount: number }[];
};

export default function PublicReviews() {
  const [data, setData] = useState<Data | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api<Data>("/api/reviews").then((res) => (res.ok ? setData(res.data) : setFailed(true)));
  }, []);

  if (failed) return null;
  if (!data) return <p className="text-center text-sm text-slate-500">Loading reviews...</p>;

  return (
    <div className="space-y-10">
      <div>
        <h2 className="mb-4 text-xl font-semibold text-slate-900">Our technicians</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.technicians.map((t) => (
            <div key={t.id} className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
              <Avatar name={t.name} src={t.avatarUrl} size={64} />
              <div className="mt-2 font-medium text-slate-900">{t.name}</div>
              {t.reviewCount > 0 && t.avgRating !== null ? (
                <div className="mt-1 flex items-center gap-1 text-sm text-slate-600">
                  <Stars value={t.avgRating} />
                  <span>
                    {t.avgRating.toFixed(1)} ({t.reviewCount})
                  </span>
                </div>
              ) : (
                <div className="mt-1 text-sm text-slate-400">No reviews yet</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-xl font-semibold text-slate-900">What customers say</h2>
        {data.reviews.length === 0 ? (
          <Empty>No reviews yet. Customers can rate their technician after a completed repair.</Empty>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {data.reviews.map((r) => (
              <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <Stars value={r.rating} />
                <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-700">
                  {r.comment || "No written comment."}
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                  <Avatar name={r.technician.name} src={r.technician.avatarUrl} size={24} />
                  <span>
                    {r.customerName} on {r.technician.name} · {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}