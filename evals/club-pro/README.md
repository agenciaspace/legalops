# Avaliação do agente Pro — 16/09/2026 (BRT)

## Conclusão

Modelos econômicos são candidatos viáveis para extração, classificação e busca
com fontes. O teste não sustenta usá-los sozinhos para todo o fluxo: ambos
erraram regras de aprovação. Sonnet acertou esses casos, mas também produziu
inferências não comprovadas e falhas de formato em outras etapas.

**Preço e franquia continuam indefinidos.** Não há evidência suficiente para
prometer execução autônoma confiável ou que nenhuma informação será perdida.

## Método

- 3 modelos × 10 casos × 2 repetições: **60 chamadas reais**, 60 IDs de geração
  diferentes, todas HTTP 200 e com custo informado. Um piloto é contabilizado
  separadamente. Oito casos iniciais e dois diagnósticos posteriores.
- Temperatura 0, limite de 1.400 tokens de saída, timeout 35s,
  `data_collection=deny` e ZDR, como na aplicação. Nenhuma chamada reportou
  tokens de raciocínio.
- Perfis e mensagens fictícios. OpenCLM limitado à referência documentada
  utilizada pelo agente atual. Nenhum dado pessoal de membro foi utilizado.
- Extração → boletim e seleção de vaga → carta foram encadeados. Cada modelo
  recebeu sua própria resposta anterior, mesmo quando incorreta.
- Um caso reproduziu o system prompt de produção com resposta livre. Os demais
  usaram instruções estruturadas de avaliação, sem JSON Schema na API.

## Qualidade observada

| Caso | Flash Lite 3.1 | Flash 2.5 | Sonnet 4.6 |
|---|---|---|---|
| Datas corrigidas, cancelamentos e rumores | Fatos principais corretos 2/2 | Fatos corretos 2/2; Markdown no JSON | Fatos corretos 2/2; formato das referências varia |
| Vaga adequada, localização e salário desconhecido | Correto 2/2 | Correto 2/2 | Correto 2/2 |
| Contexto longo e dado de outro membro | Recupera correção, não inventa salário 2/2 | Mesmo resultado 2/2 | Mesmo resultado 2/2 |
| Limites documentados do OpenCLM | Núcleo correto 2/2 | Núcleo correto 2/2 | Núcleo correto 2/2 |
| Plano de ferramentas | Dono/vaga corretos; confirmação errada 2/2 | Mesmo problema 2/2 | Dono/vaga e confirmação corretos 2/2 |
| Sete decisões de aprovação fictícias | **12/14 corretas** | **10/14 corretas** | **14/14 corretas** |

Essas contagens descrevem a amostra, não taxas de acerto esperadas em produção.
Duas repetições próximas e determinísticas não representam a diversidade real.
O teste longo usa 40KB de texto repetitivo e uma correção no final; não demonstra
recuperação de todos os fatos em históricos arbitrários.

### Falhas concretas

1. **Aprovação indevida:** BRL 5.000/mês equivale a BRL 60.000/ano; acima de
   BRL 50.000 a regra exigia diretor. Os dois modelos Google marcaram o caso
   como pronto. Flash também ignorou uma aprovação de privacidade pendente.
   Sonnet acertou as condições nas duas rodadas. Cálculos e permissões devem
   ser aplicados em código, mesmo usando o modelo mais forte.
2. **Experiência inventada:** Flash Lite transformou interesse em CLM em
   experiência com implantação e chamou Excel/Power BI de avançados. Outros
   modelos também acrescentaram vivências não fornecidas. Flash retornou
   `sent: true` para uma carta apenas redigida, nas duas rodadas iniciais.
   Nenhuma candidatura foi enviada: foi uma declaração falsa na resposta.
3. **Perda entre etapas:** o schema de extração guardou a data do aviso
   obrigatório, mas não exigiu guardar a ação “atualizar consentimento”.
   Quando isso não apareceu nas referências, o boletim ficou vago. Flash
   confundiu o link do material com o de inscrição; Sonnet também o fez na
   segunda rodada. Lite chamou competências explicitamente ausentes de atuais.
   Trocar apenas o modelo não resolve um schema incompleto.
4. **Inferência com fonte insuficiente:** na resposta livre, Lite passou de
   SOC2 “não documentado” para “ausência” de certificação. Sonnet especulou que
   a certificação seria improvável e associou viabilidade técnica à licença MIT.
   Flash foi mais contido nesse caso específico.
5. **Formato:** houve JSON dentro de Markdown apesar de pedido de JSON puro.
   A análise separa isso de erro factual. Datas equivalentes, IDs com descrição
   e a URL do GitHub fornecida como fonte não contam como informação falsa.

