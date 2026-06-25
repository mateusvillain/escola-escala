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
    select: { userId: true },
  });
  const memberUserIds = members.map((m) => m.userId);

  const certificates = await prisma.certificate.findMany({
    where: { userId: { in: memberUserIds } },
    select: {
      id: true,
      userId: true,
      issuedAt: true,
      expiresAt: true,
      user: { select: { name: true } },
      course: { select: { id: true, title: true } },
    },
    orderBy: { issuedAt: "desc" },
  });

  const enrollments = await prisma.courseEnrollment.findMany({
    where: {
      userId: { in: memberUserIds },
      courseId: { in: certificates.map((c) => c.course.id) },
    },
    select: { userId: true, courseId: true, completedAt: true },
  });
  const completedAtByMemberCourse = new Map(
    enrollments.map((e) => [`${e.userId}:${e.courseId}`, e.completedAt])
  );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const rows = certificates.map((cert) => {
    const completedAt = completedAtByMemberCourse.get(`${cert.userId}:${cert.course.id}`) ?? null;
    return [
      cert.user.name,
      cert.course.title,
      completedAt ? completedAt.toISOString() : "",
      cert.issuedAt.toISOString(),
      cert.expiresAt ? cert.expiresAt.toISOString() : "",
      `${appUrl}/api/organizations/me/certificates/${cert.id}/download`,
    ];
  });

  const csv = toCsv(
    ["Membro", "Curso", "Data de conclusão", "Data de emissão", "Validade", "Link de download"],
    rows
  );

  return new NextResponse(csv, {
    status: 200,
    headers: csvResponseHeaders("certificados-organizacao.csv"),
  });
}
