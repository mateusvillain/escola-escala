import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/courses/[id]/modules">
) {
  const auth = requireRole(request, ["admin"]);
  if (auth instanceof NextResponse) return auth;

  const { id: courseId } = await ctx.params;

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    return NextResponse.json({ error: "Curso não encontrado" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const order = (await prisma.module.count({ where: { courseId } })) + 1;

  const module = await prisma.module.create({
    data: {
      courseId,
      title: parsed.data.title,
      description: parsed.data.description,
      order,
    },
    select: {
      id: true,
      courseId: true,
      title: true,
      description: true,
      order: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ module }, { status: 201 });
}