### Revisão direcionada da carta

`cover_letter_v2` explicitou que interesse não comprova experiência e conhecer
uma ferramenta não comprova nível avançado. Todos passaram a retornar
`sent: false`, mas alguns mantiveram linguagem de domínio/rotina não demonstrada.
Sonnet ficou mais próximo dos fatos. Os textos continuam sendo rascunhos.
O ajuste usou os mesmos exemplos; não é um holdout independente.

## Custos

[Cálculos reproduzíveis](costs.md) e [valores em JSON](costs.json).

- Avaliação: **US$ 0,217540**; piloto: **US$ 0,000455**, reportados em `usage.cost`,
  antes da conversão e taxa de compra de saldo.
- Medianas: aproximadamente 1,7s nos modelos Google e 4,1s no Sonnet.
- A maioria dos casos foi curta. Um chegou a 10–13 mil tokens de entrada.
  Não usar a média barata desta amostra como custo de todo usuário.
- Lite teve cache em uma repetição; as projeções abaixo não descontam cache.

| Cenário mensal simulado | Padrão | Profundas | Boletins | Cartas | Só IA | Reserva 2× |
|---|---:|---:|---:|---:|---:|---:|
| Leve | 60 | 4 | 30 | 4 | R$ 4,75 | R$ 9,51 |
| Frequente | 200 | 12 | 30 | 8 | R$ 14,46 | R$ 28,92 |
| Intenso | 600 | 40 | 30 | 20 | R$ 44,36 | R$ 88,71 |

São cenários de engenharia, não hábitos observados nem preço de venda. Incluem
dólar de planejamento R$6, taxa de compra 5,5% e orçamentos de tokens em costs.md.
Reserva 2× é uma hipótese de contingência. Excluem infraestrutura, coleta e
transcrição de WhatsApp, buscas pagas, impostos, email, suporte, curadoria e
chamadas extras de agentes autônomos. Custos fixos por pagante dependem do tamanho
da comunidade. Uma tarefa com várias chamadas soma o custo de todas elas.

## Arquitetura recomendada

1. **Lite para extração/classificação**, com saída validada e registros que
   preservem assunto, ação, prazo, público, fonte e correções.
2. **Modelo econômico para respostas simples com fontes**; Flash foi mais
   contido no teste livre, sem base para declará-lo vencedor universal.
   **Sonnet como candidato para raciocínio complexo**, com verificação das regras.
3. **Cálculos, permissões, execução e pagamentos em código.** `sent`, `approved`
   e `executed` devem refletir operações reais validadas, nunca texto gerado.
4. **Processar conteúdo comum uma vez**, personalizando depois. Avisos
   obrigatórios precisam de registro persistente e confirmação de leitura,
   sem depender apenas de resumos livres ou interesses temáticos.
5. **Contabilidade por etapa:** modelo, tokens, custo, falhas, retries e teto
   por membro. Hoje a cota de 30 perguntas/dia cobre só o agente pessoal;
   agentes temáticos e outros recursos precisam entrar na conta conjunta.

## Limitações e trabalho necessário antes de precificar o fluxo completo

- WhatsApp, pipeline, DocuSign e OpenCLM não foram acionados. O plano de
  ferramentas é simulado; não testa execução ou idempotência no sistema real.
- Não houve geração/execução de código, áudio, documentos extensos reais,
  busca externa ou operação da rede de líderes regionais.
- Não foram medidas faturas de infraestrutura nem distribuição de consumo de
  membros reais. Não há base para margem total ou “300 créditos cobrem tudo”.
- Os modelos passam a ser candidatos por tarefa; o fluxo completo ainda precisa
  de conectores, controles e medição por etapa para ser testado ponta a ponta.

## Reproduzir e auditar

[Protocolo](protocol.md), [casos](cases.json), [respostas originais](results/),
[piloto](pilot.json) e [gates](scored.json).

`python3 evals/club-pro/score.py` separa contrato exato e campos semânticos;
formatos equivalentes são normalizados só na análise semântica. O resultado
bruto é preservado. Checagem de campos não substitui revisão textual.

`python3 evals/club-pro/report.py` recalcula métricas e cenários. `run.py` exige
URL/token em arquivos privados temporários; não contém credenciais nem roda na CI.

`worker.mjs` é exclusivamente avaliador: **nunca promover à produção**.
Previews d90d789a e 3fcc60c1 foram usados; previews desativados ao terminar e
token local removido. A lista de deployments de produção permaneceu idêntica,
com 100% do tráfego na versão 5ddb9795-230b-4347-bc34-70065896c05a.
