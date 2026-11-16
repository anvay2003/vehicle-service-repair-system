import { requirePage } from "@/lib/page-auth";
import InvoicesPanel from "@/components/InvoicesPanel";

export default async function Page() {
  await requirePage("STAFF", "ADMIN");
  return <InvoicesPanel />;
}
