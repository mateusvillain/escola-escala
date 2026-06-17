import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function parseDateParam(value: string | null): Date | undefined {
  if (!value) return undefined
  const date = new Date(value)
  return isNaN(date.getTime()) ? undefined : date
}

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['admin'])
  if (auth instanceof NextResponse) return auth

  const { searchParams } = request.nextUrl
  const action = searchParams.get('action') ?? undefined
  const startDate = parseDateParam(searchParams.get('startDate'))
  const endDate = parseDateParam(searchParams.get('endDate'))
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))
  const skip = (page - 1) * limit

  const where = {
    ...(action ? { action } : {}),
    ...(startDate || endDate
      ? {
          createdAt: {
            ...(startDate ? { gte: startDate } : {}),
            ...(endDate ? { lte: new Date(endDate.getTime() + 24 * 60 * 60 * 1000 - 1) } : {}),
          },
        }
      : {}),
  }

  const [data, total] = await Promise.all([
    prisma.adminAuditLog.findMany({
      where,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        metadata: true,
        createdAt: true,
        actor: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.adminAuditLog.count({ where }),
  ])

  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}
