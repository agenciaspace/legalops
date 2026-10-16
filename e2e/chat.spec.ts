import { expect, test } from '@playwright/test'
import { loadEnvConfig } from '@next/env'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'

test('landing demonstrates the specialists and fits mobile, tablet and desktop', async ({
  page,
}) => {
  await page.goto('/chat')
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'uma equipe de agentes',
  )
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 950 })
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true)
  }
  await page.getByRole('tab', { name: /Contratos/ }).click()
  await expect(page.getByRole('tabpanel')).toContainText('prazos diferentes')
  await page.getByRole('tab', { name: /Contratos/ }).press('ArrowRight')
  await expect(page.getByRole('tabpanel')).toContainText('condição interna')
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({
    path: '/tmp/legalops-chat-desktop.png',
    fullPage: true,
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({
    path: '/tmp/legalops-chat-mobile.png',
    fullPage: true,
  })
})
test('private workspace and APIs require authentication', async ({
  page,
  request,
}) => {
  await page.goto('/chat/workspace')
  await expect(page).toHaveURL(/\/chat\/entrar\?next=/)
  expect((await request.get('/api/chat/workspaces')).status()).toBe(401)
  expect((await request.get('/api/cron/chat')).status()).toBe(401)
})
test('signup form keeps the Chat return path', async ({ page }) => {
  let submitted: Record<string, unknown> | undefined
  await page.route('**/api/auth/signup', async (route) => {
    submitted = route.request().postDataJSON()
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{"ok":true}',
    })
  })
  await page.goto('/chat/entrar')
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click()
  await page.getByLabel('Email').fill('signup-fixture@example.invalid')
  await page.getByLabel('Senha').fill('fixture-only-password')
  await page
    .getByRole('button', { name: 'Criar minha conta', exact: true })
    .click()
  await expect(page.getByRole('status')).toContainText('Confira seu email')
  expect(submitted).toMatchObject({ next: '/chat/workspace', locale: 'pt-BR' })
})

