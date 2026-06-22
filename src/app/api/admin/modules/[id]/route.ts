import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const patchSchema = z
  .object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().max(2000).nullable().optional(),
    order: z.number().int().positive().optional(),
    releaseType: z.enum(["immediate", "fixed_date", "days_after_enrollment"]).optional(),
    releaseDate: z.coerce.date().nullable().optional(),
    releaseAfterDays: z.number().int().positive().nullable().optional(),
  })
  .refine(data => data.releaseType !== "fixed_date" || data.releaseDate != null, {
    message: "releaseDate é obrigatório quando releaseType é fixed_date",
    path: ["releaseDate"],
  })
  .refine(data => data.releaseType !== "days_after_enrollment" || data.releaseAfterDays != null, {
    message: "releaseAfterDays é obrigatório quando releaseType é days_after_enrollment",
    path: ["releaseAfterDays"],
  });

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/modules/[id]">
) {
  const auth = requireRole(request, ["admin"]);
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;

  const existing = await prisma.module.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Módulo não encontrado" }, { status: 404 });
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

  const { order: newOrder, ...rest } = parsed.data;

  if (newOrder !== undefined && newOrder !== existing.order) {
    const siblings = await prisma.module.findMany({
      where: { courseId: existing.courseId, id: { not: id } },
      orderBy: { order: "asc" },
    });

    const reordered = siblings.filter(m => m.order !== existing.order);
    reordered.splice(newOrder - 1, 0, { ...existing, order: newOrder });

    await prisma.$transaction(
      reordered.map((m, idx) =>
        prisma.module.update({ where: { id: m.id }, data: { order: idx + 1 } })
      )
    );
  }

  const module = await prisma.module.update({
    where: { id },
    data: { ...rest, ...(newOrder !== undefined ? { order: newOrder } : {}) },
    select: {
      id: true,
      courseId: true,
      title: true,
      description: true,
      order: true,
      releaseType: true,
      releaseDate: true,
      releaseAfterDays: true,
    },
  });

  return NextResponse.json({ module });
}

export async function DELETE(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/modules/[id]">
) {
  const auth = requireRole(request, ["admin"]);
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;

  const existing = await prisma.module.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Módulo não encontrado" }, { status: 404 });
  }

  await prisma.module.delete({ where: { id } });

  // Close the gap left by the deleted module
  const remaining = await prisma.module.findMany({
    where: { courseId: existing.courseId },
    orderBy: { order: "asc" },
  });
  await prisma.$transaction(
    remaining.map((m, idx) =>
      prisma.module.update({ where: { id: m.id }, data: { order: idx + 1 } })
    )
  );

  return new NextResponse(null, { status: 204 });
}
