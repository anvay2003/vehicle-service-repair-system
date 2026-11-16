import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import type { Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import SignOutButton from "@/components/SignOutButton";
import NotificationBell from "@/components/NotificationBell";
import DashboardNav from "@/components/DashboardNav";

const ROLE_LABEL: Record<Role, string> = {
  CUSTOMER: "Customer",
  STAFF: "Service staff",
  TECHNICIAN: "Technician",
  ADMIN: "Administrator",
};

const OVERVIEW = { href: "/dashboard", label: "Overview" };
const NOTES = { href: "/dashboard/notifications", label: "Notifications" };
const STAFF_LINKS = [
  OVERVIEW,
  { href: "/dashboard/queue", label: "Check-in queue" },
  { href: "/dashboard/orders", label: "Work orders" },
  NOTES,
];
const NAV: Record<Role, { href: string; label: string }[]> = {
  CUSTOMER: [
    OVERVIEW,
    { href: "/dashboard/repairs", label: "Repairs" },
    { href: "/dashboard/vehicles", label: "Vehicles" },
    { href: "/dashboard/request", label: "Request service" },
    NOTES,
  ],
  STAFF: STAFF_LINKS,
  ADMIN: STAFF_LINKS,
  TECHNICIAN: [OVERVIEW, { href: "/dashboard/orders", label: "My work orders" }, NOTES],
};

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const { role, name } = session.user;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">V</div>
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
            <NotificationBell />
            <SignOutButton />
          </div>
        </div>
        <DashboardNav links={NAV[role]} />
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}