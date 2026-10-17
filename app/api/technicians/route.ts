import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/guard";

export async function GET() {
  const { error } = await requireRole("STAFF", "ADMIN");
  if (error) return error;
  const techs = await prisma.user.findMany({
    where: { role: "TECHNICIAN" },
    select: { id: true, name: true, email: true },
  });
  return NextResponse.json(techs);
}