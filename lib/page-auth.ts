import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { authOptions } from "./auth";

export async function requirePage(...roles: Role[]) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (roles.length > 0 && !roles.includes(session.user.role)) redirect("/dashboard");
  return session;
}