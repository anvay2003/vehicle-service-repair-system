"use client";
import { useState } from "react";

export function Avatar({ name, src, size = 40 }: { name: string; src?: string | null; size?: number }) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const box = { width: size, height: size };
  if (!src || failed) {
    return (
      <div style={box} className="flex shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
        {initials}
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={name} style={box} onError={() => setFailed(true)} className="shrink-0 rounded-full bg-indigo-50 object-cover" />;
}

export function Stars({ value, size = "text-base" }: { value: number; size?: string }) {
  const n = Math.round(value);
  return (
    <span className={`${size} leading-none text-amber-500`} aria-label={`${value} out of 5`}>
      {"★".repeat(n)}
      <span className="text-slate-300">{"★".repeat(5 - n)}</span>
    </span>
  );
}

export function StarInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onClick={() => onChange(n)}
          className={`text-3xl leading-none transition ${n <= value ? "text-amber-500" : "text-slate-300 hover:text-amber-300"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}