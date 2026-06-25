import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireOrgOwner } from "@/lib/organization";

const patchSchema = z.object({
  role: z.literal("owner"),
});

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ userId: string }> }
) {
  const auth = getAuthUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { userId } = await ctx.params;

  const ownerCheck = await requireOrgOwner(auth.userId);
  if (ownerCheck instanceof NextResponse) return ownerCheck;

  const { count } = await prisma.organizationMember.updateMany({
    where: { userId, organizationId: ownerCheck.organization.id },
    data: { role: parsed.data.role },
  });

  if (count === 0) {
    return NextResponse.json({ error: "Membro não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

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
