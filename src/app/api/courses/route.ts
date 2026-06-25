import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasActiveOrganizationAccess } from '@/lib/access'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const planAccess = searchParams.get('planAccess') ?? undefined
  const search = searchParams.get('search') ?? undefined

  const courses = await prisma.course.findMany({
    where: {
      status: 'published',
      ...(planAccess ? { planAccess: planAccess as 'basic' | 'premium' } : {}),
      ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
    },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      thumbnailUrl: true,
      planAccess: true,
      instructor: {
        select: {
          user: {
            select: {
              name: true,
              avatarUrl: true,
            },
          },
        },
      },
      _count: {
        select: { modules: true },
      },
      modules: {
        select: {
          _count: { select: { lessons: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const user = getAuthUser(request)

  let userPlanType: 'basic' | 'premium' | null = null
  let orgAccess = false
  if (user && user.role !== 'admin') {
    orgAccess = await hasActiveOrganizationAccess(user.userId)
    const subscription = await prisma.userSubscription.findFirst({
      where: { userId: user.userId, status: { in: ['active', 'trialing'] } },
      include: { plan: true },
    })
    if (subscription) {
      userPlanType = subscription.plan.type
    }
  }

  const data = courses.map(course => {
    const totalLessons = course.modules.reduce((sum, m) => sum + m._count.lessons, 0)

    let hasAccess: boolean | undefined
    if (user !== null) {
      if (user.role === 'admin' || orgAccess || userPlanType === 'premium') {
        hasAccess = true
      } else if (userPlanType === 'basic') {
        hasAccess = course.planAccess === 'basic'
      } else {
        hasAccess = false
      }
    }

    return {
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      thumbnailUrl: course.thumbnailUrl,
      planAccess: course.planAccess,
      instructor: {
        name: course.instructor.user.name,
        avatarUrl: course.instructor.user.avatarUrl,
      },
      _count: {
        modules: course._count.modules,
        lessons: totalLessons,
      },
      ...(user !== null ? { hasAccess } : {}),
    }
  })

  return NextResponse.json({ data })
}
