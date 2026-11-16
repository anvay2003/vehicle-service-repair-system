import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guard";
import { canTechTransition } from "@/lib/workflow";
import { notify } from "@/lib/notify";
import { pretty, vehicleLabel } from "@/lib/format";

const schema = z.object({
  status: z.enum(["DIAGNOSIS", "AWAITING_APPROVAL", "IN_REPAIR", "COMPLETED"]),
  diagnosis: z.string().min(1).optional(),
});

const STATUS_TEXT: Record<string, string> = {
  DIAGNOSIS: "is being diagnosed",
  IN_REPAIR: "is now in repair",
};

export async function PATCH(
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
  const { status, diagnosis } = parsed.data;

  const order = await prisma.workOrder.findUnique({
    where: { id },
    include: { serviceRequest: { include: { vehicle: true } } },
  });
  if (!order || order.technicianId !== session.user.id) {
    return NextResponse.json({ error: "Work order not found" }, { status: 404 });
  }
  if (!canTechTransition(order.status, status)) {
    return NextResponse.json(
      { error: `Cannot move from ${order.status} to ${status}` },
      { status: 409 }
    );
  }
  if (status === "AWAITING_APPROVAL" && !diagnosis && !order.diagnosis) {
    return NextResponse.json({ error: "Diagnosis required" }, { status: 400 });
  }

  const car = vehicleLabel(order.serviceRequest.vehicle);
  const text =
    status === "COMPLETED"
      ? `Repair completed on your ${car}. You can now review your technician.`
      : `Your ${car} ${STATUS_TEXT[status] ?? `moved to ${pretty(status).toLowerCase()}`}.`;

  const updated = await prisma.$transaction(async (tx) => {
    const wo = await tx.workOrder.update({
      where: { id },
      data: { status, ...(diagnosis ? { diagnosis } : {}) },
    });
    await notify(tx, order.serviceRequest.customerId, text, id);
    return wo;
  });
  return NextResponse.json(updated);
}