import { requirePage } from "@/lib/page-auth";
import HistoryPanel from "@/components/HistoryPanel";

export default async function Page() {
  await requirePage("CUSTOMER");
  return <HistoryPanel />;
}
