import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Welcome, {session.user.name}</h1>
      <p>Role: {session.user.role}</p>
    </main>
  );
}