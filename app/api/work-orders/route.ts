import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guard";

export async function GET() {
  const { session, error } = await requireRole("CUSTOMER", "STAFF", "TECHNICIAN", "ADMIN");
  if (error) return error;

  const { role, id } = session.user;
  const where =
    role === "TECHNICIAN"
      ? { technicianId: id }
      : role === "CUSTOMER"
      ? { serviceRequest: { customerId: id } }
      : {};

  const orders = await prisma.workOrder.findMany({
    where,
    include: {
      serviceRequest: { include: { vehicle: true } },
      technician: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(orders);
}