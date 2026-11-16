import { requirePage } from "@/lib/page-auth";
import StaffView from "@/components/StaffView";

export default async function Page() {
  await requirePage("STAFF", "ADMIN");
  return <StaffView section="queue" />;
}
