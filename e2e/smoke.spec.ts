import { test, expect } from '@playwright/test'

test('home carrega e responde com sucesso', async ({ page }) => {
  const response = await page.goto('/')
  expect(response?.ok()).toBeTruthy()
  await expect(page).toHaveTitle(/Create Next App/)
})
