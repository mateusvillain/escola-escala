import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { detectDocumentType, validateCpf, validateCnpj } from "@/lib/utils/document";
import { validateCep } from "@/lib/viacep";
import { BRAZILIAN_STATES } from "@/lib/brazilian-states";

const fiscalSelect = {
  cpfCnpj: true,
  addressStreet: true,
  addressNumber: true,
  addressComplement: true,
  addressNeighborhood: true,
  addressCity: true,
  addressState: true,
  addressZipCode: true,
} as const;

export async function GET(request: NextRequest) {
  const auth = getAuthUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      createdAt: true,
      ...fiscalSelect,
    },
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
  cpfCnpj: z.string().optional(),
  addressStreet: z.string().optional(),
  addressNumber: z.string().optional(),
  addressComplement: z.string().optional(),
  addressNeighborhood: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.enum(BRAZILIAN_STATES).optional(),
  addressZipCode: z.string().optional(),
}).refine(
  (data) => {
    if (data.newPassword) return !!data.currentPassword;
    return true;
  },
  { message: "currentPassword é obrigatório para trocar a senha", path: ["currentPassword"] }
).refine(
  (data) => {
    if (!data.cpfCnpj) return true;
    const type = detectDocumentType(data.cpfCnpj);
    if (type === "cpf") return validateCpf(data.cpfCnpj);
    if (type === "cnpj") return validateCnpj(data.cpfCnpj);
    return false;
  },
  { message: "CPF/CNPJ inválido", path: ["cpfCnpj"] }
).refine(
  (data) => {
    if (!data.addressZipCode) return true;
    return validateCep(data.addressZipCode);
  },
  { message: "CEP inválido", path: ["addressZipCode"] }
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

  const {
    name,
    avatarUrl,
    currentPassword,
    newPassword,
    cpfCnpj,
    addressStreet,
    addressNumber,
    addressComplement,
    addressNeighborhood,
    addressCity,
    addressState,
    addressZipCode,
  } = parsed.data;

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
      ...(cpfCnpj !== undefined && { cpfCnpj }),
      ...(addressStreet !== undefined && { addressStreet }),
      ...(addressNumber !== undefined && { addressNumber }),
      ...(addressComplement !== undefined && { addressComplement }),
      ...(addressNeighborhood !== undefined && { addressNeighborhood }),
      ...(addressCity !== undefined && { addressCity }),
      ...(addressState !== undefined && { addressState }),
      ...(addressZipCode !== undefined && { addressZipCode }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      createdAt: true,
      ...fiscalSelect,
    },
  });

  return NextResponse.json({ user: updated });
}
