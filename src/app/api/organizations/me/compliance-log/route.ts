import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireOrgOwner } from "@/lib/organization";
import { toCsv, csvResponseHeaders } from "@/lib/csv";

export async function GET(request: NextRequest) {
  const auth = getAuthUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const ownerCheck = await requireOrgOwner(auth.userId);
  if (ownerCheck instanceof NextResponse) return ownerCheck;

  const members = await prisma.organizationMember.findMany({
    where: { organizationId: ownerCheck.organization.id },
    select: { userId: true, user: { select: { name: true, email: true } } },
  });
  const memberUserIds = members.map((m) => m.userId);
  const userInfoById = new Map(members.map((m) => [m.userId, m.user]));

  const completions = await prisma.courseEnrollment.findMany({
    where: { userId: { in: memberUserIds }, completedAt: { not: null } },
    select: {
      userId: true,
      completedAt: true,
      course: { select: { id: true, title: true } },
    },
    orderBy: { completedAt: "desc" },
  });

  const certificates = await prisma.certificate.findMany({
    where: {
      userId: { in: memberUserIds },
      courseId: { in: completions.map((c) => c.course.id) },
    },
    select: { userId: true, courseId: true, expiresAt: true },
  });
  const certByMemberCourse = new Map(
    certificates.map((c) => [`${c.userId}:${c.courseId}`, c])
  );

  const rows = completions.map((completion) => {
    const member = userInfoById.get(completion.userId)!;
    const certificate = certByMemberCourse.get(`${completion.userId}:${completion.course.id}`);
    return [
      member.name,
      member.email,
      completion.course.title,
      completion.completedAt!.toISOString(),
      certificate ? "Sim" : "Não",
      certificate?.expiresAt ? certificate.expiresAt.toISOString() : "",
    ];
  });

  const csv = toCsv(
    ["Membro", "E-mail", "Curso", "Data de conclusão", "Certificado emitido", "Validade"],
    rows
  );

  return new NextResponse(csv, {
    status: 200,
    headers: csvResponseHeaders("log-compliance-organizacao.csv"),
  });
}
