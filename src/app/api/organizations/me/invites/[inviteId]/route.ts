import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireOrgOwner } from "@/lib/organization";

export async function DELETE(
  request: NextRequest,
  ctx: { params: Promise<{ inviteId: string }> }
) {
  const auth = getAuthUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { inviteId } = await ctx.params;

  const ownerCheck = await requireOrgOwner(auth.userId);
  if (ownerCheck instanceof NextResponse) return ownerCheck;

  const { count } = await prisma.organizationInvite.deleteMany({
    where: { id: inviteId, organizationId: ownerCheck.organization.id, status: "pending" },
  });

  if (count === 0) {
    return NextResponse.json({ error: "Convite não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
