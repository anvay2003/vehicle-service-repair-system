import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guard";

const schema = z.object({
  partId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireRole("TECHNICIAN");
  if (error) return error;
  const { id } = await params;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { partId, quantity } = parsed.data;

  const order = await prisma.workOrder.findUnique({ where: { id } });
  if (!order || order.technicianId !== session.user.id) {
    return NextResponse.json({ error: "Work order not found" }, { status: 404 });
  }
  if (order.status !== "IN_REPAIR") {
    return NextResponse.json(
      { error: "Parts can be recorded only while the order is In Repair" },
      { status: 409 }
    );
  }
  if (!(await prisma.part.findUnique({ where: { id: partId } }))) {
    return NextResponse.json({ error: "Part not found" }, { status: 404 });
  }

  const usage = await prisma.$transaction(async (tx) => {
    const dec = await tx.part.updateMany({
      where: { id: partId, stock: { gte: quantity } },
      data: { stock: { decrement: quantity } },
    });
    if (dec.count === 0) return null;
    const part = await tx.part.findUniqueOrThrow({ where: { id: partId } });
    return tx.workOrderPart.create({
      data: { workOrderId: id, partId, quantity, unitPriceCents: part.unitPriceCents },
      include: { part: true },
    });
  });
  if (!usage) {
    return NextResponse.json({ error: "Not enough stock" }, { status: 409 });
  }
  return NextResponse.json(usage, { status: 201 });
}