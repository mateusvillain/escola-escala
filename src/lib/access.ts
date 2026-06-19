import { prisma } from '@/lib/prisma'

export type AccessReason =
  | 'not_authenticated'
  | 'no_subscription'
  | 'plan_upgrade_required'
  | 'subscription_inactive'
  | 'preview'

export interface AccessResult {
  allowed: boolean
  reason?: AccessReason
  subscriptionStatus?: string
}

/**
 * Verifica se um usuário tem acesso a uma aula específica.
 * Aulas com isPreview=true são liberadas para qualquer usuário, incluindo não autenticados.
 */
export async function checkLessonAccess(
  userId: string | null,
  lessonId: string,
  role?: string
): Promise<AccessResult> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      isPreview: true,
      module: {
        select: {
          courseId: true,
          course: {
            select: { planAccess: true },
          },
        },
      },
    },
  })

  if (!lesson) return { allowed: false }

  // Preview lessons are always accessible — no auth required
  if (lesson.isPreview) return { allowed: true, reason: 'preview' }

  if (role === 'admin') return { allowed: true }

  if (!userId) return { allowed: false, reason: 'not_authenticated' }

  // Compra avulsa: enrollment direto dá acesso ao curso inteiro, independente de assinatura.
  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { userId_courseId: { userId, courseId: lesson.module.courseId } },
    select: { id: true },
  })
  if (enrollment) return { allowed: true }

  const subscription = await prisma.userSubscription.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { plan: true },
  })

  if (!subscription) return { allowed: false, reason: 'no_subscription' }

  if (subscription.status !== 'active' && subscription.status !== 'trialing') {
    return { allowed: false, reason: 'subscription_inactive', subscriptionStatus: subscription.status }
  }

  const planType = subscription.plan.type
  const courseAccess = lesson.module.course.planAccess

  if (planType === 'premium') return { allowed: true }
  if (planType === 'basic' && courseAccess === 'basic') return { allowed: true }

  return { allowed: false, reason: 'plan_upgrade_required' }
}

/**
 * Verifica se um usuário tem acesso a um curso (nível curso, não aula específica).
 * Usado para gates que não são por aula, como tentativas de quiz por módulo.
 */
export async function checkCourseAccess(
  userId: string | null,
  courseId: string,
  role?: string
): Promise<AccessResult> {
  if (role === 'admin') return { allowed: true }
  if (!userId) return { allowed: false, reason: 'not_authenticated' }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { planAccess: true },
  })
  if (!course) return { allowed: false }

  const subscription = await prisma.userSubscription.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { plan: true },
  })

  if (!subscription) return { allowed: false, reason: 'no_subscription' }

  if (subscription.status !== 'active' && subscription.status !== 'trialing') {
    return { allowed: false, reason: 'subscription_inactive', subscriptionStatus: subscription.status }
  }

  const planType = subscription.plan.type

  if (planType === 'premium') return { allowed: true }
  if (planType === 'basic' && course.planAccess === 'basic') return { allowed: true }

  return { allowed: false, reason: 'plan_upgrade_required' }
}
