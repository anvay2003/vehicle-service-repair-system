"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { money, vehicleLabel } from "@/lib/format";
import { ISSUES, OTHER, buildDescription } from "@/lib/issues";
import EstimateReview from "./EstimateReview";
import ReviewForm from "./ReviewForm";
import { Avatar, Stars } from "./people";
import { Button, Card, Empty, Field, Notice, SectionTitle, Stat, StatusBadge, Timeline, field } from "./ui";

type Vehicle = { id: string; make: string; model: string; year: number; vin: string; mileage: number };
type Req = { id: string; description: string; status: string; vehicle: Vehicle };
type EstimateItem = { id: string; description: string; amountCents: number };
type Order = {
  id: string;
  status: string;
  diagnosis: string | null;
  technician: { name: string; avatarUrl: string | null } | null;
  serviceRequest: { description: string; vehicle: Vehicle };
  estimate: { status: string; items: EstimateItem[] } | null;
  review: { rating: number; comment: string | null } | null;
};

const CLOSED = ["COMPLETED", "REJECTED"];
const sum = (items: EstimateItem[]) => items.reduce((s, i) => s + i.amountCents, 0);

export default function CustomerView() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [requests, setRequests] = useState<Req[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [msg, setMsg] = useState("");
  const [v, setV] = useState({ make: "", model: "", year: "", vin: "", mileage: "" });
  const [r, setR] = useState({ vehicleId: "", issues: [] as string[], notes: "" });

  const load = useCallback(async () => {
    const [a, b, c] = await Promise.all([
      api<Vehicle[]>("/api/vehicles"),
      api<Req[]>("/api/service-requests"),
      api<Order[]>("/api/work-orders"),
    ]);
    if (a.ok) setVehicles(a.data);
    if (b.ok) setRequests(b.data);
    if (c.ok) setOrders(c.data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addVehicle(e: React.FormEvent) {
    e.preventDefault();
    const res = await api<{ error?: string }>("/api/vehicles", {
      method: "POST",
      body: JSON.stringify({
        make: v.make,
        model: v.model,
        year: Number(v.year),
        vin: v.vin,
        mileage: Number(v.mileage),
      }),
    });
    setMsg(res.ok ? "Vehicle registered" : res.data?.error ?? "Could not register vehicle");
    if (res.ok) {
      setV({ make: "", model: "", year: "", vin: "", mileage: "" });
      load();
    }
  }

  function toggleIssue(issue: string) {
    setR((prev) => ({
      ...prev,
      issues: prev.issues.includes(issue) ? prev.issues.filter((x) => x !== issue) : [...prev.issues, issue],
    }));
  }

  async function addRequest(e: React.FormEvent) {
    e.preventDefault();
    if (r.issues.length === 0) {
      setMsg("Select at least one issue");
      return;
    }
    if (r.issues.includes(OTHER) && !r.notes.trim()) {
      setMsg('Please describe the problem when you choose "Other"');
      return;
    }
    const res = await api<{ error?: string }>("/api/service-requests", {
      method: "POST",
      body: JSON.stringify({ vehicleId: r.vehicleId, description: buildDescription(r.issues, r.notes) }),
    });
    setMsg(res.ok ? "Service request submitted" : res.data?.error ?? "Could not submit request");
    if (res.ok) {
      setR({ vehicleId: "", issues: [], notes: "" });
      load();
    }
  }

  const awaiting = orders.filter((o) => o.status === "AWAITING_APPROVAL" && o.estimate);
  const activeCount = orders.filter((o) => !CLOSED.includes(o.status)).length;
  const otherPicked = r.issues.includes(OTHER);

  return (
    <div className="space-y-10">
      <Notice message={msg} onClose={() => setMsg("")} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="My vehicles" value={vehicles.length} />
        <Stat label="Active repairs" value={activeCount} />
        <Stat label="Awaiting your approval" value={awaiting.length} accent={awaiting.length > 0} />
      </div>

      {awaiting.length > 0 && (
        <section>
          <SectionTitle title="Needs your decision" hint="Review each estimate. Repair work starts only after you approve." />
          <div className="space-y-4">
            {awaiting.map((o) => (
              <Card key={o.id}>
                <div className="font-medium text-slate-900">{vehicleLabel(o.serviceRequest.vehicle)}</div>
                <p className="text-sm text-slate-500">{o.serviceRequest.description}</p>
                {o.diagnosis && (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                    <span className="font-medium text-slate-700">Diagnosis: </span>
                    {o.diagnosis}
                  </p>
                )}
                <EstimateReview
                  orderId={o.id}
                  items={o.estimate!.items}
                  onDone={(m) => {
                    setMsg(m);
                    load();
                  }}
                />
              </Card>
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionTitle title="Repair progress" hint="Track each vehicle from check-in to completion." />
        {orders.length === 0 ? (
          <Empty>No work orders yet. Once the shop checks in your vehicle, its progress appears here.</Empty>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <Card key={o.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="font-medium text-slate-900">{vehicleLabel(o.serviceRequest.vehicle)}</div>
                    <div className="text-sm text-slate-500">{o.serviceRequest.description}</div>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
                <Timeline status={o.status} />
                <div className="mt-1 space-y-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-700">Technician:</span>
                    {o.technician ? (
                      <>
                        <Avatar name={o.technician.name} src={o.technician.avatarUrl} size={28} />
                        <span>{o.technician.name}</span>
                      </>
                    ) : (
                      <span>Not assigned yet</span>
                    )}
                  </div>
                  {o.diagnosis && (
                    <div className="whitespace-pre-wrap">
                      <span className="font-medium text-slate-700">Diagnosis: </span>
                      {o.diagnosis}
                    </div>
                  )}
                  {o.estimate && o.status !== "AWAITING_APPROVAL" && (
                    <div>
                      <span className="font-medium text-slate-700">Estimate: </span>
                      {money(sum(o.estimate.items))}
                    </div>
                  )}
                  {o.status === "AWAITING_APPROVAL" && (
                    <div className="font-medium text-amber-700">Your estimate is ready. Review it above.</div>
                  )}
                </div>

                {o.status === "COMPLETED" && o.technician && !o.review && (
                  <ReviewForm
                    orderId={o.id}
                    technicianName={o.technician.name}
                    onDone={(m) => {
                      setMsg(m);
                      load();
                    }}
                  />
                )}
                {o.review && (
                  <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm ring-1 ring-inset ring-slate-200">
                    <div className="mb-1 font-medium text-slate-700">Your review</div>
                    <Stars value={o.review.rating} />
                    {o.review.comment && <p className="mt-1 whitespace-pre-wrap text-slate-600">{o.review.comment}</p>}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>

      <div className="space-y-6">
        <Card>
          <SectionTitle title="Request service" hint="Pick everything that applies. Details are optional unless you choose Other." />
          <form onSubmit={addRequest} className="space-y-4">
            <Field label="Vehicle">
              <select className={field} value={r.vehicleId} onChange={(e) => setR({ ...r, vehicleId: e.target.value })} required>
                <option value="">{vehicles.length ? "Select a vehicle" : "Register a vehicle first"}</option>
                {vehicles.map((x) => (
                  <option key={x.id} value={x.id}>{vehicleLabel(x)}</option>
                ))}
              </select>
            </Field>

            <div className="space-y-2">
              <span className="text-sm font-medium text-slate-700">What is the problem?</span>
              <div className="grid gap-2 sm:grid-cols-2">
                {[...ISSUES, OTHER].map((issue) => {
                  const on = r.issues.includes(issue);
                  return (
                    <button
                      key={issue}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleIssue(issue)}
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
                      {issue}
                    </button>
                  );
                })}
              </div>
            </div>

            <Field label={otherPicked ? "Describe the problem (required for Other)" : "Additional details (optional)"}>
              <textarea
                className={field}
                rows={3}
                maxLength={250}
                value={r.notes}
                onChange={(e) => setR({ ...r, notes: e.target.value })}
              />
            </Field>
            <Button className="w-full" disabled={vehicles.length === 0}>Submit request</Button>
          </form>
        </Card>

        <Card>
          <SectionTitle title="Register a vehicle" />
          <form onSubmit={addVehicle} className="grid grid-cols-2 gap-3">
            <Field label="Make">
              <input className={field} value={v.make} onChange={(e) => setV({ ...v, make: e.target.value })} required />
            </Field>
            <Field label="Model">
              <input className={field} value={v.model} onChange={(e) => setV({ ...v, model: e.target.value })} required />
            </Field>
            <Field label="Year">
              <input className={field} type="number" value={v.year} onChange={(e) => setV({ ...v, year: e.target.value })} required />
            </Field>
            <Field label="Mileage">
              <input className={field} type="number" value={v.mileage} onChange={(e) => setV({ ...v, mileage: e.target.value })} required />
            </Field>
            <Field label="VIN (17 characters)" className="col-span-2">
              <input className={field} maxLength={17} value={v.vin} onChange={(e) => setV({ ...v, vin: e.target.value })} required />
            </Field>
            <Button className="col-span-2">Register vehicle</Button>
          </form>
        </Card>
      </div>

      <section>
        <SectionTitle title="My vehicles" />
        {vehicles.length === 0 ? (
          <Empty>No vehicles yet.</Empty>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {vehicles.map((x) => (
              <Card key={x.id} className="!p-4">
                <div className="font-medium text-slate-900">{vehicleLabel(x)}</div>
                <div className="text-sm text-slate-500">VIN {x.vin} · {x.mileage.toLocaleString()} mi</div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionTitle title="My service requests" />
        {requests.length === 0 ? (
          <Empty>No requests yet.</Empty>
        ) : (
          <ul className="space-y-2">
            {requests.map((x) => (
              <li key={x.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm">
                <div>
                  <span className="font-medium text-slate-900">{x.vehicle.make} {x.vehicle.model}</span>
                  <span className="text-slate-500">: {x.description}</span>
                </div>
                <StatusBadge status={x.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}