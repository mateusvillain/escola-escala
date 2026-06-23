import { test, expect } from '@playwright/test'
import { uniqueTestEmail, TEST_PASSWORD } from './helpers'

// Este spec exige `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
// rodando localmente durante a execução — sem o webhook, o pagamento é confirmado
// no Stripe mas a UserSubscription nunca é criada/ativada no banco, e o polling
// abaixo expira por timeout. Ver docs/wiki/testes-e2e.md para o passo a passo.
test.describe('Checkout de assinatura', () => {
  test('assinar plano via Stripe Checkout ativa a assinatura', async ({ page }) => {
    test.skip(
      !process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_'),
      'Requer STRIPE_SECRET_KEY de modo teste configurada em .env.local'
    )

    const email = uniqueTestEmail('checkout')

    const registerRes = await page.request.post('/api/auth/register', {
      data: { name: 'Aluno E2E Checkout', email, password: TEST_PASSWORD },
    })
    expect(registerRes.ok()).toBeTruthy()

    await page.goto('/planos')

    await Promise.all([
      page.waitForURL(/checkout\.stripe\.com/, { timeout: 30_000 }),
      page.getByRole('button', { name: 'Assinar Premium' }).click(),
    ])

    // Campos do Stripe Checkout hospedado — IDs estáveis da página de pagamento.
    await page.locator('#cardNumber').fill('4242424242424242')
    await page.locator('#cardExpiry').fill('12/34')
    await page.locator('#cardCvc').fill('123')

    const billingName = page.locator('#billingName')
    if (await billingName.isVisible().catch(() => false)) {
      await billingName.fill('Aluno E2E Checkout')
    }

    const submitButton = page.getByTestId('hosted-payment-submit-button')
    if (await submitButton.isVisible().catch(() => false)) {
      await submitButton.click()
    } else {
      await page.locator('button[type="submit"]').first().click()
    }

    await page.waitForURL(/\/dashboard\?checkout=success/, { timeout: 30_000 })

    // O webhook do Stripe confirma a assinatura de forma assíncrona — espera com
    // timeout em vez de assumir que já processou no momento do redirect.
    await expect
      .poll(
        async () => {
          const res = await page.request.get('/api/dashboard')
          if (!res.ok()) return 0
          const data = await res.json()
          return data.available.length
        },
        { timeout: 30_000, intervals: [1000, 2000, 3000] }
      )
      .toBeGreaterThan(0)
  })
})
