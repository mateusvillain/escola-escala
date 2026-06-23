import { test, expect } from '@playwright/test'
import { PREMIUM_TEST_USER, E2E_COURSE_SLUG } from './helpers'

test.describe('Conclusão de curso e certificado', () => {
  test('completar todas as aulas gera certificado disponível para download', async ({ page }) => {
    const loginRes = await page.request.post('/api/auth/login', {
      data: { email: PREMIUM_TEST_USER.email, password: PREMIUM_TEST_USER.password },
    })
    expect(loginRes.ok()).toBeTruthy()

    const courseRes = await page.request.get(`/api/courses/${E2E_COURSE_SLUG}`)
    expect(courseRes.ok()).toBeTruthy()
    const course = await courseRes.json()
    const lessons = course.modules.flatMap((m: { lessons: { id: string }[] }) => m.lessons)
    expect(lessons.length).toBeGreaterThan(0)

    for (const lesson of lessons) {
      const res = await page.request.post(`/api/progress/${lesson.id}`, {
        data: { watchPercentage: 100 },
      })
      expect(res.ok()).toBeTruthy()
    }

    // checkCourseCompletion (e a geração do certificado) roda em setImmediate,
    // depois da resposta do último POST — precisa de polling, não está pronto na hora.
    await expect
      .poll(
        async () => {
          const res = await page.request.get('/api/dashboard')
          if (!res.ok()) return null
          const data = await res.json()
          const completed = data.completed.find((c: { id: string }) => c.id === course.id)
          return completed?.certificateUrl ?? null
        },
        { timeout: 20_000, intervals: [500, 1000, 2000] }
      )
      .not.toBeNull()

    await page.goto('/dashboard')
    // Escopado ao card do nosso curso — aluno.premium@test.com pode ter outros
    // cursos concluídos (testes manuais), o que tornaria getByRole ambíguo.
    const courseCard = page.locator('div.bg-white.rounded-xl.border').filter({ hasText: course.title })
    const certificateLink = courseCard.getByRole('link', { name: 'Baixar Certificado' })
    await expect(certificateLink).toBeVisible()
    await expect(certificateLink).toHaveAttribute('href', `/api/certificates/${course.id}/download`)

    const downloadRes = await page.request.get(`/api/certificates/${course.id}/download`)
    expect(downloadRes.ok()).toBeTruthy()
    expect(downloadRes.headers()['content-type']).toBe('application/pdf')
    const body = await downloadRes.body()
    expect(body.byteLength).toBeGreaterThan(0)
  })
})
