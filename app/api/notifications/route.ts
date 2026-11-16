import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guard";

export async function GET() {
  const { session, error } = await requireRole("CUSTOMER", "STAFF", "TECHNICIAN", "ADMIN");
  if (error) return error;
  const userId = session.user.id;
  const [items, unread] = await Promise.all([
    prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);
  return NextResponse.json({ unread, items });
}