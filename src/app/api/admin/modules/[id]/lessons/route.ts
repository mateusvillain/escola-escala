import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  videoId: z.string().max(255).optional(),
  videoDuration: z.number().int().positive().optional(),
  content: z.string().max(50000).optional(),
  isPreview: z.boolean().optional(),
});

export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/modules/[id]/lessons">
) {
  const auth = requireRole(request, ["admin"]);
  if (auth instanceof NextResponse) return auth;

  const { id: moduleId } = await ctx.params;

  const module = await prisma.module.findUnique({ where: { id: moduleId } });
  if (!module) {
    return NextResponse.json({ error: "Módulo não encontrado" }, { status: 404 });
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

  const order = (await prisma.lesson.count({ where: { moduleId } })) + 1;

  const lesson = await prisma.lesson.create({
    data: {
      moduleId,
      order,
      title: parsed.data.title,
      description: parsed.data.description,
      videoId: parsed.data.videoId,
      videoDuration: parsed.data.videoDuration,
      content: parsed.data.content,
      isPreview: parsed.data.isPreview ?? false,
    },
    select: {
      id: true,
      moduleId: true,
      title: true,
      description: true,
      videoId: true,
      videoDuration: true,
      content: true,
      order: true,
      isPreview: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ lesson }, { status: 201 });
}
