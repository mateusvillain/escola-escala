import type { ModuleReleaseType } from '@/generated/prisma/client'

export interface DripModule {
  releaseType: ModuleReleaseType
  releaseDate: Date | null
  releaseAfterDays: number | null
}

export interface DripEnrollment {
  enrolledAt: Date
}

/**
 * Calcula se um módulo já está liberado para o aluno. `enrollment` é a referência
 * temporal para `days_after_enrollment` — sem ela, esse tipo nunca libera.
 */
export function isModuleReleased(module: DripModule, enrollment: DripEnrollment | null): boolean {
  switch (module.releaseType) {
    case 'immediate':
      return true
    case 'fixed_date':
      return module.releaseDate != null && Date.now() >= module.releaseDate.getTime()
    case 'days_after_enrollment':
      if (!enrollment || module.releaseAfterDays == null) return false
      return Date.now() >= enrollment.enrolledAt.getTime() + module.releaseAfterDays * 24 * 60 * 60 * 1000
    default:
      return false
  }
}

const DAY_MS = 24 * 60 * 60 * 1000

function formatReleaseDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })
}

/** Resumo estático da política configurada no módulo (uso admin, sem depender de um aluno específico). */
export function getReleaseSummary(module: DripModule): string {
  switch (module.releaseType) {
    case 'immediate':
      return 'Imediato'
    case 'fixed_date':
      return module.releaseDate ? `A partir de ${formatReleaseDate(module.releaseDate)}` : 'Data não definida'
    case 'days_after_enrollment':
      return module.releaseAfterDays != null
        ? `${module.releaseAfterDays} dia${module.releaseAfterDays !== 1 ? 's' : ''} após matrícula`
        : 'Prazo não definido'
    default:
      return 'Imediato'
  }
}

/** Texto de liberação para um módulo ainda bloqueado, do ponto de vista de um aluno. */
export function getReleaseCountdownLabel(module: DripModule, enrollment: DripEnrollment | null): string {
  if (module.releaseType === 'fixed_date' && module.releaseDate) {
    return `Disponível em ${formatReleaseDate(module.releaseDate)}`
  }

  if (module.releaseType === 'days_after_enrollment' && module.releaseAfterDays != null) {
    if (!enrollment) {
      return `Disponível ${module.releaseAfterDays} dia${module.releaseAfterDays !== 1 ? 's' : ''} após a matrícula`
    }
    const releaseAt = enrollment.enrolledAt.getTime() + module.releaseAfterDays * DAY_MS
    const daysRemaining = Math.max(1, Math.ceil((releaseAt - Date.now()) / DAY_MS))
    return `Disponível em ${daysRemaining} dia${daysRemaining !== 1 ? 's' : ''}`
  }

  return 'Em breve'
}
