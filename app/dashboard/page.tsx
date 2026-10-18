import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import SignOutButton from "@/components/SignOutButton";
import CustomerView from "@/components/CustomerView";
import StaffView from "@/components/StaffView";
import TechView from "@/components/TechView";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const { role, name } = session.user;

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="flex items-center justify-between border-b pb-3">
        <div>
          <h1 className="text-2xl font-semibold">VSRMS</h1>
          <p className="text-sm text-gray-600">
            {name} · {role}
          </p>
        </div>
        <SignOutButton />
      </header>
      {role === "CUSTOMER" && <CustomerView />}
      {(role === "STAFF" || role === "ADMIN") && <StaffView />}
      {role === "TECHNICIAN" && <TechView />}
    </main>
  );
}