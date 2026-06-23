export function uniqueTestEmail(prefix = 'teste'): string {
  return `${prefix}+${Date.now()}@example.com`
}

export const TEST_PASSWORD = 'Teste@12345'

// Usuário premium fixo criado por prisma/seed.ts (seedSubscriber) — usado pelos
// specs de player e certificado, que dependem de assinatura ativa pré-existente.
export const PREMIUM_TEST_USER = {
  email: 'aluno.premium@test.com',
  password: 'Test@12345',
}

// Curso fixo criado por prisma/seed.ts (seedE2ECourse) — mantido em sincronia
// com E2E_COURSE_SLUG / E2E_LESSON_TITLES nesse arquivo.
export const E2E_COURSE_SLUG = 'curso-e2e-playwright'
export const E2E_LESSON_TITLES = ['Aula 1', 'Aula 2', 'Aula 3']
