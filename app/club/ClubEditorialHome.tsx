import { ClubHeader } from '@/components/ClubHeader'
import { isProOfferOpen, proPrice, PRO_INCLUDED_CREDITS, PRO_SUPPORT_EMAIL, type ProOffer } from '@/lib/club-pro'
import './club-editorial.css'

const benefits = [
  ['01', 'Encontre oportunidades.', 'Consulte vagas do Work e compare os requisitos com a sua experiência.'],
  ['02', 'Prepare sua candidatura.', 'Crie versões do currículo e da carta de apresentação para a vaga que você escolheu.'],
  ['03', 'Chegue mais preparado.', 'Pratique respostas para entrevistas e organize os próximos passos com seu assistente.'],
]

export default function ClubEditorialHome({ offer }: { offer: ProOffer | null }) {
  const open = isProOfferOpen(offer)
  const recurring = open && offer.payment_mode === 'mercadopago_subscription'
  const period = open && offer.period_months === 12 ? '/12 meses' : '/mês'
  const cta = recurring ? `Testar o Pro por ${offer.trial_days} dias` : 'Assinar o Club Pro'
  const checkout = '/club/checkout'
  const support = `mailto:${PRO_SUPPORT_EMAIL}?subject=Club%20Pro`
  const faq = [
    ['Como funciona a contratação?', recurring
      ? `Crie sua conta, confirme o email e complete seu perfil. No checkout, assine pelo Mercado Pago e envie a confirmação. O teste de ${offer.trial_days} dias começa no Mercado Pago; conferimos a assinatura e liberamos seu acesso em até um dia útil. Depois do teste, a cobrança é mensal até você cancelar.`
      : open ? 'Crie sua conta, confirme o email e complete seu perfil. No checkout, faça o PIX e envie o comprovante. Conferimos o pagamento e liberamos seu acesso em até um dia útil. A renovação é manual.'
        : `As novas assinaturas estão em preparação. Fale com ${PRO_SUPPORT_EMAIL} para conhecer o plano.`],
    ['O que posso fazer com os créditos?', `Você recebe ${PRO_INCLUDED_CREDITS} créditos por mês calendário. Uma pergunta usa 1 crédito; uma carta de apresentação, 3; um currículo personalizado ou preparação de entrevista, 5. O saldo é compartilhado entre o assistente e os recursos de carreira. Os créditos incluídos não acumulam.`],
    ['Posso cancelar?', recurring
      ? 'Sim. Cancele a assinatura na sua conta do Mercado Pago para interromper as próximas cobranças. Você mantém o período já liberado. Pode solicitar reembolso integral nos sete dias após a ativação; seus demais direitos de consumidor são preservados.'
      : 'No pagamento por PIX, você escolhe quando renovar e mantém o período já liberado. Pode solicitar reembolso integral nos sete dias após a ativação; seus demais direitos de consumidor são preservados.'],
    ['A comunidade está incluída?', 'Sim. Conversas, encontros e contato com outros profissionais fazem parte da comunidade gratuita. O Pro acrescenta o assistente privado e os recursos de carreira. Você mantém sua participação na comunidade se encerrar o Pro.'],
  ]

  return <div className="club-editorial">
    <a className="pro-skip" href="#main">Ir para o conteúdo</a>
    <div className="pro-masthead"><ClubHeader product="club" navigation={[
      { href: '#beneficios', label: 'O que você recebe' },
      { href: '#duvidas', label: 'Dúvidas' },
      { href: '/login?next=/community', label: 'Entrar', action: true },
    ]} /></div>
    <main id="main" className="pro-wrap">
      <section className="pro-hero" aria-labelledby="pro-heading">
        <div className="pro-intro">
          <p className="pro-kicker">LEGALOPS.CLUB / PRO</p>
          <h1 id="pro-heading">Da vaga à entrevista,<br /><span>com mais preparo.</span></h1>
          <p className="pro-lead">Encontre oportunidades, prepare sua candidatura e pratique entrevistas com um assistente que considera seu contexto profissional.</p>
          <p className="pro-reassurance">Histórico privado. Preferências salvas. Respostas com fontes.</p>
        </div>
        <aside className="pro-offer brand-card" id="pro" aria-labelledby="offer-heading">
          <div className="pro-offer-top"><h2 id="offer-heading">Club Pro</h2>{recurring && <span>{offer.trial_days} dias de teste grátis</span>}</div>
          {open ? <>
            <p className="pro-price"><strong>{proPrice(offer.price_cents)}</strong><span>{period}</span></p>
            <p className="pro-billing">{recurring ? `Após os ${offer.trial_days} dias de teste. Cobrança mensal pelo Mercado Pago até você cancelar.` : 'Pagamento por PIX. Você escolhe quando renovar.'}</p>
          </> : <p className="pro-unavailable">Estamos preparando as novas assinaturas.</p>}
          <ul className="pro-included">
            <li>Assistente com seu contexto e histórico privado.</li>
            <li>Currículo, carta e preparação para entrevistas.</li>
            <li><strong>{PRO_INCLUDED_CREDITS} créditos por mês</strong> para usar esses recursos.</li>
            <li>Até 20 minutos de ajuda na primeira tarefa.</li>
          </ul>
          <a className="pro-cta brand-action" href={open ? checkout : support}>{open ? cta : 'Falar sobre o Pro'} <span aria-hidden="true">↗</span></a>
          {open && <p className="pro-activation">Acesso liberado em até um dia útil após a conferência da sua confirmação.</p>}
        </aside>
      </section>
      <section className="pro-benefits" id="beneficios" aria-label="O que você recebe">
        {benefits.map(([number, title, text]) => <article key={number}><span className="pro-number">{number}</span><h2>{title}</h2><p>{text}</p></article>)}
      </section>
      <section className="pro-faq" id="duvidas" aria-labelledby="faq-heading">
        <div><p className="pro-kicker">ANTES DE COMEÇAR</p><h2 id="faq-heading">Suas dúvidas,<br />respondidas.</h2><p>Precisa de ajuda para decidir?<br /><a href={support}>Fale com a gente <span aria-hidden="true">↗</span></a></p></div>
        <div>{faq.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
      </section>
      <section className="pro-closing" aria-label="Começar no Pro"><div><h2>Seu próximo passo merece preparo.</h2><p>{open ? 'Comece com uma vaga e uma tarefa real.' : 'Conheça o plano e tire suas dúvidas com a gente.'}</p></div><a className="pro-cta brand-action" href={open ? checkout : support}>{open ? cta : 'Falar sobre o Pro'} <span aria-hidden="true">↗</span></a></section>
    </main>
    <footer className="pro-footer pro-wrap"><div><a href="/club/about">Sobre o Club</a><a href="/cadastro">Entrar na comunidade gratuita</a><a href="/community/calendar">Encontros</a></div><a href={`mailto:${PRO_SUPPORT_EMAIL}`}>{PRO_SUPPORT_EMAIL}</a></footer>
    {open && <div className="pro-mobile-bar"><div><strong>{proPrice(offer.price_cents)}<small>{period}</small></strong><span>{recurring ? `${offer.trial_days} dias de teste` : 'Club Pro'}</span></div><a className="pro-cta brand-action" href={checkout}>{recurring ? 'Testar o Pro' : 'Assinar Pro'} <span aria-hidden="true">↗</span></a></div>}
  </div>
}
