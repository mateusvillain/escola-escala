import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendOrganizationInviteEmail } from "@/lib/email";
import { requireOrgOwner } from "@/lib/organization";

const postSchema = z.object({
  email: z.string().email(),
});

const INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
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

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const ownerCheck = await requireOrgOwner(auth.userId);
  if (ownerCheck instanceof NextResponse) return ownerCheck;

  const { organization } = ownerCheck;

  const [membersCount, pendingInvitesCount, existingPending] = await Promise.all([
    prisma.organizationMember.count({ where: { organizationId: organization.id } }),
    prisma.organizationInvite.count({ where: { organizationId: organization.id, status: "pending" } }),
    prisma.organizationInvite.findFirst({
      where: { organizationId: organization.id, email: parsed.data.email, status: "pending" },
    }),
  ]);

  if (existingPending) {
    return NextResponse.json(
      { error: "Já existe um convite pendente para este e-mail" },
      { status: 409 }
    );
  }

  if (membersCount + pendingInvitesCount >= organization.seatLimit) {
    return NextResponse.json(
      { error: "Limite de seats da organização atingido" },
      { status: 409 }
    );
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + INVITE_EXPIRY_MS);

  const invite = await prisma.organizationInvite.create({
    data: {
      organizationId: organization.id,
      email: parsed.data.email,
      token,
      invitedByUserId: auth.userId,
      expiresAt,
    },
  });

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/convite/${token}`;
  await sendOrganizationInviteEmail(parsed.data.email, auth.name, organization.name, inviteUrl);

  return NextResponse.json({ invite }, { status: 201 });
}
