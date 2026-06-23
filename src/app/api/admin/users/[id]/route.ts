import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/audit";

const patchSchema = z.object({
  role: z.enum(["admin", "instructor", "student"]).optional(),
  isActive: z.boolean().optional(),
  freeTrialEligible: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/users/[id]">
) {
  const auth = requireRole(request, ["admin"]);
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      freeTrialEligible: true,
      createdAt: true,
      cpfCnpj: true,
      addressStreet: true,
      addressNumber: true,
      addressComplement: true,
      addressNeighborhood: true,
      addressCity: true,
      addressState: true,
      addressZipCode: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/admin/users/[id]">
) {
  const auth = requireRole(request, ["admin"]);
  if (auth instanceof NextResponse) return auth;

  const { id } = await ctx.params;

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
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

  // Admin cannot change their own role
  if (parsed.data.role !== undefined && id === auth.user.userId) {
    return NextResponse.json(
      { error: "Admin não pode alterar o próprio role" },
      { status: 403 }
    );
  }

  const user = await prisma.user.update({
    where: { id },
    data: parsed.data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      freeTrialEligible: true,
    },
  });

  if (parsed.data.role !== undefined && parsed.data.role !== existing.role) {
    await logAdminAction({
      actorId: auth.user.userId,
      action: "user.role_changed",
      entityType: "User",
      entityId: id,
      metadata: { email: existing.email, from: existing.role, to: parsed.data.role },
    });
  }

  if (parsed.data.isActive !== undefined && parsed.data.isActive !== existing.isActive) {
    await logAdminAction({
      actorId: auth.user.userId,
      action: "user.status_changed",
      entityType: "User",
      entityId: id,
      metadata: { email: existing.email, from: existing.isActive, to: parsed.data.isActive },
    });
  }

  if (
    parsed.data.freeTrialEligible !== undefined &&
    parsed.data.freeTrialEligible !== existing.freeTrialEligible
  ) {
    await logAdminAction({
      actorId: auth.user.userId,
      action: parsed.data.freeTrialEligible ? "user.trial_granted" : "user.trial_revoked",
      entityType: "User",
      entityId: id,
      metadata: { email: existing.email },
    });
  }

  return NextResponse.json({ user });
}
