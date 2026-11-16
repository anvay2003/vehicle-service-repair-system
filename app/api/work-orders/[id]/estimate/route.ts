import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guard";
import { notify } from "@/lib/notify";
import { vehicleLabel } from "@/lib/format";

const schema = z.object({
  diagnosis: z.string().min(1).optional(),
  items: z
    .array(
      z.object({
        description: z.string().min(1),
        amountCents: z.number().int().positive(),
      })
    )
    .min(1),
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
  const { diagnosis, items } = parsed.data;

  const order = await prisma.workOrder.findUnique({
    where: { id },
    include: { serviceRequest: { include: { vehicle: true } } },
  });
  if (!order || order.technicianId !== session.user.id) {
    return NextResponse.json({ error: "Work order not found" }, { status: 404 });
  }
  if (order.status !== "DIAGNOSIS") {
    return NextResponse.json(
      { error: `Cannot submit an estimate while status is ${order.status}` },
      { status: 409 }
    );
  }
  if (!diagnosis && !order.diagnosis) {
    return NextResponse.json({ error: "Diagnosis required" }, { status: 400 });
  }

  const car = vehicleLabel(order.serviceRequest.vehicle);
  const updated = await prisma.$transaction(async (tx) => {
    await tx.estimate.create({ data: { workOrderId: id, items: { create: items } } });
    const wo = await tx.workOrder.update({
      where: { id },
      data: { status: "AWAITING_APPROVAL", ...(diagnosis ? { diagnosis } : {}) },
      include: { estimate: { include: { items: true } } },
    });
    await notify(
      tx,
      order.serviceRequest.customerId,
      `The estimate for your ${car} is ready. Please review it and approve or reject.`,
      id
    );
    return wo;
  });
  return NextResponse.json(updated, { status: 201 });
}