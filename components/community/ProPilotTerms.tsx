import { PRO_SUPPORT_EMAIL } from '@/lib/club-pro'

export function ProPilotTerms({ recurring = true }: { recurring?: boolean }) {
  return <section className="brand-card mt-6 p-5 sm:p-6">
    <h2 className="text-xl font-semibold">Atendimento e condições</h2>
    <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--lo-muted)]">
      <li>Você recebe 300 créditos por mês calendário. Usa o mesmo saldo no agente e nos recursos de carreira; a franquia incluída não acumula.</li>
      <li>Você gasta 1 crédito por pergunta, 2 por resumo, 3 por carta ou análise de perfil e 5 por currículo personalizado ou preparação de entrevista.</li>
      <li>A administração confere sua confirmação e libera o acesso em até um dia útil. Você pode pedir ajuda de até 20 minutos para concluir sua primeira tarefa.</li>
      <li>{recurring ? 'Você tem sete dias de teste, conforme o plano do Mercado Pago. Depois, o Mercado Pago cobra a mensalidade até você cancelar a assinatura na sua conta.' : 'Você paga um mês por PIX e escolhe quando renovar. A administração preserva o período restante na renovação.'}</li>
      <li>Você pode solicitar reembolso integral nos sete dias após a ativação. Preservamos seus demais direitos de consumidor.{recurring ? ' Para encerrar a cobrança recorrente, cancele também no Mercado Pago.' : ''}</li>
      <li>Você mantém sua participação gratuita na comunidade após encerrar o Pro.</li>
    </ul>
    <p className="mt-4 text-sm leading-7">Fale com <a className="break-all underline" href={`mailto:${PRO_SUPPORT_EMAIL}?subject=Atendimento%20Club%20Pro`}>{PRO_SUPPORT_EMAIL}</a> para pedir ajuda, cancelar ou solicitar reembolso. Respondemos em até um dia útil.</p>
  </section>
}
