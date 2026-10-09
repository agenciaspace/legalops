# Sistema visual do legalops

Leon aprovou a direção editorial em creme, tinta e terracota para Club, Work e Dev.
Use `design/legalops.css` como fonte dos tokens e componentes visuais.

| Token | Valor | Uso |
| --- | --- | --- |
| `--lo-cream` | `#F5F1E8` | Fundo |
| `--lo-surface` | `#FAF7F1` | Cartões e campos |
| `--lo-ink` | `#111111` | Títulos e ações principais |
| `--lo-text` | `#2A2927` | Texto |
| `--lo-muted` | `#625E59` | Texto secundário |
| `--lo-sand` | `#EDE5D8` | Seleção e agrupamento |
| `--lo-border` | `#CEC8BD` | Divisórias |
| `--lo-accent` | `#A24D36` | Links e rótulos |
| `--lo-coral` | `#E88A6A` | Destaques da marca |
| `--lo-radius` | `8px` | Botões, campos e cartões |

Use Inter no texto e Quicksand nos títulos. No Next, mantenha as variáveis de
`next/font` no elemento `html` para resolver os tokens de fonte na raiz.
Use `BrandWordmark` para Club e Work; preserve as proporções oficiais no Dev.

## Componentes

Use `brand-container`, `brand-hero`, `brand-headline`, `brand-copy`, `brand-action`,
`brand-card`, `brand-section` e `brand-ecosystem` nas landings. Mostre encontros
publicados no Club, vagas verificadas no Work e projetos disponíveis no Dev.
Mantenha o Pro em uma seção própria do Club e identifique recursos em preparação.

Use `brand-page`, `brand-page-heading` e `brand-tabs` no app. No Club, abra o agente
pelo cabeçalho e preserve a conversa ao fechar o diálogo. Mantenha os campos das
abas do perfil montados para enviar o formulário completo. Ao validar um campo
obrigatório em outra aba, abra essa aba e devolva o foco ao campo.

## Sincronização

O Next importa a fonte CSS. Para o site estático, gere a cópia com:

```bash
npm run design:sync
```

Os comandos `npm test` e `npm run build`, além dos dois workflows de publicação,
executam a conferência da cópia. Se alguém editar uma cópia sem atualizar a fonte,
a conferência interrompe a execução. Revise o diff do CSS gerado junto da fonte.

## Conferência visual

Confira as landings e as telas do app em 320, 390, 768 e 1200 pixels. Verifique
rolagem horizontal, navegação inferior, foco do agente, filtros ativos e campos
do perfil entre abas. Preserve acesso, tradução, formulários e links de recursos.
Ao testar telas privadas com dados de revisão, identifique essa condição e confira
as ações com testes próprios. Não use dados de revisão em produção.
