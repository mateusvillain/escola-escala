import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/jwt";
import { registerSchema } from "@/lib/schemas/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const { limited, retryAfter } = rateLimit(getClientIp(request), { limit: 10, windowMs: 60_000 });
  if (limited) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente em 1 minuto." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "E-mail já cadastrado" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { name, email, passwordHash },
    select: { id: true, name: true, email: true, role: true },
  });

  const token = signToken({ userId: user.id, name: user.name, email: user.email, role: user.role });

  const response = NextResponse.json({ user }, { status: 201 });
  response.cookies.set("auth-token", token, {
    httpOnly: true,
    // 'lax' (não 'strict'): o redirect de retorno do Stripe Checkout hospedado
    // (checkout.stripe.com -> /dashboard?checkout=success) é uma navegação de
    // topo cross-site — 'strict' bloqueia o cookie nesse caso e desloga o aluno
    // que acabou de pagar. 'lax' ainda bloqueia em requisições de mutação
    // cross-site (POST/PATCH/DELETE), preservando a proteção contra CSRF.
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return response;
}
