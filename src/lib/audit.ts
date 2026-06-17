import { prisma } from '@/lib/prisma'
import type { Prisma } from '@/generated/prisma/client'

interface LogAdminActionParams {
  actorId: string
  action: string
  entityType: string
  entityId: string
  metadata?: Prisma.InputJsonValue
}

export async function logAdminAction({
  actorId,
  action,
  entityType,
  entityId,
  metadata,
}: LogAdminActionParams): Promise<void> {
  try {
    await prisma.adminAuditLog.create({
      data: { actorId, action, entityType, entityId, metadata },
    })
  } catch (error) {
    console.error('Falha ao gravar log de auditoria:', error)
  }
}
