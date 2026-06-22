import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  order: z.number().int().positive(),
});

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/tracks/[id]/courses/[courseId]">
) {
  const auth = requireRole(request, ["admin"]);
  if (auth instanceof NextResponse) return auth;

  const { id: trackId, courseId } = await ctx.params;

  const existing = await prisma.courseTrackItem.findUnique({
    where: { trackId_courseId: { trackId, courseId } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Curso não encontrado na trilha" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { order: newOrder } = parsed.data;

  if (newOrder !== existing.order) {
    const siblings = await prisma.courseTrackItem.findMany({
      where: { trackId, courseId: { not: courseId } },
      orderBy: { order: "asc" },
    });

    const reordered = siblings.filter(i => i.order !== existing.order);
    reordered.splice(newOrder - 1, 0, { ...existing, order: newOrder });

    await prisma.$transaction(
      reordered.map((i, idx) =>
        prisma.courseTrackItem.update({ where: { id: i.id }, data: { order: idx + 1 } })
      )
    );
  }

  const item = await prisma.courseTrackItem.update({
    where: { id: existing.id },
    data: { order: newOrder },
    select: { id: true, trackId: true, courseId: true, order: true },
  });

  return NextResponse.json({ item });
}

export async function DELETE(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/tracks/[id]/courses/[courseId]">
) {
  const auth = requireRole(request, ["admin"]);
  if (auth instanceof NextResponse) return auth;

  const { id: trackId, courseId } = await ctx.params;

  const existing = await prisma.courseTrackItem.findUnique({
    where: { trackId_courseId: { trackId, courseId } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Curso não encontrado na trilha" }, { status: 404 });
  }

  await prisma.courseTrackItem.delete({ where: { id: existing.id } });

  // Close the gap left by the removed item
  const remaining = await prisma.courseTrackItem.findMany({
    where: { trackId },
    orderBy: { order: "asc" },
  });
  await prisma.$transaction(
    remaining.map((i, idx) =>
      prisma.courseTrackItem.update({ where: { id: i.id }, data: { order: idx + 1 } })
    )
  );

  return new NextResponse(null, { status: 204 });
}
