import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = getAuthUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { id: true, name: true, email: true, role: true, avatarUrl: true, createdAt: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

const patchSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).max(100).optional(),
}).refine(
  (data) => {
    if (data.newPassword) return !!data.currentPassword;
    return true;
  },
  { message: "currentPassword é obrigatório para trocar a senha", path: ["currentPassword"] }
);

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

  const { name, avatarUrl, currentPassword, newPassword } = parsed.data;

  let passwordHash: string | undefined;

  if (newPassword) {
    const userWithHash = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { passwordHash: true },
    });

    if (!userWithHash) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const match = await bcrypt.compare(currentPassword!, userWithHash.passwordHash);
    if (!match) {
      return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 });
    }

    passwordHash = await bcrypt.hash(newPassword, 12);
  }

  const updated = await prisma.user.update({
    where: { id: auth.userId },
    data: {
      ...(name !== undefined && { name }),
      ...(avatarUrl !== undefined && { avatarUrl }),
      ...(passwordHash !== undefined && { passwordHash }),
    },
    select: { id: true, name: true, email: true, role: true, avatarUrl: true, createdAt: true },
  });

  return NextResponse.json({ user: updated });
}
