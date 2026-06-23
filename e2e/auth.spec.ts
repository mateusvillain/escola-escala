import { test, expect } from '@playwright/test'
import { uniqueTestEmail, TEST_PASSWORD } from './helpers'

test.describe('Cadastro e login', () => {
  test('cadastro de novo aluno redireciona para o dashboard', async ({ page }) => {
    const email = uniqueTestEmail('cadastro')

    await page.goto('/cadastro')
    await page.locator('lui-input[name="name"] input').fill('Aluno E2E')
    await page.locator('lui-input[name="email"] input').fill(email)
    await page.locator('lui-input[name="password"] input').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: 'Continuar' }).click()

    // Sem plano pré-selecionado na query string, o cadastro abre a etapa 2
    // (escolha de plano) antes do dashboard — "Continuar grátis" segue sem assinatura.
    await expect(page.getByText('Sua conta foi criada')).toBeVisible()
    await page.getByRole('button', { name: 'Continuar grátis' }).click()

    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('login com credenciais recém-criadas redireciona para o dashboard', async ({ page }) => {
    const email = uniqueTestEmail('login')

    // Conta criada via API (setup) — o que este teste cobre é o LOGIN, não o cadastro.
    const registerRes = await page.request.post('/api/auth/register', {
      data: { name: 'Aluno E2E Login', email, password: TEST_PASSWORD },
    })
    expect(registerRes.ok()).toBeTruthy()
    await page.request.post('/api/auth/logout')

    await page.goto('/login')
    await page.locator('lui-input[name="email"] input').fill(email)
    await page.locator('lui-input[name="password"] input').fill(TEST_PASSWORD)
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('login com senha incorreta exibe erro e permanece em /login', async ({ page }) => {
    const email = uniqueTestEmail('senha-errada')

    const registerRes = await page.request.post('/api/auth/register', {
      data: { name: 'Aluno E2E Senha Errada', email, password: TEST_PASSWORD },
    })
    expect(registerRes.ok()).toBeTruthy()
    await page.request.post('/api/auth/logout')

    await page.goto('/login')
    await page.locator('lui-input[name="email"] input').fill(email)
    await page.locator('lui-input[name="password"] input').fill('SenhaErrada123')
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page.getByText('E-mail ou senha incorretos')).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })
})
