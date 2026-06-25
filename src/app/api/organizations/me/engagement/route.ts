import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireOrgOwner } from "@/lib/organization";

const OVERDUE_THRESHOLD_MS = 14 * 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const auth = getAuthUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const ownerCheck = await requireOrgOwner(auth.userId);
  if (ownerCheck instanceof NextResponse) return ownerCheck;

  const { organization } = ownerCheck;

  const members = await prisma.organizationMember.findMany({
    where: { organizationId: organization.id },
    select: { userId: true, user: { select: { name: true, email: true } } },
  });
  const memberUserIds = members.map((m) => m.userId);

  if (memberUserIds.length === 0) {
    return NextResponse.json({ members: [] });
  }

  // Cursos acessíveis pela organização: catálogo geral (organizationId null) + conteúdo
  // próprio dessa organização (TASK-226/227) — nunca cursos de OUTRA organização.
  const scopedCourses = await prisma.course.findMany({
    where: { status: 'published', OR: [{ organizationId: null }, { organizationId: organization.id }] },
    select: { id: true },
  });
  const scopedCourseIds = scopedCourses.map((c) => c.id);

  const [enrollments, lessonProgress] = await Promise.all([
    prisma.courseEnrollment.findMany({
      where: { userId: { in: memberUserIds }, courseId: { in: scopedCourseIds } },
      select: {
        userId: true,
        courseId: true,
        enrolledAt: true,
        completedAt: true,
        course: { select: { title: true } },
      },
    }),
    prisma.lessonProgress.findMany({
      where: {
        userId: { in: memberUserIds },
        lesson: { module: { courseId: { in: scopedCourseIds } } },
      },
      select: {
        userId: true,
        lastPositionSeconds: true,
        lastWatchedAt: true,
        lesson: { select: { module: { select: { courseId: true } } } },
      },
    }),
  ]);

  // Última atividade por membro+curso (referência para o critério de "atrasado") e soma
  // total de segundos assistidos por membro ("tempo de estudo" — proxy a partir do
  // lastPositionSeconds já usado pelo player, ver docs/fase4-grupos-de-trabalho.md).
  const lastActivityByMemberCourse = new Map<string, Date>();
  const studySecondsByMember = new Map<string, number>();

  for (const progress of lessonProgress) {
    const courseId = progress.lesson.module.courseId;
    const key = `${progress.userId}:${courseId}`;
    const current = lastActivityByMemberCourse.get(key);
    if (!current || progress.lastWatchedAt > current) {
      lastActivityByMemberCourse.set(key, progress.lastWatchedAt);
    }
    studySecondsByMember.set(
      progress.userId,
      (studySecondsByMember.get(progress.userId) ?? 0) + progress.lastPositionSeconds
    );
  }

  const enrollmentsByMember = new Map<string, typeof enrollments>();
  for (const enrollment of enrollments) {
    const list = enrollmentsByMember.get(enrollment.userId) ?? [];
    list.push(enrollment);
    enrollmentsByMember.set(enrollment.userId, list);
  }

  const now = Date.now();

  const data = members.map((member) => {
    const memberEnrollments = enrollmentsByMember.get(member.userId) ?? [];

    let completedCount = 0;
    let inProgressCount = 0;
    const overdueCourses: { courseId: string; title: string }[] = [];

    for (const enrollment of memberEnrollments) {
      if (enrollment.completedAt) {
        completedCount += 1;
        continue;
      }

      const lastActivity = lastActivityByMemberCourse.get(`${member.userId}:${enrollment.courseId}`) ?? null;
      const enrolledMoreThan14DaysAgo = now - enrollment.enrolledAt.getTime() > OVERDUE_THRESHOLD_MS;
      const noRecentActivity = !lastActivity || now - lastActivity.getTime() > OVERDUE_THRESHOLD_MS;
      const isOverdue = enrolledMoreThan14DaysAgo && noRecentActivity;

      if (isOverdue) {
        overdueCourses.push({ courseId: enrollment.courseId, title: enrollment.course.title });
      } else {
        inProgressCount += 1;
      }
    }

    return {
      userId: member.userId,
      name: member.user.name,
      email: member.user.email,
      completedCount,
      inProgressCount,
      overdueCourses,
      studySeconds: studySecondsByMember.get(member.userId) ?? 0,
    };
  });

  return NextResponse.json({ members: data });
}
