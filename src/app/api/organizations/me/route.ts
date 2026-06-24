import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
          subscription: true,
        },
      },
    },
  });

  if (!membership) {
    return NextResponse.json({ error: "Usuário não pertence a uma organização" }, { status: 404 });
  }

  const { organization } = membership;

  return NextResponse.json({
    organization: {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      seatLimit: organization.seatLimit,
    },
    members: organization.members.map((m) => ({
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      joinedAt: m.joinedAt,
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
