import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireOrgOwner } from "@/lib/organization";

export async function DELETE(
  request: NextRequest,
  ctx: { params: Promise<{ userId: string }> }
) {
  const auth = getAuthUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { userId } = await ctx.params;

  if (userId === auth.userId) {
    return NextResponse.json(
      { error: "Você não pode remover a si mesmo. Cancele a assinatura pelo Customer Portal." },
      { status: 400 }
    );
  }

  const ownerCheck = await requireOrgOwner(auth.userId);
  if (ownerCheck instanceof NextResponse) return ownerCheck;

  await prisma.organizationMember.deleteMany({
    where: { userId, organizationId: ownerCheck.organization.id },
  });

  return NextResponse.json({ success: true });
}
