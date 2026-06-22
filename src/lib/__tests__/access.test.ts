import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  lessonFindUnique: vi.fn(),
  enrollmentFindUnique: vi.fn(),
  subscriptionFindFirst: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    lesson: { findUnique: mocks.lessonFindUnique },
    courseEnrollment: { findUnique: mocks.enrollmentFindUnique },
    userSubscription: { findFirst: mocks.subscriptionFindFirst },
  },
}))

const { checkLessonAccess } = await import('../access')

const DAY_MS = 24 * 60 * 60 * 1000

function makeLesson(overrides: {
  isPreview?: boolean
  planAccess?: 'basic' | 'premium'
  releaseType?: 'immediate' | 'fixed_date' | 'days_after_enrollment'
  releaseDate?: Date | null
  releaseAfterDays?: number | null
} = {}) {
  return {
    isPreview: overrides.isPreview ?? false,
    module: {
      courseId: 'course-1',
      releaseType: overrides.releaseType ?? 'immediate',
      releaseDate: overrides.releaseDate ?? null,
      releaseAfterDays: overrides.releaseAfterDays ?? null,
      course: { planAccess: overrides.planAccess ?? 'basic' },
    },
  }
}

function premiumSubscription(status = 'active') {
  return { status, plan: { type: 'premium' } }
}

function basicSubscription(status = 'active') {
  return { status, plan: { type: 'basic' } }
}

beforeEach(() => {
  mocks.lessonFindUnique.mockReset()
  mocks.enrollmentFindUnique.mockReset()
  mocks.subscriptionFindFirst.mockReset()
})

