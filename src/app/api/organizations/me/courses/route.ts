import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireOrgOwner } from "@/lib/organization";

export async function GET(request: NextRequest) {
  const auth = getAuthUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const ownerCheck = await requireOrgOwner(auth.userId);
  if (ownerCheck instanceof NextResponse) return ownerCheck;

  const { organization } = ownerCheck;

  // Membros ativos da organização
  const members = await prisma.organizationMember.findMany({
    where: { organizationId: organization.id },
    select: { userId: true },
  });
  const memberUserIds = members.map((m) => m.userId);

  // Cursos acessíveis: catálogo público publicado + conteúdo próprio desta org (qualquer status)
  const courses = await prisma.course.findMany({
    where: {
      OR: [
        { organizationId: null, status: "published" },
        { organizationId: organization.id },
      ],
    },
    select: {
      id: true,
      title: true,
      slug: true,
      organizationId: true,
      dueDate: true,
    },
  });

  if (courses.length === 0) {
    return NextResponse.json({ courses: [] });
  }

  const courseIds = courses.map((c) => c.id);

  const enrollments =
    memberUserIds.length > 0
      ? await prisma.courseEnrollment.findMany({
          where: {
            userId: { in: memberUserIds },
            courseId: { in: courseIds },
          },
          select: {
            userId: true,
            courseId: true,
            completedAt: true,
          },
        })
      : [];

  const now = Date.now();

  // Agrupa enrollments por courseId para iterar uma vez por curso
  const enrollmentsByCourse = new Map<string, typeof enrollments>();
  for (const e of enrollments) {
    const list = enrollmentsByCourse.get(e.courseId) ?? [];
    list.push(e);
    enrollmentsByCourse.set(e.courseId, list);
  }

  const data = courses.map((course) => {
    const courseEnrollments = enrollmentsByCourse.get(course.id) ?? [];
    const isPastDue = course.dueDate != null && course.dueDate.getTime() < now;

    let enrolledCount = 0;
    let completedCount = 0;
    let inProgressCount = 0;
    let overdueCount = 0;

    for (const e of courseEnrollments) {
      enrolledCount += 1;
      if (e.completedAt) {
        completedCount += 1;
      } else if (isPastDue) {
        overdueCount += 1;
      } else {
        inProgressCount += 1;
      }
    }

    return {
      courseId: course.id,
      title: course.title,
      slug: course.slug,
      organizationId: course.organizationId,
      dueDate: course.dueDate,
      enrolledCount,
      completedCount,
      inProgressCount,
      overdueCount,
    };
  });

  return NextResponse.json({ courses: data });
}
