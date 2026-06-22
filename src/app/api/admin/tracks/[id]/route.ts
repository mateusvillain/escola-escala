import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/audit";

const patchSchema = z.object({
  status: z.enum(["draft", "published", "archived"]).optional(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional(),
  thumbnailUrl: z.string().url().nullable().optional(),
  isBundle: z.boolean().optional(),
  bundlePriceOneTime: z.number().positive().nullable().optional(),
  stripePriceIdBundle: z.string().min(1).nullable().optional(),
});

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/admin/tracks/[id]">
) {
  const auth = requireRole(_req, ["admin"]);
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;

  const track = await prisma.courseTrack.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { order: "asc" },
        include: {
          course: {
            select: { id: true, title: true, slug: true, thumbnailUrl: true, status: true },
          },
        },
      },
    },
  });

  if (!track) {
    return NextResponse.json({ error: "Trilha não encontrada" }, { status: 404 });
  }

  return NextResponse.json({ track });
}

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/tracks/[id]">
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

  const existing = await prisma.courseTrack.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Trilha não encontrada" }, { status: 404 });
  }

  if (parsed.data.status === "published") {
    const itemCount = await prisma.courseTrackItem.count({ where: { trackId: id } });
    if (itemCount < 2) {
      return NextResponse.json(
        { error: "A trilha precisa ter ao menos 2 cursos para ser publicada" },
        { status: 400 }
      );
    }
  }

  const track = await prisma.courseTrack.update({
    where: { id },
    data: parsed.data,
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      thumbnailUrl: true,
      status: true,
      isBundle: true,
      bundlePriceOneTime: true,
      stripePriceIdBundle: true,
      updatedAt: true,
    },
  });

  if (parsed.data.status !== undefined && parsed.data.status !== existing.status) {
    await logAdminAction({
      actorId: auth.user.userId,
      action: "track.status_changed",
      entityType: "CourseTrack",
      entityId: id,
      metadata: { title: existing.title, from: existing.status, to: parsed.data.status },
    });
  }

  return NextResponse.json({ track });
}

export async function DELETE(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/tracks/[id]">
) {
  const auth = requireRole(request, ["admin"]);
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;

  const existing = await prisma.courseTrack.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Trilha não encontrada" }, { status: 404 });
  }

  await prisma.courseTrack.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}