describe('checkLessonAccess', () => {
  it('libera aula isPreview mesmo sem autenticação', async () => {
    mocks.lessonFindUnique.mockResolvedValue(makeLesson({ isPreview: true }))

    const result = await checkLessonAccess(null, 'lesson-1')
    expect(result).toEqual({ allowed: true, reason: 'preview' })
    expect(mocks.enrollmentFindUnique).not.toHaveBeenCalled()
  })

  it('libera aula isPreview mesmo com módulo bloqueado por liberação programada', async () => {
    mocks.lessonFindUnique.mockResolvedValue(
      makeLesson({ isPreview: true, releaseType: 'fixed_date', releaseDate: new Date(Date.now() + DAY_MS) })
    )

    const result = await checkLessonAccess(null, 'lesson-1')
    expect(result).toEqual({ allowed: true, reason: 'preview' })
  })

  it('admin sempre tem acesso, mesmo com módulo bloqueado por liberação programada', async () => {
    mocks.lessonFindUnique.mockResolvedValue(
      makeLesson({ releaseType: 'fixed_date', releaseDate: new Date(Date.now() + DAY_MS) })
    )

    const result = await checkLessonAccess('user-1', 'lesson-1', 'admin')
    expect(result).toEqual({ allowed: true })
    expect(mocks.enrollmentFindUnique).not.toHaveBeenCalled()
  })

  it('bloqueia usuário não autenticado', async () => {
    mocks.lessonFindUnique.mockResolvedValue(makeLesson())

    const result = await checkLessonAccess(null, 'lesson-1')
    expect(result).toEqual({ allowed: false, reason: 'not_authenticated' })
  })

  it('bloqueia quando não há assinatura nem enrollment', async () => {
    mocks.lessonFindUnique.mockResolvedValue(makeLesson())
    mocks.enrollmentFindUnique.mockResolvedValue(null)
    mocks.subscriptionFindFirst.mockResolvedValue(null)

    const result = await checkLessonAccess('user-1', 'lesson-1')
    expect(result).toEqual({ allowed: false, reason: 'no_subscription' })
  })

  it('bloqueia quando assinatura está past_due', async () => {
    mocks.lessonFindUnique.mockResolvedValue(makeLesson())
    mocks.enrollmentFindUnique.mockResolvedValue(null)
    mocks.subscriptionFindFirst.mockResolvedValue(premiumSubscription('past_due'))

    const result = await checkLessonAccess('user-1', 'lesson-1')
    expect(result).toEqual({ allowed: false, reason: 'subscription_inactive', subscriptionStatus: 'past_due' })
  })

  it('bloqueia plano basic em curso premium', async () => {
    mocks.lessonFindUnique.mockResolvedValue(makeLesson({ planAccess: 'premium' }))
    mocks.enrollmentFindUnique.mockResolvedValue(null)
    mocks.subscriptionFindFirst.mockResolvedValue(basicSubscription())

    const result = await checkLessonAccess('user-1', 'lesson-1')
    expect(result).toEqual({ allowed: false, reason: 'plan_upgrade_required' })
  })

  it('libera plano premium em qualquer curso, módulo immediate', async () => {
    mocks.lessonFindUnique.mockResolvedValue(makeLesson({ planAccess: 'premium' }))
    mocks.enrollmentFindUnique.mockResolvedValue(null)
    mocks.subscriptionFindFirst.mockResolvedValue(premiumSubscription())

    const result = await checkLessonAccess('user-1', 'lesson-1')
    expect(result).toEqual({ allowed: true })
  })

  it('compra avulsa (enrollment direto) libera mesmo sem assinatura', async () => {
    mocks.lessonFindUnique.mockResolvedValue(makeLesson({ planAccess: 'premium' }))
    mocks.enrollmentFindUnique.mockResolvedValue({ enrolledAt: new Date(Date.now() - 10 * DAY_MS) })

    const result = await checkLessonAccess('user-1', 'lesson-1')
    expect(result).toEqual({ allowed: true })
    expect(mocks.subscriptionFindFirst).not.toHaveBeenCalled()
  })

  describe('liberação programada (fixed_date)', () => {
    it('bloqueia quando a data de liberação está no futuro', async () => {
      mocks.lessonFindUnique.mockResolvedValue(
        makeLesson({ releaseType: 'fixed_date', releaseDate: new Date(Date.now() + DAY_MS) })
      )
      mocks.enrollmentFindUnique.mockResolvedValue(null)
      mocks.subscriptionFindFirst.mockResolvedValue(premiumSubscription())

      const result = await checkLessonAccess('user-1', 'lesson-1')
      expect(result).toEqual({ allowed: false, reason: 'module_not_released' })
    })

    it('libera quando a data de liberação já passou', async () => {
      mocks.lessonFindUnique.mockResolvedValue(
        makeLesson({ releaseType: 'fixed_date', releaseDate: new Date(Date.now() - DAY_MS) })
      )
      mocks.enrollmentFindUnique.mockResolvedValue(null)
      mocks.subscriptionFindFirst.mockResolvedValue(premiumSubscription())

      const result = await checkLessonAccess('user-1', 'lesson-1')
      expect(result).toEqual({ allowed: true })
    })
  })

  describe('liberação programada (days_after_enrollment)', () => {
    it('bloqueia antes do prazo, mesmo com assinatura ativa que cobre o curso', async () => {
      mocks.lessonFindUnique.mockResolvedValue(
        makeLesson({ planAccess: 'basic', releaseType: 'days_after_enrollment', releaseAfterDays: 5 })
      )
      // enrollment existe (criado ao acessar o curso antes), mas matriculado há só 3 dias
      mocks.enrollmentFindUnique.mockResolvedValue({ enrolledAt: new Date(Date.now() - 3 * DAY_MS) })

      const result = await checkLessonAccess('user-1', 'lesson-1')
      expect(result).toEqual({ allowed: false, reason: 'module_not_released' })
      // enrollment não-nulo já basta pra pular a checagem de assinatura (mesmo padrão de compra avulsa)
      expect(mocks.subscriptionFindFirst).not.toHaveBeenCalled()
    })

    it('libera depois do prazo', async () => {
      mocks.lessonFindUnique.mockResolvedValue(
        makeLesson({ planAccess: 'basic', releaseType: 'days_after_enrollment', releaseAfterDays: 5 })
      )
      mocks.enrollmentFindUnique.mockResolvedValue({ enrolledAt: new Date(Date.now() - 6 * DAY_MS) })

      const result = await checkLessonAccess('user-1', 'lesson-1')
      expect(result).toEqual({ allowed: true })
    })

    it('bloqueia quando não há enrollment e a assinatura nunca matriculou o aluno (sem referência temporal)', async () => {
      mocks.lessonFindUnique.mockResolvedValue(
        makeLesson({ planAccess: 'premium', releaseType: 'days_after_enrollment', releaseAfterDays: 5 })
      )
      mocks.enrollmentFindUnique.mockResolvedValue(null)
      mocks.subscriptionFindFirst.mockResolvedValue(premiumSubscription())

      const result = await checkLessonAccess('user-1', 'lesson-1')
      expect(result).toEqual({ allowed: false, reason: 'module_not_released' })
    })
  })
})
