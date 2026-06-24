import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUniqueOrganizationSlug } from "@/lib/utils/slug";

const postSchema = z.object({
  name: z.string().min(2).max(255),
});

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

  const existingMembership = await prisma.organizationMember.findUnique({
    where: { userId: auth.userId },
  });
  if (existingMembership) {
    return NextResponse.json(
      { error: "Usuário já pertence a uma organização" },
      { status: 409 }
    );
  }

  const slug = await getUniqueOrganizationSlug(parsed.data.name, prisma);

  const organization = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: { name: parsed.data.name, slug },
    });
    await tx.organizationMember.create({
      data: { organizationId: org.id, userId: auth.userId, role: "owner" },
    });
    return org;
  });

  return NextResponse.json({ organization }, { status: 201 });
}
