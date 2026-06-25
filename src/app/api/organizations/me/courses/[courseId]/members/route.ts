import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireOrgOwner } from "@/lib/organization";

type MemberStatus = "completed" | "in_progress" | "overdue" | "not_started";

export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/organizations/me/courses/[courseId]/members">
) {
  const auth = getAuthUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const ownerCheck = await requireOrgOwner(auth.userId);
  if (ownerCheck instanceof NextResponse) return ownerCheck;

  const { organization } = ownerCheck;
  const { courseId } = await ctx.params;

  // Verifica que o curso é acessível por esta organização
  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      OR: [
        { organizationId: null, status: "published" },
        { organizationId: organization.id },
      ],
    },
    select: { id: true, dueDate: true },
  });

  if (!course) {
    return NextResponse.json({ error: "Curso não encontrado" }, { status: 404 });
  }

  // Membros ativos da organização com dados do usuário
  const members = await prisma.organizationMember.findMany({
    where: { organizationId: organization.id },
    select: {
      userId: true,
      user: { select: { name: true, email: true } },
    },
  });

  if (members.length === 0) {
    return NextResponse.json({ members: [] });
  }

  const memberUserIds = members.map((m) => m.userId);

  // Enrollments e progresso em paralelo
  const [enrollments, progressRecords] = await Promise.all([
    prisma.courseEnrollment.findMany({
      where: { userId: { in: memberUserIds }, courseId },
      select: { userId: true, completedAt: true },
    }),
    prisma.lessonProgress.findMany({
      where: {
        userId: { in: memberUserIds },
        lesson: { module: { courseId } },
      },
      select: { userId: true, lastWatchedAt: true },
    }),
  ]);

  const enrollmentByUser = new Map(enrollments.map((e) => [e.userId, e]));

  // Última atividade por membro neste curso
  const lastActivityByUser = new Map<string, Date>();
  for (const p of progressRecords) {
    const current = lastActivityByUser.get(p.userId);
    if (!current || p.lastWatchedAt > current) {
      lastActivityByUser.set(p.userId, p.lastWatchedAt);
    }
  }

  const now = Date.now();
  const isPastDue = course.dueDate != null && course.dueDate.getTime() < now;

  const data = members.map((member) => {
    const enrollment = enrollmentByUser.get(member.userId);
    const lastActivity = lastActivityByUser.get(member.userId) ?? null;
    const hasProgress = lastActivity != null;

    let status: MemberStatus;
    let daysOverdue: number | undefined;

    if (!enrollment || (!enrollment.completedAt && !hasProgress)) {
      status = "not_started";
    } else if (enrollment.completedAt) {
      status = "completed";
    } else if (isPastDue) {
      status = "overdue";
      daysOverdue = Math.floor(
        (now - course.dueDate!.getTime()) / (24 * 60 * 60 * 1000)
      );
    } else {
      status = "in_progress";
    }

    return {
      userId: member.userId,
      name: member.user.name,
      email: member.user.email,
      status,
      completedAt: enrollment?.completedAt ?? null,
      ...(daysOverdue !== undefined ? { daysOverdue } : {}),
      lastActivity,
    };
  });

  return NextResponse.json({ members: data });
}
