import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guard";

const schema = z.object({ technicianId: z.string().min(1) });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireRole("STAFF", "ADMIN");
  if (error) return error;
  const { id } = await params;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const tech = await prisma.user.findUnique({ where: { id: parsed.data.technicianId } });
  if (!tech || tech.role !== "TECHNICIAN") {
    return NextResponse.json({ error: "Technician not found" }, { status: 404 });
  }

  const order = await prisma.workOrder.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "Work order not found" }, { status: 404 });
  }
  if (order.status === "COMPLETED" || order.status === "REJECTED") {
    return NextResponse.json({ error: "Work order is closed" }, { status: 409 });
  }

  const updated = await prisma.workOrder.update({
    where: { id },
    data: { technicianId: tech.id },
    include: { technician: { select: { id: true, name: true } } },
  });
  return NextResponse.json(updated);
}