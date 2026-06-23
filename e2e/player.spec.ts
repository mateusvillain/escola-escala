import { test, expect } from '@playwright/test'
import { PREMIUM_TEST_USER, E2E_COURSE_SLUG } from './helpers'

interface LessonSummary {
  id: string
  title: string
}

async function getLessonIds(page: import('@playwright/test').Page): Promise<LessonSummary[]> {
  const res = await page.request.get(`/api/courses/${E2E_COURSE_SLUG}`)
  expect(res.ok()).toBeTruthy()
  const course = await res.json()
  return course.modules.flatMap((m: { lessons: LessonSummary[] }) => m.lessons)
}

test.describe('Player de aula e progresso', () => {
  test.beforeEach(async ({ page }) => {
    const loginRes = await page.request.post('/api/auth/login', {
      data: { email: PREMIUM_TEST_USER.email, password: PREMIUM_TEST_USER.password },
    })
    expect(loginRes.ok()).toBeTruthy()
  })

  test('player carrega e navegação entre aulas funciona', async ({ page }) => {
    const lessons = await getLessonIds(page)
    expect(lessons.length).toBeGreaterThanOrEqual(2)

    await page.goto(`/cursos/${E2E_COURSE_SLUG}/aulas/${lessons[0].id}`)
    await expect(page.locator('iframe')).toBeVisible()

    await page.getByRole('link', { name: 'Próxima Aula' }).click()
    await expect(page).toHaveURL(new RegExp(`/aulas/${lessons[1].id}$`))
    await expect(page.getByRole('link', { name: 'Aula Anterior' })).toBeVisible()
  })

  test('conclusão automática ao simular 85% de progresso', async ({ page }) => {
    const lessons = await getLessonIds(page)
    const lessonId = lessons[0].id

    const progressRes = await page.request.post(`/api/progress/${lessonId}`, {
      data: { watchPercentage: 85 },
    })
    expect(progressRes.ok()).toBeTruthy()
    expect((await progressRes.json()).isCompleted).toBe(true)

    await page.goto(`/cursos/${E2E_COURSE_SLUG}/aulas/${lessonId}`)

    const sidebarLink = page.locator(`a[href="/cursos/${E2E_COURSE_SLUG}/aulas/${lessonId}"]`).first()
    await expect(sidebarLink.locator('svg.text-green-600')).toBeVisible()
  })
})
