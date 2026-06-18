import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toCsv, csvResponseHeaders } from "@/lib/csv";

const STATUS_LABELS: Record<string, string> = {
  active: "Ativo",
  past_due: "Pagamento pendente",
  canceled: "Cancelado",
  trialing: "Trial",
};

const BILLING_LABELS: Record<string, string> = {
  monthly: "Mensal",
  annual: "Anual",
};

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ["admin"]);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status") ?? undefined;
  const planType = searchParams.get("planType") ?? undefined;

  const where = {
    ...(status
      ? { status: status as "active" | "past_due" | "canceled" | "trialing" }
      : {}),
    ...(planType
      ? { plan: { type: planType as "basic" | "premium" } }
      : {}),
  };

  const subscriptions = await prisma.userSubscription.findMany({
    where,
    include: {
      user: { select: { email: true } },
      plan: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = subscriptions.map(s => [
    s.user.email,
    s.plan.name,
    BILLING_LABELS[s.billingCycle] ?? s.billingCycle,
    STATUS_LABELS[s.status] ?? s.status,
    s.currentPeriodStart.toISOString(),
    s.currentPeriodEnd.toISOString(),
  ]);

  const csv = toCsv(
    ["E-mail do aluno", "Plano", "Ciclo", "Status", "Início do período", "Fim do período"],
    rows
  );

  return new NextResponse(csv, {
    status: 200,
    headers: csvResponseHeaders("assinaturas.csv"),
  });
}
