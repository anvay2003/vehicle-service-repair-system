"use client";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { pretty } from "@/lib/format";

const TONE: Record<string, string> = {
  REQUESTED: "bg-amber-50 text-amber-700 ring-amber-200",
  CHECKED_IN: "bg-sky-50 text-sky-700 ring-sky-200",
  DIAGNOSIS: "bg-violet-50 text-violet-700 ring-violet-200",
  AWAITING_APPROVAL: "bg-amber-50 text-amber-700 ring-amber-200",
  APPROVED: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  IN_REPAIR: "bg-blue-50 text-blue-700 ring-blue-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  REJECTED: "bg-red-50 text-red-700 ring-red-200",
  CANCELLED: "bg-slate-100 text-slate-600 ring-slate-200",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
        TONE[status] ?? "bg-slate-100 text-slate-600 ring-slate-200"
      }`}
    >
      {pretty(status)}
    </span>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function SectionTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {hint && <p className="text-sm text-slate-500">{hint}</p>}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
      {children}
    </div>
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
};
export function Button({ variant = "primary", className = "", ...props }: BtnProps) {
  const styles = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700",
    secondary: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
    danger: "border border-red-300 bg-white text-red-700 hover:bg-red-50",
  }[variant];
  return (
    <button
      {...props}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${styles} ${className}`}
    />
  );
}

export const field =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200";

export function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block space-y-1 ${className}`}>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

export function Stat({ label, value, accent = false }: { label: string; value: number | string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 shadow-sm ${accent ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white"}`}>
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}

export function Notice({ message, onClose }: { message: string; onClose: () => void }) {
  if (!message) return null;
  return (
    <div className="flex items-center justify-between rounded-lg bg-indigo-50 px-4 py-2 text-sm text-indigo-800 ring-1 ring-indigo-200">
      <span>{message}</span>
      <button onClick={onClose} aria-label="Dismiss" className="ml-4 text-indigo-500 hover:text-indigo-800">
        ✕
      </button>
    </div>
  );
}

const STEPS = ["CHECKED_IN", "DIAGNOSIS", "AWAITING_APPROVAL", "APPROVED", "IN_REPAIR", "COMPLETED"];

export function Timeline({ status }: { status: string }) {
  const rejected = status === "REJECTED";
  const current = rejected ? STEPS.indexOf("AWAITING_APPROVAL") : STEPS.indexOf(status);
  return (
    <ol className="flex items-center gap-1 overflow-x-auto py-2">
      {STEPS.map((s, i) => {
        const done = i < current || (!rejected && i === current && status === "COMPLETED");
        const active = i === current && !rejected;
        return (
          <li key={s} className="flex items-center gap-1">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                done
                  ? "bg-indigo-600 text-white"
                  : active
                  ? "bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {done ? "✓" : i + 1}
            </span>
            <span className={`whitespace-nowrap text-xs ${active ? "font-medium text-slate-900" : "text-slate-500"}`}>
              {pretty(s)}
            </span>
            {i < STEPS.length - 1 && <span className="mx-1 h-px w-4 bg-slate-300" />}
          </li>
        );
      })}
      {rejected && <li className="ml-2 text-xs font-medium text-red-600">Rejected</li>}
    </ol>
  );
}