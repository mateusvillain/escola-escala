import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30

function toNumber(value: number | { toNumber(): number }): number {
  return typeof value === 'number' ? value : value.toNumber()
}

function monthlyValue(billingCycle: 'monthly' | 'annual', plan: { priceMonthly: number | { toNumber(): number }; priceAnnual: number | { toNumber(): number } }): number {
  return billingCycle === 'monthly' ? toNumber(plan.priceMonthly) : toNumber(plan.priceAnnual) / 12
}

function computeLtvByPlan(
  canceledSubs: Array<{
    createdAt: Date
    updatedAt: Date
    billingCycle: 'monthly' | 'annual'
    plan: { type: 'basic' | 'premium'; priceMonthly: number | { toNumber(): number }; priceAnnual: number | { toNumber(): number } }
  }>,
): { basic: number; premium: number } {
  const result = { basic: 0, premium: 0 }

  for (const planType of ['basic', 'premium'] as const) {
    const group = canceledSubs.filter(sub => sub.plan.type === planType)
    if (group.length === 0) continue

    const avgDurationMonths =
      group.reduce((sum, sub) => sum + (sub.updatedAt.getTime() - sub.createdAt.getTime()), 0) / group.length / MS_PER_MONTH

    const avgMonthlyValue =
      group.reduce((sum, sub) => sum + monthlyValue(sub.billingCycle, sub.plan), 0) / group.length

    result[planType] = Math.round(avgDurationMonths * avgMonthlyValue * 100) / 100
  }

  return result
}

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['admin'])
  if (auth instanceof NextResponse) return auth

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalStudents,
    activeSubscriptions,
    basicSubscriptions,
    premiumSubscriptions,
    publishedCourses,
    newStudentsLast30Days,
    activeSubsWithPlan,
    canceledThisMonth,
    activeAtStartOfMonth,
    canceledSubsWithPlan,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'student' } }),
    prisma.userSubscription.count({ where: { status: 'active' } }),
    prisma.userSubscription.count({ where: { status: 'active', plan: { type: 'basic' } } }),
    prisma.userSubscription.count({ where: { status: 'active', plan: { type: 'premium' } } }),
    prisma.course.count({ where: { status: 'published' } }),
    prisma.user.count({ where: { role: 'student', createdAt: { gte: thirtyDaysAgo } } }),
    prisma.userSubscription.findMany({
      where: { status: 'active' },
      select: { billingCycle: true, plan: { select: { priceMonthly: true, priceAnnual: true } } },
    }),
    prisma.userSubscription.count({
      where: { status: 'canceled', updatedAt: { gte: startOfMonth } },
    }),
    prisma.userSubscription.count({
      where: {
        createdAt: { lt: startOfMonth },
        OR: [{ status: { not: 'canceled' } }, { status: 'canceled', updatedAt: { gte: startOfMonth } }],
      },
    }),
    prisma.userSubscription.findMany({
      where: { status: 'canceled' },
      select: {
        createdAt: true,
        updatedAt: true,
        billingCycle: true,
        plan: { select: { type: true, priceMonthly: true, priceAnnual: true } },
      },
    }),
  ])

  const mrr = Math.round(activeSubsWithPlan.reduce((sum, sub) => sum + monthlyValue(sub.billingCycle, sub.plan), 0) * 100) / 100

  const churnRate = activeAtStartOfMonth === 0 ? 0 : Math.round((canceledThisMonth / activeAtStartOfMonth) * 100 * 100) / 100

  const ltvByPlan = computeLtvByPlan(canceledSubsWithPlan)

  return NextResponse.json({
    totalStudents,
    activeSubscriptions,
    basicSubscriptions,
    premiumSubscriptions,
    publishedCourses,
    newStudentsLast30Days,
    mrr,
    churnRate,
    ltvByPlan,
  })
}
