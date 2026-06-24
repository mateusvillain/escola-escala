import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireOrgOwner } from "@/lib/organization";
import { validateCnpj } from "@/lib/utils/document";
import { validateCep } from "@/lib/viacep";
import { BRAZILIAN_STATES } from "@/lib/brazilian-states";

export async function GET(request: NextRequest) {
  const auth = getAuthUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const membership = await prisma.organizationMember.findUnique({
    where: { userId: auth.userId },
    include: {
      organization: {
        include: {
          members: {
            include: { user: { select: { name: true, email: true } } },
          },
          invites: {
            where: { status: "pending" },
            orderBy: { createdAt: "desc" },
          },
          subscription: true,
        },
      },
    },
  });

  if (!membership) {
    const pendingInvite = await prisma.organizationInvite.findFirst({
      where: { email: auth.email, status: "pending", expiresAt: { gt: new Date() } },
      include: { organization: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      {
        error: "Usuário não pertence a uma organização",
        pendingInvite: pendingInvite
          ? { token: pendingInvite.token, organizationName: pendingInvite.organization.name }
          : null,
      },
      { status: 404 }
    );
  }

  const { organization } = membership;

  return NextResponse.json({
    organization: {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      seatLimit: organization.seatLimit,
      cnpj: organization.cnpj,
      legalName: organization.legalName,
      addressStreet: organization.addressStreet,
      addressNumber: organization.addressNumber,
      addressComplement: organization.addressComplement,
      addressNeighborhood: organization.addressNeighborhood,
      addressCity: organization.addressCity,
      addressState: organization.addressState,
      addressZipCode: organization.addressZipCode,
    },
    members: organization.members.map((m) => ({
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      joinedAt: m.joinedAt,
    })),
    pendingInvites: organization.invites.map((invite) => ({
      id: invite.id,
      email: invite.email,
      createdAt: invite.createdAt,
      expiresAt: invite.expiresAt,
      expired: invite.expiresAt < new Date(),
    })),
    seatsUsed: organization.members.length,
    subscription: organization.subscription
      ? {
          status: organization.subscription.status,
          billingCycle: organization.subscription.billingCycle,
          currentPeriodEnd: organization.subscription.currentPeriodEnd,
        }
      : null,
    myRole: membership.role,
  });
}

const patchSchema = z
  .object({
    cnpj: z.string().optional(),
    legalName: z.string().min(2).max(255).optional(),
    addressStreet: z.string().optional(),
    addressNumber: z.string().optional(),
    addressComplement: z.string().optional(),
    addressNeighborhood: z.string().optional(),
    addressCity: z.string().optional(),
    addressState: z.enum(BRAZILIAN_STATES).optional(),
    addressZipCode: z.string().optional(),
  })
  .refine((data) => !data.cnpj || validateCnpj(data.cnpj), {
    message: "CNPJ inválido",
    path: ["cnpj"],
  })
  .refine((data) => !data.addressZipCode || validateCep(data.addressZipCode), {
    message: "CEP inválido",
    path: ["addressZipCode"],
  });

export async function PATCH(request: NextRequest) {
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

  const ownerCheck = await requireOrgOwner(auth.userId);
  if (ownerCheck instanceof NextResponse) return ownerCheck;

  const {
    cnpj,
    legalName,
    addressStreet,
    addressNumber,
    addressComplement,
    addressNeighborhood,
    addressCity,
    addressState,
    addressZipCode,
  } = parsed.data;

  const updated = await prisma.organization.update({
    where: { id: ownerCheck.organization.id },
    data: {
      ...(cnpj !== undefined && { cnpj }),
      ...(legalName !== undefined && { legalName }),
      ...(addressStreet !== undefined && { addressStreet }),
      ...(addressNumber !== undefined && { addressNumber }),
      ...(addressComplement !== undefined && { addressComplement }),
      ...(addressNeighborhood !== undefined && { addressNeighborhood }),
      ...(addressCity !== undefined && { addressCity }),
      ...(addressState !== undefined && { addressState }),
      ...(addressZipCode !== undefined && { addressZipCode }),
    },
    select: {
      cnpj: true,
      legalName: true,
      addressStreet: true,
      addressNumber: true,
      addressComplement: true,
      addressNeighborhood: true,
      addressCity: true,
      addressState: true,
      addressZipCode: true,
    },
  });

  return NextResponse.json({ organization: updated });
}
