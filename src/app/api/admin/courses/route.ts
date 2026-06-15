import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUniqueSlug } from "@/lib/utils/slug";

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

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        planAccess: true,
        instructor: {
          select: {
            user: { select: { name: true } },
          },
        },
        _count: {
          select: {
            modules: true,
            enrollments: true,
          },
        },
        modules: {
          select: {
            _count: { select: { lessons: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.course.count({ where }),
  ]);

  const data = courses.map(({ modules, _count, instructor, ...course }) => ({
    ...course,
    instructor: { name: instructor.user.name },
    _count: {
      modules: _count.modules,
      lessons: modules.reduce((sum, m) => sum + m._count.lessons, 0),
      enrollments: _count.enrollments,
    },
  }));

  return NextResponse.json({
    data,
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
  planAccess: z.enum(["basic", "premium"]),
  description: z.string().max(5000).optional(),
  thumbnailUrl: z.string().url().nullable().optional(),
  instructorId: z.string().uuid().optional(),
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

  const { title, planAccess, description, thumbnailUrl, instructorId } = parsed.data;

  if (!instructorId) {
    return NextResponse.json(
      { error: "instructorId é obrigatório" },
      { status: 400 }
    );
  }

  const slug = await getUniqueSlug(title, prisma);

  const course = await prisma.course.create({
    data: {
      title,
      slug,
      description: description ?? "",
      thumbnailUrl: thumbnailUrl ?? null,
      instructorId,
      planAccess,
      status: "draft",
    },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      thumbnailUrl: true,
      planAccess: true,
      status: true,
      instructorId: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ course }, { status: 201 });
}
