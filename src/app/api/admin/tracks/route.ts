import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUniqueTrackSlug } from "@/lib/utils/slug";

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ["admin"]);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const skip = (page - 1) * limit;

  const where = {
    ...(status ? { status: status as "draft" | "published" | "archived" } : {}),
    ...(search ? { title: { contains: search, mode: "insensitive" as const } } : {}),
  };

  const [tracks, total] = await Promise.all([
    prisma.courseTrack.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        isBundle: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.courseTrack.count({ where }),
  ]);

  return NextResponse.json({
    data: tracks,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

const createSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  thumbnailUrl: z.string().url().nullable().optional(),
  isBundle: z.boolean().optional(),
  bundlePriceOneTime: z.number().positive().nullable().optional(),
  stripePriceIdBundle: z.string().min(1).nullable().optional(),
});

export async function POST(request: NextRequest) {
  const auth = requireRole(request, ["admin"]);
  if (auth instanceof NextResponse) return auth;

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

  const { title, description, thumbnailUrl, isBundle, bundlePriceOneTime, stripePriceIdBundle } =
    parsed.data;

  const slug = await getUniqueTrackSlug(title, prisma);

  const track = await prisma.courseTrack.create({
    data: {
      title,
      slug,
      description: description ?? "",
      thumbnailUrl: thumbnailUrl ?? null,
      status: "draft",
      isBundle: isBundle ?? false,
      bundlePriceOneTime: bundlePriceOneTime ?? null,
      stripePriceIdBundle: stripePriceIdBundle ?? null,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      thumbnailUrl: true,
      status: true,
      isBundle: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ track }, { status: 201 });
}
