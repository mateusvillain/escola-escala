import { NextResponse } from "next/server";
import type { Organization } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export async function isOrganizationMember(userId: string): Promise<boolean> {
  const membership = await prisma.organizationMember.findUnique({
    where: { userId },
    select: { userId: true },
  });
  return !!membership;
}

export async function requireOrgOwner(
  userId: string
): Promise<{ organization: Organization } | NextResponse> {
  const membership = await prisma.organizationMember.findUnique({
    where: { userId },
    include: { organization: true },
  });

  if (!membership || membership.role !== "owner") {
    return NextResponse.json(
      { error: "Apenas o owner da organização pode realizar esta ação" },
      { status: 403 }
    );
  }

  return { organization: membership.organization };
}
