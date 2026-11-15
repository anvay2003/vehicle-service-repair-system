import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function displayName(full: string) {
  const parts = full.trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.` : parts[0];
}

export async function GET() {
  const [reviews, techs, stats] = await Promise.all([
    prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      include: {
        customer: { select: { name: true } },
        technician: { select: { name: true, avatarUrl: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: "TECHNICIAN" },
      select: { id: true, name: true, avatarUrl: true },
      orderBy: { name: "asc" },
    }),
    prisma.review.groupBy({
      by: ["technicianId"],
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);
  const byTech = new Map(stats.map((s) => [s.technicianId, s]));

  return NextResponse.json({
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      customerName: displayName(r.customer.name),
      technician: r.technician,
    })),
    technicians: techs.map((t) => ({
      id: t.id,
      name: t.name,
      avatarUrl: t.avatarUrl,
      avgRating: byTech.get(t.id)?._avg.rating ?? null,
      reviewCount: byTech.get(t.id)?._count.rating ?? 0,
    })),
  });
}