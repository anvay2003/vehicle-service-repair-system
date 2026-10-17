import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guard";
import { canTechTransition } from "@/lib/workflow";

const schema = z.object({
  status: z.enum(["DIAGNOSIS", "AWAITING_APPROVAL", "IN_REPAIR", "COMPLETED"]),
  diagnosis: z.string().min(1).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireRole("TECHNICIAN");
  if (error) return error;
  const { id } = await params;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { status, diagnosis } = parsed.data;

  const order = await prisma.workOrder.findUnique({ where: { id } });
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

  const updated = await prisma.workOrder.update({
    where: { id },
    data: { status, ...(diagnosis ? { diagnosis } : {}) },
  });
  return NextResponse.json(updated);
}