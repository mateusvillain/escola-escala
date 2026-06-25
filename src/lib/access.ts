import { prisma } from '@/lib/prisma'
import { isModuleReleased } from '@/lib/drip-content'

/**
 * Membro de organização com OrganizationSubscription ativa/trialing equivale a
 * assinante premium individual — uma única consulta com include aninhado, sem
 * round-trip adicional (chamada em todo acesso a aula/curso).
 */
export async function hasActiveOrganizationAccess(userId: string): Promise<boolean> {
  const membership = await prisma.organizationMember.findUnique({
    where: { userId },
    include: { organization: { include: { subscription: true } } },
  })
  const status = membership?.organization.subscription?.status
  return status === 'active' || status === 'trialing'
}

export type AccessReason =
  | 'not_authenticated'
  | 'no_subscription'
  | 'plan_upgrade_required'
  | 'subscription_inactive'
  | 'preview'
  | 'module_not_released'

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
          releaseType: true,
          releaseDate: true,
          releaseAfterDays: true,
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
    select: { enrolledAt: true },
  })

  let coursePlanAllowed = enrollment !== null

  if (!coursePlanAllowed) {
    coursePlanAllowed = await hasActiveOrganizationAccess(userId)
  }

  if (!coursePlanAllowed) {
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

    coursePlanAllowed = planType === 'premium' || (planType === 'basic' && courseAccess === 'basic')

    if (!coursePlanAllowed) return { allowed: false, reason: 'plan_upgrade_required' }
  }

  // Liberação programada (drip content) é uma camada adicional sobre o acesso por
  // plano/compra — nunca um substituto. Avaliada só depois de confirmar o acesso ao curso.
  if (!isModuleReleased(lesson.module, enrollment)) {
    return { allowed: false, reason: 'module_not_released' }
  }

  return { allowed: true }
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

  if (await hasActiveOrganizationAccess(userId)) return { allowed: true }

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
