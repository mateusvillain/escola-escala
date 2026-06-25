import { prisma } from '@/lib/prisma'
import { hasActiveOrganizationAccess, hasActiveAccessToOrganization } from '@/lib/access'

/**
 * Cria a matrícula do usuário no curso se ele tiver acesso via assinatura
 * ativa (individual ou de organização). Idempotente — não faz nada se já
 * existir. Não matricula com base em acesso de preview (sem assinatura real
 * ao curso).
 */
export async function ensureEnrollment(userId: string, courseId: string, role?: string): Promise<boolean> {
  const course = await prisma.course.findFirst({
    where: { id: courseId, status: 'published' },
    select: { id: true, planAccess: true, organizationId: true },
  })
  if (!course) return false

  let hasAccess = role === 'admin'
  if (!hasAccess) {
    if (course.organizationId) {
      hasAccess = await hasActiveAccessToOrganization(userId, course.organizationId)
    } else {
      hasAccess = await hasActiveOrganizationAccess(userId)

      if (!hasAccess) {
        const subscription = await prisma.userSubscription.findFirst({
          where: { userId, status: 'active' },
          include: { plan: true },
        })

        const planType = subscription?.plan.type ?? null
        hasAccess = planType === 'premium' || (planType === 'basic' && course.planAccess === 'basic')
      }
    }
  }

  if (!hasAccess) return false

  // update: {} é intencional — nunca sobrescreve um enrollment já existente
  // (ex: criado via compra avulsa), só garante que exista um.
  await prisma.courseEnrollment.upsert({
    where: { userId_courseId: { userId, courseId: course.id } },
    create: { userId, courseId: course.id },
    update: {},
  })

  return true
}
