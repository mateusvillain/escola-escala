import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const auth = requireRole(request, ['instructor', 'admin'])
  if (auth instanceof NextResponse) return auth

  const { user } = auth

  const instructor = await prisma.instructor.findUnique({
    where: { userId: user.userId },
    select: { id: true },
  })

  if (!instructor) {
    return NextResponse.json({ data: [] })
  }

  const courses = await prisma.course.findMany({
    where: { instructorId: instructor.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      thumbnailUrl: true,
      status: true,
      enrollments: { select: { completedAt: true } },
    },
  })

  const data = courses.map(course => {
    const enrollmentCount = course.enrollments.length
    const completedCount = course.enrollments.filter(e => e.completedAt !== null).length
    const completionRate = enrollmentCount === 0 ? 0 : Math.round((completedCount / enrollmentCount) * 100)

    return {
      id: course.id,
      title: course.title,
      slug: course.slug,
      thumbnailUrl: course.thumbnailUrl,
      status: course.status,
      enrollmentCount,
      completionRate,
    }
  })

  return NextResponse.json({ data })
}
