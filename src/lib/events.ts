import { prisma } from '@/lib/prisma'
import type { Prisma } from '@/generated/prisma/client'

/**
 * Fire-and-forget — chame com `void trackEvent(...)`, nunca `await trackEvent(...)`,
 * para não atrasar a resposta da rota/página que instrumenta. Falha ao gravar
 * (erro de banco, etc.) nunca deve propagar para o caller.
 */
export async function trackEvent(
  eventType: string,
  userId: string | null,
  metadata?: Prisma.InputJsonValue
): Promise<void> {
  try {
    await prisma.productEvent.create({
      data: { eventType, userId, metadata },
    })
  } catch (error) {
    console.error(`[events] falha ao registrar evento "${eventType}":`, error)
  }
}
