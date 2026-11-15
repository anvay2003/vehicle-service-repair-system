import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guard";

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional(),
});

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
  const { rating, comment } = parsed.data;

  const order = await prisma.workOrder.findUnique({
    where: { id },
    include: { serviceRequest: true, review: true },
  });
  if (!order || order.serviceRequest.customerId !== session.user.id) {
    return NextResponse.json({ error: "Work order not found" }, { status: 404 });
  }
  if (order.status !== "COMPLETED" || !order.technicianId) {
    return NextResponse.json(
      { error: "You can review a technician only after the repair is completed" },
      { status: 409 }
    );
  }
  if (order.review) {
    return NextResponse.json({ error: "You have already reviewed this repair" }, { status: 409 });
  }

  const review = await prisma.review.create({
    data: {
      workOrderId: id,
      customerId: session.user.id,
      technicianId: order.technicianId,
      rating,
      comment: comment || null,
    },
  });
  return NextResponse.json(review, { status: 201 });
}