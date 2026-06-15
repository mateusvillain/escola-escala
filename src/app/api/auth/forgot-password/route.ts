import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

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

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { email } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiry = new Date(Date.now() + 3600000);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: tokenHash, resetTokenExpiry: expiry },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const resetLink = `${appUrl}/redefinir-senha?token=${token}`;

    try {
      await sendPasswordResetEmail(email, resetLink);
    } catch (err) {
      console.error("[forgot-password] Falha ao enviar e-mail:", err);
    }
  }

  return NextResponse.json(
    { message: "Se esse e-mail estiver cadastrado, você receberá um link de redefinição em breve." },
    { status: 200 }
  );
}
