"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { pretty } from "@/lib/format";

type Vehicle = { id: string; make: string; model: string; year: number; vin: string; mileage: number };
type Req = { id: string; description: string; status: string; vehicle: Vehicle };
type Order = {
  id: string;
  status: string;
  diagnosis: string | null;
  technician: { name: string } | null;
  serviceRequest: { description: string; vehicle: Vehicle };
};

const input = "w-full rounded border p-2";

export default function CustomerView() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [requests, setRequests] = useState<Req[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [msg, setMsg] = useState("");
  const [v, setV] = useState({ make: "", model: "", year: "", vin: "", mileage: "" });
  const [r, setR] = useState({ vehicleId: "", description: "" });

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

  async function addRequest(e: React.FormEvent) {
    e.preventDefault();
    const res = await api<{ error?: string }>("/api/service-requests", {
      method: "POST",
      body: JSON.stringify(r),
    });
    setMsg(res.ok ? "Service request submitted" : res.data?.error ?? "Could not submit request");
    if (res.ok) {
      setR({ vehicleId: "", description: "" });
      load();
    }
  }

  return (
    <div className="space-y-8">
      {msg && <p className="rounded bg-blue-50 p-2 text-sm">{msg}</p>}

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Register a vehicle</h2>
        <form onSubmit={addVehicle} className="grid grid-cols-2 gap-3">
          <input className={input} placeholder="Make" value={v.make} onChange={(e) => setV({ ...v, make: e.target.value })} required />
          <input className={input} placeholder="Model" value={v.model} onChange={(e) => setV({ ...v, model: e.target.value })} required />
          <input className={input} placeholder="Year" type="number" value={v.year} onChange={(e) => setV({ ...v, year: e.target.value })} required />
          <input className={input} placeholder="Mileage" type="number" value={v.mileage} onChange={(e) => setV({ ...v, mileage: e.target.value })} required />
          <input className={`${input} col-span-2`} placeholder="VIN (17 characters)" maxLength={17} value={v.vin} onChange={(e) => setV({ ...v, vin: e.target.value })} required />
          <button className="col-span-2 rounded bg-black p-2 text-white">Register vehicle</button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">My vehicles</h2>
        {vehicles.length === 0 && <p className="text-sm text-gray-500">No vehicles yet.</p>}
        <ul className="space-y-2">
          {vehicles.map((x) => (
            <li key={x.id} className="rounded border p-3 text-sm">
              {x.year} {x.make} {x.model} · VIN {x.vin} · {x.mileage.toLocaleString()} mi
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Request service</h2>
        <form onSubmit={addRequest} className="space-y-3">
          <select className={input} value={r.vehicleId} onChange={(e) => setR({ ...r, vehicleId: e.target.value })} required>
            <option value="">Select a vehicle</option>
            {vehicles.map((x) => (
              <option key={x.id} value={x.id}>
                {x.year} {x.make} {x.model}
              </option>
            ))}
          </select>
          <textarea className={input} placeholder="Describe the problem (min 5 characters)" value={r.description} onChange={(e) => setR({ ...r, description: e.target.value })} required />
          <button className="w-full rounded bg-black p-2 text-white">Submit request</button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">My service requests</h2>
        {requests.length === 0 && <p className="text-sm text-gray-500">No requests yet.</p>}
        <ul className="space-y-2">
          {requests.map((x) => (
            <li key={x.id} className="rounded border p-3 text-sm">
              <b>{x.vehicle.make} {x.vehicle.model}</b>: {x.description}
              <span className="ml-2 rounded bg-gray-100 px-2 py-0.5">{pretty(x.status)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Repair progress</h2>
        {orders.length === 0 && <p className="text-sm text-gray-500">No work orders yet.</p>}
        <ul className="space-y-2">
          {orders.map((o) => (
            <li key={o.id} className="rounded border p-3 text-sm">
              <b>{o.serviceRequest.vehicle.make} {o.serviceRequest.vehicle.model}</b>
              <span className="ml-2 rounded bg-green-100 px-2 py-0.5">{pretty(o.status)}</span>
              <div>Technician: {o.technician?.name ?? "Not assigned yet"}</div>
              {o.diagnosis && <div>Diagnosis: {o.diagnosis}</div>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}