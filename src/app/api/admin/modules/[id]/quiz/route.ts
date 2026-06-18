import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const questionSchema = z
  .object({
    text: z.string().min(1).max(1000),
    options: z.array(z.string().min(1).max(255)).min(2).max(5),
    correctOptionIndex: z.number().int().min(0),
  })
  .refine(q => q.correctOptionIndex < q.options.length, {
    message: "correctOptionIndex deve apontar para uma alternativa existente",
    path: ["correctOptionIndex"],
  });

const putSchema = z.object({
  questions: z.array(questionSchema).min(1).max(50),
});

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/admin/modules/[id]/quiz">
) {
  const auth = requireRole(_req, ["admin"]);
  if (auth instanceof NextResponse) return auth;

  const { id: moduleId } = await ctx.params;

  const quiz = await prisma.quiz.findUnique({
    where: { moduleId },
    include: { questions: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json({ quiz });
}

export async function PUT(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/modules/[id]/quiz">
) {
  const auth = requireRole(request, ["admin"]);
  if (auth instanceof NextResponse) return auth;

  const { id: moduleId } = await ctx.params;

  const existingModule = await prisma.module.findUnique({ where: { id: moduleId } });
  if (!existingModule) {
    return NextResponse.json({ error: "Módulo não encontrado" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const parsed = putSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const quiz = await prisma.$transaction(async tx => {
    const upserted = await tx.quiz.upsert({
      where: { moduleId },
      create: { moduleId },
      update: {},
    });

    await tx.quizQuestion.deleteMany({ where: { quizId: upserted.id } });
    await tx.quizQuestion.createMany({
      data: parsed.data.questions.map((q, idx) => ({
        quizId: upserted.id,
        text: q.text,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
        order: idx + 1,
      })),
    });

    return tx.quiz.findUnique({
      where: { id: upserted.id },
      include: { questions: { orderBy: { order: "asc" } } },
    });
  });

  return NextResponse.json({ quiz });
}

export async function DELETE(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/modules/[id]/quiz">
) {
  const auth = requireRole(request, ["admin"]);
  if (auth instanceof NextResponse) return auth;

  const { id: moduleId } = await ctx.params;

  const quiz = await prisma.quiz.findUnique({ where: { moduleId } });
  if (!quiz) {
    return NextResponse.json({ error: "Quiz não encontrado" }, { status: 404 });
  }

  await prisma.quiz.delete({ where: { id: quiz.id } });

  return new NextResponse(null, { status: 204 });
}
