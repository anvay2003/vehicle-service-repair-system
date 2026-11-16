import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guard";

export async function POST() {
  const { session, error } = await requireRole("CUSTOMER", "STAFF", "TECHNICIAN", "ADMIN");
  if (error) return error;
  const res = await prisma.notification.updateMany({
    where: { userId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  });
  return NextResponse.json({ marked: res.count });
}