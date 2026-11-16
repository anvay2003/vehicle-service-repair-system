import { requirePage } from "@/lib/page-auth";
import CustomerView from "@/components/CustomerView";

export default async function Page() {
  await requirePage("CUSTOMER");
  return <CustomerView section="repairs" />;
}
