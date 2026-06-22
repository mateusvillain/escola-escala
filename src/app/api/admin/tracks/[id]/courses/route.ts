import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  courseId: z.string().uuid(),
});

export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/tracks/[id]/courses">
) {
  const auth = requireRole(request, ["admin"]);
  if (auth instanceof NextResponse) return auth;

  const { id: trackId } = await ctx.params;

  const track = await prisma.courseTrack.findUnique({ where: { id: trackId } });
  if (!track) {
    return NextResponse.json({ error: "Trilha não encontrada" }, { status: 404 });
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

  const { courseId } = parsed.data;

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    return NextResponse.json({ error: "Curso não encontrado" }, { status: 404 });
  }

  const existingItem = await prisma.courseTrackItem.findUnique({
    where: { trackId_courseId: { trackId, courseId } },
  });
  if (existingItem) {
    return NextResponse.json({ error: "Este curso já está na trilha" }, { status: 409 });
  }

  const order = (await prisma.courseTrackItem.count({ where: { trackId } })) + 1;

  const item = await prisma.courseTrackItem.create({
    data: { trackId, courseId, order },
    select: {
      id: true,
      trackId: true,
      courseId: true,
      order: true,
      course: {
        select: { id: true, title: true, slug: true, thumbnailUrl: true, status: true },
      },
    },
  });

  return NextResponse.json({ item }, { status: 201 });
}
