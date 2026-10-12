import { expect, test, type Page } from '@playwright/test'

async function checkLayout(page: Page) {
  await expect.poll(() => page.evaluate(() => {
    const panel = document.querySelector<HTMLElement>('[role="tabpanel"]:not([hidden])')!
    const viewport = window.visualViewport!
    return {
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
      outerScroll: document.documentElement.scrollHeight > innerHeight + 1,
      panelOverflow: panel.scrollWidth > panel.clientWidth + 1,
      locked: getComputedStyle(document.body).overflow === 'hidden',
      fits: document.querySelector('.event-workspace')!.getBoundingClientRect().bottom <= viewport.height + 1,
    }
  })).toEqual({ horizontalOverflow: false, outerScroll: false, panelOverflow: false, locked: true, fits: true })
}

for (const slug of ['bench-netlex-2026', 'bench-honorarios-exito-2026', 'bench-nubank-2026-09-17']) {
  test(`${slug}: viewport changes and staged registration`, async ({ page }) => {
    // Guard against accidental real registrations while exercising the form.
    await page.route('**/community/events/**', route => route.request().method() === 'POST' ? route.abort() : route.continue())
    await page.goto(`/community/events/${slug}`)
    await expect(page.getByRole('tab').first()).toBeVisible()
    for (const [width, height] of [[320,568], [390,844], [820,1180], [1180,820], [1440,900], [844,390]]) {
      await page.setViewportSize({ width, height })
      for (const tab of await page.getByRole('tab').all()) {
        await tab.click()
        await checkLayout(page)
      }
    }
    const participate = page.getByRole('tab', { name: 'Participar', exact: true })
    if (await participate.count()) {
      await page.setViewportSize({ width: 390, height: 844 })
      await participate.click()
      await page.getByRole('button', { name: 'Continuar', exact: true }).click()
      await expect(page.locator('input[name="name"]')).toBeVisible()
      await expect(page.locator('input[name="role"]')).toBeHidden()
      await page.locator('input[name="name"]').fill('Teste de layout')
      await page.locator('input[name="email"]').fill('layout@example.com')
      await page.locator('input[name="phone"]').fill('+5511999999999')
      // Reduced viewport while typing approximates the keyboard occupying space.
      await page.setViewportSize({ width: 390, height: 420 })
      await checkLayout(page)
      await page.getByRole('button', { name: 'Continuar', exact: true }).click()
      await expect(page.locator('input[name="role"]')).toBeVisible()
      await page.locator('input[name="role"]').fill('Jurídico')
      await page.locator('input[name="organization"]').fill('Empresa teste')
      await page.getByRole('button', { name: 'Voltar', exact: true }).click()
      await expect(page.locator('input[name="name"]')).toHaveValue('Teste de layout')
      await page.getByRole('button', { name: 'Continuar', exact: true }).click()
      await expect(page.locator('input[name="role"]')).toHaveValue('Jurídico')
      await checkLayout(page)
      await page.setViewportSize({ width: 390, height: 844 })
    }
    // Simulate browser chrome changing visualViewport independently of legacy vh.
    await page.evaluate(() => {
      Object.defineProperty(window.visualViewport, 'height', { configurable: true, value: innerHeight - 100 })
      window.visualViewport!.dispatchEvent(new Event('resize'))
    })
    await checkLayout(page)
    await page.getByRole('link', { name: 'Página inicial do legalops.club', exact: true }).click()
    await expect.poll(() => page.evaluate(() => document.documentElement.style.getPropertyValue('--event-viewport-height'))).toBe('')
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).overflow)).not.toBe('hidden')
  })
}
