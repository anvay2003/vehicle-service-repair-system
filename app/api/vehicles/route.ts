import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guard";

const schema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1950).max(new Date().getFullYear() + 1),
  vin: z.string().length(17),
  mileage: z.number().int().min(0),
});

export async function POST(req: Request) {
  const { session, error } = await requireRole("CUSTOMER");
  if (error) return error;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  if (await prisma.vehicle.findUnique({ where: { vin: parsed.data.vin } })) {
    return NextResponse.json({ error: "VIN already registered" }, { status: 409 });
  }
  const vehicle = await prisma.vehicle.create({
    data: { ...parsed.data, ownerId: session.user.id },
  });
  return NextResponse.json(vehicle, { status: 201 });
}

export async function GET() {
  const { session, error } = await requireRole("CUSTOMER", "STAFF", "ADMIN");
  if (error) return error;

  const where = session.user.role === "CUSTOMER" ? { ownerId: session.user.id } : {};
  const vehicles = await prisma.vehicle.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(vehicles);
}