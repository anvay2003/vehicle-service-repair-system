import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guard";

const schema = z.object({ decision: z.enum(["APPROVE", "REJECT"]) });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireRole("CUSTOMER");
  if (error) return error;
  const { id } = await params;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const approve = parsed.data.decision === "APPROVE";

  const order = await prisma.workOrder.findUnique({
    where: { id },
    include: { serviceRequest: true, estimate: true },
  });
  if (!order || order.serviceRequest.customerId !== session.user.id) {
    return NextResponse.json({ error: "Work order not found" }, { status: 404 });
  }
  if (
    order.status !== "AWAITING_APPROVAL" ||
    !order.estimate ||
    order.estimate.status !== "PENDING"
  ) {
    return NextResponse.json({ error: "No estimate awaiting approval" }, { status: 409 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.estimate.update({
      where: { id: order.estimate!.id },
      data: { status: approve ? "APPROVED" : "REJECTED", decidedAt: new Date() },
    });
    return tx.workOrder.update({
      where: { id },
      data: { status: approve ? "APPROVED" : "REJECTED" },
      include: { estimate: { include: { items: true } } },
    });
  });
  return NextResponse.json(updated);
}