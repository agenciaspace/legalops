import { expect, test } from '@playwright/test'

test('News home, audience sections and sourced articles work across viewport sizes', async ({ page }) => {
  await page.goto('/news')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('trabalho jurídico')
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  }
  await page.locator('a[href^="/news/noticias/"]').first().click()
  await expect(page.getByRole('heading', { name: 'Fontes e apuração' })).toBeVisible()
  await expect(page.getByRole('heading', { name: /Escritórios|Departamentos jurídicos|Prestadores de serviços/, exact: true }).first()).toBeVisible()
  expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toContain('https://legalops.news/noticias/')
  await page.goto('/news/escritorios?assunto=governanca')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('escritórios')
  await expect(page.getByRole('link', { name: 'Governança', exact: true })).toHaveAttribute('aria-current', 'page')
})

test('email form sends explicit consent and chosen audience and shows the actual response', async ({ page }) => {
  let submitted: Record<string, unknown> | undefined
  await page.route('**/api/news/subscribe', async route => {
    submitted = route.request().postDataJSON()
    await route.fulfill({ status: 202, contentType: 'application/json', body: JSON.stringify({ message: 'Interesse registrado. Confirme sua assinatura quando a newsletter abrir.' }) })
  })
  await page.goto('/news#newsletter')
  await page.getByLabel('Seu email', { exact: true }).fill('reader@example.invalid')
  await page.locator('#newsletter').getByLabel('Escritórios', { exact: true }).check()
  await page.getByLabel('Quero receber a newsletter do legalops.news por email. Posso cancelar a qualquer momento.', { exact: true }).check()
  await page.locator('#newsletter').getByRole('button').click()
  await expect(page.getByRole('status')).toContainText('Interesse registrado')
  expect(submitted).toMatchObject({ email: 'reader@example.invalid', consent: true, audiences: ['escritorios'] })
})

test('private News routes require a Club session', async ({ page, request }) => {
  await page.goto('/community/news')
  await expect(page).toHaveURL(/\/login\?next=/)
  expect((await request.get('/api/news/admin')).status()).toBe(401)
  expect((await request.get('/api/club/news/preferences')).status()).toBe(401)
})
