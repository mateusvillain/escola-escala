import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['admin'])
  if (auth instanceof NextResponse) return auth

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [
    totalStudents,
    activeSubscriptions,
    basicSubscriptions,
    premiumSubscriptions,
    publishedCourses,
    newStudentsLast30Days,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'student' } }),
    prisma.userSubscription.count({ where: { status: 'active' } }),
    prisma.userSubscription.count({ where: { status: 'active', plan: { type: 'basic' } } }),
    prisma.userSubscription.count({ where: { status: 'active', plan: { type: 'premium' } } }),
    prisma.course.count({ where: { status: 'published' } }),
    prisma.user.count({ where: { role: 'student', createdAt: { gte: thirtyDaysAgo } } }),
  ])

  return NextResponse.json({
    totalStudents,
    activeSubscriptions,
    basicSubscriptions,
    premiumSubscriptions,
    publishedCourses,
    newStudentsLast30Days,
  })
}
