import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  status: z.enum(["draft", "published", "archived"]).optional(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  thumbnailUrl: z.string().url().nullable().optional(),
  planAccess: z.enum(["basic", "premium"]).optional(),
  instructorId: z.string().uuid().optional(),
});

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/admin/courses/[id]">
) {
  const auth = requireRole(_req, ["admin"]);
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      instructor: { include: { user: { select: { name: true } } } },
      modules: { include: { lessons: true }, orderBy: { order: "asc" } },
      _count: { select: { enrollments: true } },
    },
  });

  if (!course) {
    return NextResponse.json({ error: "Curso não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ course });
}

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/courses/[id]">
) {
  const auth = requireRole(request, ["admin"]);
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;

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

  const existing = await prisma.course.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Curso não encontrado" }, { status: 404 });
  }

  const course = await prisma.course.update({
    where: { id },
    data: parsed.data,
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      planAccess: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ course });
}
