import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import SignOutButton from "@/components/SignOutButton";
import CustomerView from "@/components/CustomerView";
import StaffView from "@/components/StaffView";
import TechView from "@/components/TechView";

const ROLE_LABEL = {
  CUSTOMER: "Customer",
  STAFF: "Service staff",
  TECHNICIAN: "Technician",
  ADMIN: "Administrator",
} as const;

const SUBTITLE = {
  CUSTOMER: "Register vehicles, request service and approve repair estimates.",
  STAFF: "Check in vehicles and assign technicians.",
  ADMIN: "Check in vehicles and assign technicians.",
  TECHNICIAN: "Diagnose vehicles, send estimates and track repairs.",
} as const;

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const { role, name } = session.user;
  const firstName = (name ?? "").split(" ")[0];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              V
            </div>
            <div>
              <div className="text-sm font-semibold leading-tight text-slate-900">VSRMS</div>
              <div className="text-xs text-slate-500">Vehicle Service &amp; Repair Management</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-medium text-slate-900">{name}</div>
              <div className="text-xs text-slate-500">{ROLE_LABEL[role]}</div>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Welcome back, {firstName}</h1>
          <p className="text-sm text-slate-500">{SUBTITLE[role]}</p>
        </div>
        {role === "CUSTOMER" && <CustomerView />}
        {(role === "STAFF" || role === "ADMIN") && <StaffView />}
        {role === "TECHNICIAN" && <TechView />}
      </main>
    </div>
  );
}