import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ token: string }> }
) {
  const { token } = await ctx.params;

  const invite = await prisma.organizationInvite.findUnique({
    where: { token },
    include: { organization: { select: { name: true } } },
  });

  if (!invite) {
    return NextResponse.json({ error: "Convite não encontrado" }, { status: 404 });
  }

  const expired = invite.status === "pending" && invite.expiresAt < new Date();

  return NextResponse.json({
    organizationName: invite.organization.name,
    email: invite.email,
    status: expired ? "expired" : invite.status,
  });
}
