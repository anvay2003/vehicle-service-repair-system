import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guard";
import type { Prisma } from "@prisma/client";

const schema = z.object({
  vehicleId: z.string().min(1),
  description: z.string().min(5),
});

export async function POST(req: Request) {
  const { session, error } = await requireRole("CUSTOMER");
  if (error) return error;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const vehicle = await prisma.vehicle.findUnique({ where: { id: parsed.data.vehicleId } });
  if (!vehicle || vehicle.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
  }

  const request = await prisma.serviceRequest.create({
    data: {
      description: parsed.data.description,
      vehicleId: vehicle.id,
      customerId: session.user.id,
      status: "REQUESTED",
    },
  });
  return NextResponse.json(request, { status: 201 });
}

export async function GET(req: Request) {
  const { session, error } = await requireRole("CUSTOMER", "STAFF", "ADMIN");
  if (error) return error;

  const status = new URL(req.url).searchParams.get("status");
    const where: Prisma.ServiceRequestWhereInput = {};
  if (session.user.role === "CUSTOMER") where.customerId = session.user.id;
  if (status === "REQUESTED" || status === "CHECKED_IN" || status === "CANCELLED") {
    where.status = status;
  }
  const requests = await prisma.serviceRequest.findMany({
    where,
    include: { vehicle: true, customer: { select: { name: true, email: true } }, workOrder: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(requests);
}