import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ token: string }> }
) {
  const auth = getAuthUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { token } = await ctx.params;

  const invite = await prisma.organizationInvite.findUnique({ where: { token } });
  if (!invite) {
    return NextResponse.json({ error: "Convite não encontrado" }, { status: 404 });
  }

  if (invite.status !== "pending") {
    return NextResponse.json({ error: "Este convite já foi utilizado" }, { status: 409 });
  }

  if (invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Este convite expirou" }, { status: 409 });
  }

  if (invite.email !== auth.email) {
    return NextResponse.json(
      { error: "Este convite foi enviado para outro e-mail" },
      { status: 403 }
    );
  }

  const existingMembership = await prisma.organizationMember.findUnique({
    where: { userId: auth.userId },
  });
  if (existingMembership) {
    return NextResponse.json(
      { error: "Usuário já pertence a uma organização" },
      { status: 409 }
    );
  }

  await prisma.$transaction([
    prisma.organizationMember.create({
      data: { organizationId: invite.organizationId, userId: auth.userId, role: "member" },
    }),
    prisma.organizationInvite.update({
      where: { id: invite.id },
      data: { status: "accepted" },
    }),
  ]);

  return NextResponse.json({ success: true });
}
