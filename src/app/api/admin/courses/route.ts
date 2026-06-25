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
        createdAt: true,
        instructor: {
          select: {
            user: { select: { name: true } },
          },
        },
        organization: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.course.count({ where }),
  ]);

  const data = courses.map(({ instructor, organization, ...course }) => ({
    ...course,
    instructor: { name: instructor.user.name },
    organization: organization ? { name: organization.name } : null,
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
  allowOneTimePurchase: z.boolean().optional(),
  priceOneTime: z.number().positive().nullable().optional(),
  stripePriceIdOneTime: z.string().min(1).nullable().optional(),
  organizationId: z.string().uuid().nullable().optional(),
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

  const {
    title,
    planAccess,
    description,
    thumbnailUrl,
    instructorId,
    allowOneTimePurchase,
    priceOneTime,
    stripePriceIdOneTime,
    organizationId,
  } = parsed.data;

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
      allowOneTimePurchase: allowOneTimePurchase ?? false,
      priceOneTime: priceOneTime ?? null,
      stripePriceIdOneTime: stripePriceIdOneTime ?? null,
      organizationId: organizationId ?? null,
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
      organizationId: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ course }, { status: 201 });
}
