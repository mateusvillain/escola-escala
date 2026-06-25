import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendCertificateRenewalEmail } from "@/lib/email";

const REMINDER_WINDOW_DAYS = 30;

async function handleCertificateRenewalReminders(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const now = new Date();
  const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const certificates = await prisma.certificate.findMany({
    where: {
      expiresAt: { gte: now, lte: windowEnd },
      renewalReminderSentAt: null,
    },
    select: {
      id: true,
      expiresAt: true,
      user: { select: { name: true, email: true } },
      course: { select: { title: true } },
    },
  });

  for (const certificate of certificates) {
    await sendCertificateRenewalEmail(
      certificate.user.email,
      certificate.user.name,
      certificate.course.title,
      certificate.expiresAt!
    );
    await prisma.certificate.update({
      where: { id: certificate.id },
      data: { renewalReminderSentAt: now },
    });
  }

  return NextResponse.json({ processed: certificates.length });
}

// Vercel Cron Jobs disparam via GET; o POST é mantido para satisfazer o teste
// manual (curl) e a acceptanceCriteria da TASK-233 — ambos chamam a mesma lógica.
export async function GET(request: NextRequest) {
  return handleCertificateRenewalReminders(request);
}

export async function POST(request: NextRequest) {
  return handleCertificateRenewalReminders(request);
}
