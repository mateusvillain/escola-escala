import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ["admin"]);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status") ?? undefined;
  const planType = searchParams.get("planType") ?? undefined;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const skip = (page - 1) * limit;

  const where = {
    ...(status
      ? { status: status as "active" | "past_due" | "canceled" | "trialing" }
      : {}),
    ...(planType
      ? { plan: { type: planType as "basic" | "premium" } }
      : {}),
  };

  const [subscriptions, total] = await Promise.all([
    prisma.userSubscription.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        plan: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.userSubscription.count({ where }),
  ]);

  const data = subscriptions.map((s) => ({
    id: s.id,
    stripeSubscriptionId: s.stripeSubscriptionId,
    status: s.status,
    billingCycle: s.billingCycle,
    currentPeriodEnd: s.currentPeriodEnd,
    createdAt: s.createdAt,
    user: s.user,
    plan: {
      name: s.plan.name,
      type: s.plan.type,
    },
  }));

  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
