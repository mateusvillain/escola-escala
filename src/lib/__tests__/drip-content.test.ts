import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { isModuleReleased, getReleaseSummary, getReleaseCountdownLabel, type DripModule } from '../drip-content'

const NOW = new Date('2026-06-22T12:00:00.000Z')

describe('isModuleReleased', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('immediate', () => {
    it('está sempre liberado, mesmo sem enrollment', () => {
      const module: DripModule = { releaseType: 'immediate', releaseDate: null, releaseAfterDays: null }
      expect(isModuleReleased(module, null)).toBe(true)
    })
  })

  describe('fixed_date', () => {
    it('bloqueado quando a data de liberação está no futuro', () => {
      const module: DripModule = {
        releaseType: 'fixed_date',
        releaseDate: new Date(NOW.getTime() + 1000),
        releaseAfterDays: null,
      }
      expect(isModuleReleased(module, null)).toBe(false)
    })

    it('liberado quando a data de liberação já passou', () => {
      const module: DripModule = {
        releaseType: 'fixed_date',
        releaseDate: new Date(NOW.getTime() - 1000),
        releaseAfterDays: null,
      }
      expect(isModuleReleased(module, null)).toBe(true)
    })

    it('liberado na borda exata (now === releaseDate)', () => {
      const module: DripModule = {
        releaseType: 'fixed_date',
        releaseDate: new Date(NOW.getTime()),
        releaseAfterDays: null,
      }
      expect(isModuleReleased(module, null)).toBe(true)
    })

    it('bloqueado quando releaseDate é null', () => {
      const module: DripModule = { releaseType: 'fixed_date', releaseDate: null, releaseAfterDays: null }
      expect(isModuleReleased(module, null)).toBe(false)
    })
  })

  describe('days_after_enrollment', () => {
    it('bloqueado quando não há enrollment (sem referência temporal)', () => {
      const module: DripModule = {
        releaseType: 'days_after_enrollment',
        releaseDate: null,
        releaseAfterDays: 5,
      }
      expect(isModuleReleased(module, null)).toBe(false)
    })

    it('bloqueado antes do prazo (matriculado há 3 dias, libera em 5)', () => {
      const module: DripModule = {
        releaseType: 'days_after_enrollment',
        releaseDate: null,
        releaseAfterDays: 5,
      }
      const enrollment = { enrolledAt: new Date(NOW.getTime() - 3 * 24 * 60 * 60 * 1000) }
      expect(isModuleReleased(module, enrollment)).toBe(false)
    })

    it('liberado depois do prazo (matriculado há 6 dias, libera em 5)', () => {
      const module: DripModule = {
        releaseType: 'days_after_enrollment',
        releaseDate: null,
        releaseAfterDays: 5,
      }
      const enrollment = { enrolledAt: new Date(NOW.getTime() - 6 * 24 * 60 * 60 * 1000) }
      expect(isModuleReleased(module, enrollment)).toBe(true)
    })

    it('liberado na borda exata (now === enrolledAt + releaseAfterDays)', () => {
      const module: DripModule = {
        releaseType: 'days_after_enrollment',
        releaseDate: null,
        releaseAfterDays: 5,
      }
      const enrollment = { enrolledAt: new Date(NOW.getTime() - 5 * 24 * 60 * 60 * 1000) }
      expect(isModuleReleased(module, enrollment)).toBe(true)
    })

    it('bloqueado quando releaseAfterDays é null', () => {
      const module: DripModule = {
        releaseType: 'days_after_enrollment',
        releaseDate: null,
        releaseAfterDays: null,
      }
      const enrollment = { enrolledAt: new Date(NOW.getTime() - 100 * 24 * 60 * 60 * 1000) }
      expect(isModuleReleased(module, enrollment)).toBe(false)
    })
  })
})

describe('getReleaseSummary', () => {
  it('immediate', () => {
    const module: DripModule = { releaseType: 'immediate', releaseDate: null, releaseAfterDays: null }
    expect(getReleaseSummary(module)).toBe('Imediato')
  })

  it('fixed_date', () => {
    const module: DripModule = {
      releaseType: 'fixed_date',
      releaseDate: new Date('2026-08-12T00:00:00.000Z'),
      releaseAfterDays: null,
    }
    expect(getReleaseSummary(module)).toBe('A partir de 12/08')
  })

  it('days_after_enrollment', () => {
    const module: DripModule = { releaseType: 'days_after_enrollment', releaseDate: null, releaseAfterDays: 5 }
    expect(getReleaseSummary(module)).toBe('5 dias após matrícula')
  })

  it('days_after_enrollment com 1 dia (singular)', () => {
    const module: DripModule = { releaseType: 'days_after_enrollment', releaseDate: null, releaseAfterDays: 1 }
    expect(getReleaseSummary(module)).toBe('1 dia após matrícula')
  })
})

describe('getReleaseCountdownLabel', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('fixed_date mostra a data exata', () => {
    const module: DripModule = {
      releaseType: 'fixed_date',
      releaseDate: new Date('2026-08-12T00:00:00.000Z'),
      releaseAfterDays: null,
    }
    expect(getReleaseCountdownLabel(module, null)).toBe('Disponível em 12/08')
  })

  it('days_after_enrollment mostra a contagem de dias restantes com enrollment', () => {
    const module: DripModule = { releaseType: 'days_after_enrollment', releaseDate: null, releaseAfterDays: 5 }
    const enrollment = { enrolledAt: new Date(NOW.getTime() - 2 * 24 * 60 * 60 * 1000) }
    expect(getReleaseCountdownLabel(module, enrollment)).toBe('Disponível em 3 dias')
  })

  it('days_after_enrollment sem enrollment cai no fallback estático', () => {
    const module: DripModule = { releaseType: 'days_after_enrollment', releaseDate: null, releaseAfterDays: 5 }
    expect(getReleaseCountdownLabel(module, null)).toBe('Disponível 5 dias após a matrícula')
  })
})