test('organization → files → real coordinated analysis → human decision → memory → invitation', async ({
  page,
  browser,
}) => {
  test.skip(
    process.env.CHAT_E2E_REAL !== '1',
    'Requires explicit synthetic-user integration run and configured provider.',
  )
  test.setTimeout(360_000)
  // Wrangler's remote proxy preserves the deployed HTTPS URL. Match that
  // origin only in this test harness; production CSRF validation stays intact.
  const previewOrigin = process.env.CHAT_PREVIEW_ORIGIN
  if (previewOrigin)
    await page.route('**/api/chat/**', async (route) =>
      route.fulfill({
        response: await route.fetch({
          headers: { ...route.request().headers(), origin: previewOrigin },
        }),
      }),
    )
  loadEnvConfig(process.cwd())
  const prepared = process.env.CHAT_QA_FIXTURE
    ? JSON.parse(readFileSync(process.env.CHAT_QA_FIXTURE, 'utf8'))
    : null
  const admin = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { persistSession: false } },
      )
    : null
  if (!admin && !prepared)
    throw new Error(
      'Configure an admin credential or a prepared synthetic QA fixture.',
    )
  const createdUsers: string[] = []
  const password = prepared?.password ?? `QA-${randomUUID()}-aA1!`
  const address = prepared?.email ?? `chat-qa-${randomUUID()}@example.invalid`
  const teammateAddress =
    prepared?.teammateEmail ?? `chat-qa-${randomUUID()}@example.invalid`
  let workspaceId = ''
  try {
    if (admin)
      for (const email of [address, teammateAddress]) {
        const result = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        })
        if (result.error)
          throw new Error(`QA identity setup failed: ${result.error.code}`)
        createdUsers.push(result.data.user.id)
      }
    await page.goto('/chat/entrar')
    await page.getByLabel('Email').fill(address)
    await page.getByLabel('Senha').fill(password)
    await page
      .getByRole('button', { name: 'Entrar no meu espaço', exact: true })
      .click()
    await expect(
      page.getByRole('heading', { name: 'vamos montar sua equipe.' }),
    ).toBeVisible({ timeout: 30_000 })
    await page
      .getByLabel('Nome da organização')
      .fill('QA escritório de contratos')
    await page.getByLabel('Sua atuação').fill('Sócio responsável')
    await page
      .getByLabel('O que a equipe precisa entender?')
      .fill(
        'Revisamos contratos de tecnologia com foco em renovação e privacidade.',
      )
    await page
      .getByRole('button', {
        name: 'Criar espaço e preparar agentes',
        exact: true,
      })
      .click()
    await expect(
      page.getByRole('heading', { name: 'sua base de conhecimento.' }),
    ).toBeVisible({ timeout: 30_000 })
    workspaceId = await page.locator('#chat-workspace').inputValue()
    const upload = async (name: string, content: string, kind: string) => {
      const form = page.locator('form.chat-upload')
      await form.getByLabel('Arquivo').setInputFiles({
        name,
        mimeType: 'text/plain',
        buffer: Buffer.from(content),
      })
      await form.getByLabel('Tipo').selectOption(kind)
      const response = page.waitForResponse(
        (res) =>
          res.url().endsWith('/api/chat/documents') &&
          res.request().method() === 'POST',
      )
      await form
        .getByRole('button', { name: 'Importar documento', exact: true })
        .click()
      expect((await response).status()).toBe(201)
      await expect(page.getByText(name, { exact: true }).first()).toBeVisible()
    }
    await upload(
      'modelo-qa.txt',
      'Modelo interno. A renovação dependerá de acordo escrito entre as partes. O prazo inicial é de doze meses.',
      'model',
    )
    await upload(
      'politica-qa.txt',
      'Política interna. Contratações com tratamento de dados pessoais devem passar pela avaliação de privacidade. Não assinar antes da avaliação.',
      'policy',
    )
    await page.getByRole('button', { name: 'Demandas', exact: true }).click()
    await page
      .getByRole('button', { name: 'Nova demanda', exact: true })
      .click()
    await page.getByLabel('Nome da demanda').fill('Revisão de fornecedor QA')
    await page
      .getByLabel('Contexto e pedido')
      .fill(
        'Revisar o contrato de tecnologia. Compare a renovação ao nosso modelo e confira a política de privacidade. Falta confirmar a data de início.',
      )
    await page
      .getByRole('button', { name: 'Criar demanda', exact: true })
      .click()
    await expect(
      page.getByRole('heading', {
        name: 'Revisão de fornecedor QA',
        exact: true,
      }),
    ).toBeVisible()
    await upload(
      'minuta-qa.txt',
      'Contrato de serviços de tecnologia. O prazo inicial é de doze meses. Este contrato será renovado automaticamente por igual período. O fornecedor tratará dados pessoais dos empregados da contratante.',
      'contract',
    )
    await page
      .getByRole('checkbox', { name: /Autorizei o uso destes documentos/ })
      .check()
    await page
      .getByRole('button', { name: 'Analisar com a equipe', exact: true })
      .click()
    await expect(
      page.getByRole('heading', { name: 'Sua revisão encerra esta etapa.' }),
    ).toBeVisible({ timeout: 240_000 })
    await expect(page.getByText(/Cobertura:/)).toContainText('3 de 3')
    expect(await page.locator('.chat-output-summary').count()).toBe(4)
    expect(await page.locator('.chat-citation').count()).toBeGreaterThan(0)
    await page
      .getByLabel('Decisão, correção ou orientação')
      .fill(
        'Nas próximas minutas de fornecedores, sinalizar renovação automática para revisão humana.',
      )
    await page
      .getByRole('checkbox', {
        name: /Transformar este texto em orientação compartilhada/,
      })
      .check()
    await page
      .getByRole('button', { name: 'Registrar decisão', exact: true })
      .click()
    await expect(
      page.getByRole('heading', { name: 'Análise revisada e concluída.' }),
    ).toBeVisible({ timeout: 30_000 })
    await page
      .getByRole('button', { name: 'Aprendizados', exact: true })
      .click()
    await expect(
      page.getByText(
        'Nas próximas minutas de fornecedores, sinalizar renovação automática para revisão humana.',
        { exact: true },
      ),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Pessoas', exact: true }).click()
    await page.getByLabel('Email da pessoa').fill(teammateAddress)
    await page
      .getByRole('button', { name: 'Gerar convite', exact: true })
      .click()
    await expect(page.locator('#chat-invite-link')).toBeVisible()
    const invite = new URL(await page.locator('#chat-invite-link').inputValue())
    const colleague = await browser.newContext()
    if (previewOrigin)
      await colleague.route('**/api/chat/**', async (route) =>
        route.fulfill({
          response: await route.fetch({
            headers: { ...route.request().headers(), origin: previewOrigin },
          }),
        }),
      )
    const teammate = await colleague.newPage()
    const origin = new URL(page.url()).origin
    await teammate.goto(
      `${origin}/chat/entrar?next=${encodeURIComponent(invite.pathname + invite.search)}`,
    )
    await teammate.getByLabel('Email').fill(teammateAddress)
    await teammate.getByLabel('Senha').fill(password)
    await teammate
      .getByRole('button', { name: 'Entrar no meu espaço', exact: true })
      .click()
    await teammate
      .getByRole('button', { name: 'Aceitar convite', exact: true })
      .click()
    await expect(
      teammate.getByRole('heading', { name: 'trabalho em andamento.' }),
    ).toBeVisible({ timeout: 30_000 })
    await expect(
      teammate.getByText('Revisão de fornecedor QA', { exact: true }),
    ).toHaveCount(0)
    await teammate
      .getByRole('button', { name: 'Base de conhecimento', exact: true })
      .click()
    await expect(
      teammate.getByText('modelo-qa.txt', { exact: true }),
    ).toBeVisible()
    await expect(
      teammate.getByText('minuta-qa.txt', { exact: true }),
    ).toHaveCount(0)
    await colleague.close()
    await page.getByRole('button', { name: 'Demandas', exact: true }).click()
    await page.getByLabel('Acrescentar contexto').fill('O fornecedor aceitou retirar a renovação automática. A data de início ainda será definida.')
    await page.getByRole('button',{name:'Salvar mensagem',exact:true}).click()
    await expect(page.getByText('O fornecedor aceitou retirar a renovação automática. A data de início ainda será definida.',{exact:true})).toBeVisible()
    await page.getByRole('checkbox',{name:/Autorizei o uso destes documentos/}).check()
    await page.getByRole('button',{name:'Analisar novamente com a equipe',exact:true}).click()
    await expect(page.getByRole('heading',{name:'Sua revisão encerra esta etapa.'})).toBeVisible({timeout:240_000})
    await page.locator('select[name="outcome"]').selectOption('changes_requested')
    await page.getByLabel('Decisão, correção ou orientação').fill('Preparar a versão final para uma nova revisão humana, após confirmar a data de início.')
    await page.getByRole('button',{name:'Registrar decisão',exact:true}).click()
    await expect(page.getByRole('heading',{name:'Ajustes solicitados.',exact:true})).toBeVisible()
    for(const width of [320,390,768,1440]){
      await page.setViewportSize({width,height:900})
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true)
    }
    await page.setViewportSize({ width: 390, height: 844 })
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true)
    await page.screenshot({
      path: '/tmp/legalops-chat-workspace-mobile.png',
      fullPage: true,
    })
    const matterId = (
      await page.request
        .get(`/api/chat/state?workspace=${workspaceId}`)
        .then((r) => r.json())
    ).matters[0].id
    const evidence = await page.request
      .get(`/api/chat/runs?workspace=${workspaceId}&matter=${matterId}`)
      .then((r) => r.json())
    expect(evidence.runs[0].context.memories.some((m:{content:string})=>m.content==='Nas próximas minutas de fornecedores, sinalizar renovação automática para revisão humana.')).toBe(true)
    expect(evidence.runs[0].context.messages.some((m:{body:string})=>m.body.includes('O fornecedor aceitou retirar'))).toBe(true)
    console.log(
      'Real workflow evidence:',
      JSON.stringify({
        completedSteps: evidence.steps.filter(
          (s: { status: string }) => s.status === 'completed',
        ).length,
        reportedModelCostUSD: evidence.steps.reduce(
          (n: number, s: { cost_usd: number }) => n + Number(s.cost_usd ?? 0),
          0,
        ),
        privateMatterHiddenFromTeammate: true,
      }),
    )
  } finally {
    if (admin) {
      if (!workspaceId && createdUsers[0])
        workspaceId =
          (
            await admin
              .from('chat_workspaces')
              .select('id')
              .eq('owner_id', createdUsers[0])
              .maybeSingle()
          ).data?.id ?? ''
      if (workspaceId) {
        const documents =
          (
            await admin
              .from('chat_documents')
              .select('storage_path')
              .eq('workspace_id', workspaceId)
          ).data ?? []
        const matters =
          (
            await admin
              .from('chat_matters')
              .select('id')
              .eq('workspace_id', workspaceId)
          ).data ?? []
        for (const table of ['chat_memories', 'chat_decisions', 'chat_runs'])
          await admin.from(table).delete().eq('workspace_id', workspaceId)
        if (matters.length)
          await admin
            .from('chat_messages')
            .delete()
            .in(
              'matter_id',
              matters.map((m) => m.id),
            )
        for (const table of [
          'chat_documents',
          'chat_matters',
          'chat_invitations',
          'chat_agents',
          'chat_members',
        ])
          await admin.from(table).delete().eq('workspace_id', workspaceId)
        await admin.from('chat_workspaces').delete().eq('id', workspaceId)
        const paths = documents.map((d) => d.storage_path).filter(Boolean)
        if (paths.length)
          await admin.storage.from('chat-documents').remove(paths)
      }
      for (const user of createdUsers) await admin.auth.admin.deleteUser(user)
    }
  }
})
