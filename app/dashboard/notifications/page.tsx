import { requirePage } from "@/lib/page-auth";
import NotificationList from "@/components/NotificationList";

export default async function Page() {
  await requirePage();
  return <NotificationList />;
}
