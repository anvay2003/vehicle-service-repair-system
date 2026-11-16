import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guard";
import { notify } from "@/lib/notify";
import { invoiceNumber, money, vehicleLabel } from "@/lib/format";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireRole("STAFF", "ADMIN");
  if (error) return error;
  const { id } = await params;

  const order = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      serviceRequest: { include: { vehicle: true } },
      estimate: { include: { items: true } },
      parts: { include: { part: true } },
      invoice: true,
    },
  });
  if (!order) {
    return NextResponse.json({ error: "Work order not found" }, { status: 404 });
  }
  if (order.status !== "COMPLETED") {
    return NextResponse.json(
      { error: "An invoice can be generated only after the repair is completed" },
      { status: 409 }
    );
  }
  if (order.invoice) {
    return NextResponse.json({ error: "An invoice already exists for this work order" }, { status: 409 });
  }
  if (!order.estimate || order.estimate.status !== "APPROVED") {
    return NextResponse.json({ error: "No approved estimate for this work order" }, { status: 409 });
  }

  const lines = [
    ...order.estimate.items.map((i) => ({
      kind: "ESTIMATE" as const,
      description: i.description,
      quantity: 1,
      unitPriceCents: i.amountCents,
    })),
    ...order.parts.map((p) => ({
      kind: "PART" as const,
      description: p.part.name,
      quantity: p.quantity,
      unitPriceCents: p.unitPriceCents,
    })),
  ];
  const totalCents = lines.reduce((s, l) => s + l.quantity * l.unitPriceCents, 0);
  const customerId = order.serviceRequest.customerId;
  const car = vehicleLabel(order.serviceRequest.vehicle);

  const invoice = await prisma.$transaction(async (tx) => {
    const created = await tx.invoice.create({
      data: { workOrderId: id, totalCents, items: { create: lines } },
      include: { items: true },
    });
    await notify(
      tx,
      customerId,
      `Invoice ${invoiceNumber(created.number)} for your ${car} is ready: ${money(totalCents)}.`,
      id
    );
    return created;
  });
  return NextResponse.json(invoice, { status: 201 });
}