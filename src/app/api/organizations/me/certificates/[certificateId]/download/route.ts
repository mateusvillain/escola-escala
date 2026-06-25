import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireOrgOwner } from "@/lib/organization";
import { buildCertificateDownloadResponse } from "@/lib/certificate";

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ certificateId: string }> }
) {
  const auth = getAuthUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const ownerCheck = await requireOrgOwner(auth.userId);
  if (ownerCheck instanceof NextResponse) return ownerCheck;

  const { certificateId } = await ctx.params;

  const certificate = await prisma.certificate.findUnique({
    where: { id: certificateId },
    select: {
      fileUrl: true,
      userId: true,
      course: { select: { slug: true } },
    },
  });

  if (!certificate || !certificate.fileUrl) {
    return NextResponse.json({ error: "Certificado não encontrado" }, { status: 404 });
  }

  const member = await prisma.organizationMember.findUnique({
    where: { userId: certificate.userId },
    select: { organizationId: true },
  });

  if (!member || member.organizationId !== ownerCheck.organization.id) {
    return NextResponse.json({ error: "Certificado não encontrado" }, { status: 404 });
  }

  return buildCertificateDownloadResponse(certificate.fileUrl, certificate.course.slug);
}
