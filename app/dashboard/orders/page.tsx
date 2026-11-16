import { requirePage } from "@/lib/page-auth";
import StaffView from "@/components/StaffView";
import TechView from "@/components/TechView";

export default async function Page() {
  const { user } = await requirePage("STAFF", "ADMIN", "TECHNICIAN");
  return user.role === "TECHNICIAN" ? <TechView section="orders" /> : <StaffView section="orders" />;
}
