"use client";
import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button, Field, field } from "@/components/ui";
import PublicReviews from "@/components/PublicReviews";

const DEMO = [
  { label: "Customer", email: "customer@vsrms.test", password: "password123" },
  { label: "Service staff", email: "staff@vsrms.test", password: "password123" },
  { label: "Technician (Marcus)", email: "marcus@vsrms.test", password: "Marcus-Torque-26" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) setError("Invalid email or password");
    else router.push("/dashboard");
  }

  return (
    <main className="min-h-screen">
      <div className="grid lg:min-h-[75vh] lg:grid-cols-2">
        <section className="hidden flex-col justify-between bg-slate-900 p-12 text-white lg:flex">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500 font-bold">V</div>
            <span className="text-lg font-semibold">VSRMS</span>
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-semibold leading-tight">
              Vehicle service and repair, tracked from check-in to completion.
            </h1>
            <ul className="space-y-2 text-slate-300">
              <li>Register vehicles and request service online</li>
              <li>See every repair step as it happens</li>
              <li>Approve cost estimates before any work begins</li>
              <li>Rate your technician after the repair</li>
            </ul>
          </div>
          <p className="text-sm text-slate-400">CSE 5324 Agile Object-Oriented Software Engineering</p>
        </section>

        <section className="flex items-center justify-center p-6 py-12">
          <div className="w-full max-w-sm space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Sign in</h2>
              <p className="text-sm text-slate-500">Use your VSRMS account to continue.</p>
            </div>
            <form onSubmit={onSubmit} className="space-y-4">
              <Field label="Email">
                <input className={field} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </Field>
              <Field label="Password">
                <input className={field} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </Field>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
            <p className="text-sm text-slate-500">
              New customer?{" "}
              <Link href="/register" className="font-medium text-indigo-600 hover:underline">
                Create an account
              </Link>
            </p>

            <div className="rounded-lg border border-dashed border-slate-300 p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Demo accounts (test data)</p>
              <div className="flex flex-wrap gap-2">
                {DEMO.map((d) => (
                  <button
                    key={d.email}
                    type="button"
                    onClick={() => {
                      setEmail(d.email);
                      setPassword(d.password);
                    }}
                    className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="border-t border-slate-200 bg-slate-100/60">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <PublicReviews />
        </div>
      </section>
    </main>
  );
}