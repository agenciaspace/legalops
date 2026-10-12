# Piloto pago do legalops.club

Leon aprovou R$ 49 por mês, 300 créditos por mês calendário e ajuda de até 20 minutos na primeira tarefa. Em 12/10/2026, ele escolheu a assinatura pelo Mercado Pago, com sete dias de teste, pelo link https://mpago.la/2gCAVGU. O comprador autoriza as cobranças recorrentes no Mercado Pago. A administração confere a assinatura e cada cobrança para liberar os períodos do Pro.

## Operação

1. O membro cria a conta, confirma o email e completa o perfil gratuito.
2. No checkout do Club, ele abre um pedido com preço, período, link e teste registrados. Conclui a assinatura no Mercado Pago e envia a confirmação no pedido.
3. Leon confere o titular, o email, o plano de R$ 49 mensais e o status autorizado no painel do Mercado Pago. Para teste, registra o ID da assinatura e a próxima data de cobrança. Para pagamento, registra também o ID da cobrança aprovada.
4. Em `/club/admin/pro`, um administrador confirma a conferência e libera o período. O banco limita o teste a uma concessão por membro e impede repetir um ID de pagamento. O comprador recebe um email e encontra a primeira tarefa em `/community/pro`.
5. A cada cobrança seguinte, Leon confere o pagamento e um administrador registra o ID da cobrança e a próxima data de cobrança no painel do Club. A equipe preserva períodos de acesso já concedidos. O cron diário prepara avisos quando faltam até três dias para a cobrança.

A administração usa as datas do Mercado Pago, em horário de Brasília. O teste começa no provedor; a equipe confere e libera o acesso em até um dia útil. O link externo não associa a compra à conta do Club sem essa conferência. Não implementamos conciliação automática ou webhook nesta etapa.

O comprador cancela a recorrência na sua conta do Mercado Pago. Leon confere o cancelamento e a administração o registra, preservando o período atual. Para reembolso integral solicitado nos sete dias após ativação, Leon cancela e devolve o valor no Mercado Pago antes de registrar a devolução no Club. A equipe preserva os demais direitos do consumidor e a comunidade gratuita.

Atendimento: `hi@legalops.club`, em até um dia útil. Para falhas de email, o administrador confere a caixa de enviados antes de acionar a tentativa de envio no painel. A equipe não repete uma entrega ambígua por outra transportadora.

## Primeira venda

Selecionamos 20 membros que buscam oportunidades em Legal Ops. Registramos pessoas convidadas e pessoas que viram uma demonstração no painel, contando cada pessoa uma vez. O painel calcula pagamentos conferidos, testes, primeiras gerações, uso na primeira semana e renovações. Buscamos dez demonstrações e cinco compradores nas primeiras duas semanas; após o primeiro mês pago, buscamos três renovações. A equipe trata esses números como metas.

Convite para Leon adaptar e enviar:

> Estamos abrindo o Club Pro por R$ 49 por mês, com sete dias de teste pelo Mercado Pago. Você usa um agente com seu contexto profissional para consultar vagas e preparar candidaturas, com 300 créditos mensais. Quero mostrar uma tarefa completa em dez minutos. Depois do teste, o Mercado Pago cobra a mensalidade até você cancelar.

Demonstração de dez minutos:

- Dois minutos: o membro apresenta seu contexto e objetivo.
- Três minutos: ele consulta oportunidades presentes no Work e escolhe uma vaga.
- Três minutos: ele prepara uma carta e perguntas de entrevista nos recursos de carreira.
- Dois minutos: ele confere o resultado, as fontes e as condições da assinatura.

Leon usa um perfil autorizado e uma vaga real. Ele registra objeções de preço, entrega e confiança após cada conversa. A equipe divulga os recursos atuais; trata a leitura automática do WhatsApp como planejada. Não enviamos convites durante a implementação.

## Custos

Registramos o modelo, os tokens e o custo em USD informado pelo OpenRouter no extrato de geração da plataforma. Mantemos o custo desconhecido como nulo. O painel mostra o total informado no mês UTC e quantas gerações concluídas ainda não têm custo.

Reservamos R$ 10 por membro/mês como alvo provisório de IA. Leon converte os gastos em dólar pela taxa aplicável ao pagamento e considera infraestrutura, atendimento, tarifas do Mercado Pago e tributos para calcular margem. Recebimentos conferidos representam valores brutos registrados, excluindo reembolsos.
