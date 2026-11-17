import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guard";
import { notify } from "@/lib/notify";
import { vehicleLabel } from "@/lib/format";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireRole("STAFF", "ADMIN");
  if (error) return error;
  const { id } = await params;

  const request = await prisma.serviceRequest.findUnique({
    where: { id },
    include: { vehicle: true },
  });
  if (!request) {
    return NextResponse.json({ error: "Service request not found" }, { status: 404 });
  }
  if (request.status !== "REQUESTED") {
    return NextResponse.json({ error: "Request is not awaiting check-in" }, { status: 409 });
  }

  const car = vehicleLabel(request.vehicle);
  const workOrder = await prisma.$transaction(async (tx) => {
    const wo = await tx.workOrder.create({
      data: { serviceRequestId: request.id, status: "CHECKED_IN" },
    });
    await tx.serviceRequest.update({
      where: { id: request.id },
      data: { status: "CHECKED_IN" },
    });
    await notify(tx, request.customerId, `Your ${car} has been checked in and a work order is open.`, wo.id);
    return wo;
  });
  return NextResponse.json(workOrder, { status: 201 });
}