import { prisma } from '@/lib/prisma'

export async function hasReviewActivity(userId: string): Promise<boolean> {
  const count = await prisma.courseEnrollment.count({
    where: { userId, completedAt: { not: null } },
  })
  return count > 0
}
