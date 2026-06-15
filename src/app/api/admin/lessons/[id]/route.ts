import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).nullable().optional(),
  videoId: z.string().max(255).nullable().optional(),
  videoDuration: z.number().int().positive().nullable().optional(),
  content: z.string().max(50000).nullable().optional(),
  order: z.number().int().positive().optional(),
  isPreview: z.boolean().optional(),
});

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/admin/lessons/[id]">
) {
  const auth = requireRole(_req, ["admin"]);
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;

  const lesson = await prisma.lesson.findUnique({ where: { id } });
  if (!lesson) {
    return NextResponse.json({ error: "Aula não encontrada" }, { status: 404 });
  }

  return NextResponse.json({ lesson });
}

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/lessons/[id]">
) {
  const auth = requireRole(request, ["admin"]);
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;

  const existing = await prisma.lesson.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Aula não encontrada" }, { status: 404 });
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

  const lesson = await prisma.lesson.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ lesson });
}

export async function DELETE(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/lessons/[id]">
) {
  const auth = requireRole(request, ["admin"]);
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;

  const existing = await prisma.lesson.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Aula não encontrada" }, { status: 404 });
  }

  await prisma.lesson.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}
