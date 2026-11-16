import { requirePage } from "@/lib/page-auth";
import CustomerView from "@/components/CustomerView";
import StaffView from "@/components/StaffView";
import TechView from "@/components/TechView";

const SUBTITLE = {
  CUSTOMER: "Register vehicles, request service and approve repair estimates.",
  STAFF: "Check in vehicles and assign technicians.",
  ADMIN: "Check in vehicles and assign technicians.",
  TECHNICIAN: "Diagnose vehicles, send estimates and track repairs.",
} as const;

export default async function Overview() {
  const { user } = await requirePage();
  const firstName = (user.name ?? "").split(" ")[0];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Welcome back, {firstName}</h1>
        <p className="text-sm text-slate-500">{SUBTITLE[user.role]}</p>
      </div>
      {user.role === "CUSTOMER" && <CustomerView section="overview" />}
      {(user.role === "STAFF" || user.role === "ADMIN") && <StaffView section="overview" />}
      {user.role === "TECHNICIAN" && <TechView section="overview" />}
    </div>
  );
}