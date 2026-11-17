import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guard";
import { notify } from "@/lib/notify";
import { vehicleLabel } from "@/lib/format";

const schema = z.object({ technicianId: z.string().min(1) });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireRole("STAFF", "ADMIN");
  if (error) return error;
  const { id } = await params;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const tech = await prisma.user.findUnique({ where: { id: parsed.data.technicianId } });
  if (!tech || tech.role !== "TECHNICIAN") {
    return NextResponse.json({ error: "Technician not found" }, { status: 404 });
  }

  const order = await prisma.workOrder.findUnique({
    where: { id },
    include: { serviceRequest: { include: { vehicle: true } } },
  });
  if (!order) {
    return NextResponse.json({ error: "Work order not found" }, { status: 404 });
  }
  if (order.status === "COMPLETED" || order.status === "REJECTED") {
    return NextResponse.json({ error: "Work order is closed" }, { status: 409 });
  }

  const previousTechId = order.technicianId;
  const customerId = order.serviceRequest.customerId;
  const car = vehicleLabel(order.serviceRequest.vehicle);
  const changed = previousTechId !== tech.id;

  const updated = await prisma.$transaction(async (tx) => {
    const wo = await tx.workOrder.update({
      where: { id },
      data: { technicianId: tech.id },
      include: { technician: { select: { id: true, name: true } } },
    });
    if (changed) {
            await notify(
        tx,
        customerId,
        previousTechId
          ? `Your ${car} has been reassigned to ${tech.name}.`
          : `${tech.name} has been assigned to your ${car}.`,
        id
      );
      await notify(
        tx,
        tech.id,
        previousTechId ? `Work order reassigned to you: ${car}.` : `New work order assigned: ${car}.`,
        id
      );
      if (previousTechId) {
        await notify(tx, previousTechId, `The work order for the ${car} was reassigned to ${tech.name}.`, id);
      }
    }
    return wo;
  });
  return NextResponse.json(updated);
}