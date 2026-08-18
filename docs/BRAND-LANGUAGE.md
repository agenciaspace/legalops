# LegalOps — brand & landing system

Este arquivo define a linguagem compartilhada entre `legalops.club`, `legalops.work` e `legalops.dev`.

A regra principal é simples:

- `legalops.club` = **comunidade**
- `legalops.work` = **vagas**
- `legalops.dev` = **construir**

Os três produtos devem parecer partes do mesmo ecossistema. Cada domínio tem uma função clara e não deve tentar vender a função dos outros dois.

## 1. Arquitetura do ecossistema

Toda landing pública deve tornar esta relação visível no primeiro viewport ou imediatamente depois dele:

`club / comunidade` · `work / vagas` · `dev / construir`

A navegação entre os domínios deve parecer uma troca de área dentro do mesmo produto-mãe, não uma visita a outra empresa.

### Club

Promessa: encontrar pessoas, conversas e repertório para o trabalho jurídico.

Pode falar sobre:

- comunidade;
- networking;
- conversas;
- referências;
- benchmarks;
- eventos;
- membros;
- escritório virtual;
- troca prática entre profissionais.

Evitar usar `construir` como promessa principal. Se uma conversa levar a uma automação ou produto, o próximo passo natural é `legalops.dev`.

### Work

Promessa: encontrar e organizar oportunidades profissionais no jurídico.

Pode falar sobre:

- vagas;
- empresas;
- modelo remoto/híbrido/presencial;
- salário quando disponível;
- candidaturas;
- perfil profissional;
- contratação;
- carreira como consequência de oportunidades concretas.

A primeira dobra deve mostrar vagas reais sempre que existirem.

### Dev

Promessa: aprender a construir tecnologia para o jurídico construindo projetos reais.

Pode falar sobre:

- builds;
- automações;
- integrações;
- agentes;
- APIs;
- dados;
- produtos internos;
- infraestrutura;
- guias e código;
- governança dentro de projetos concretos.

Evitar abrir com jargão de implementação, como `instrumentar um fluxo`, `orquestrar uma jornada` ou perguntas que pressupõem que o visitante já sabe qual arquitetura quer construir.

## 2. Marca

- Escrever sempre em minúsculas: `legalops.club`, `legalops.work`, `legalops.dev`.
- Usar `BrandWordmark` de `components/BrandLogo.tsx` nas superfícies React públicas.
- Wordmark: `legalops` + ponto coral + sufixo.
- Ponto: coral `#E88A6A`.
- Não usar a antiga ligatura/símbolo `op` como marca principal.
- Não usar robô, sparkle, estrela, terminal ou símbolo genérico de IA como logo.

## 3. Tokens

### Cores

- ink: `#111111`
- coral: `#E88A6A`
- deep coral: `#C9684F`
- cream: `#F5F1E8`
- light surface: `#FAF7F1`
- warm gray: `#CEC8BD`
- soft line: `#E6DED0`
- muted text: `#69635E`
- secondary muted: `#817A73`

O coral é pontuação visual. Não deve dominar grandes áreas da interface.

### Tipografia

- Quicksand: wordmark e títulos editoriais.
- Inter: corpo, navegação, filtros, dados e UI.
- Headlines: tracking negativo, frases curtas, normalmente em minúsculas.
- Micro-labels: 9–11 px, uppercase, tracking amplo.

### Espaçamento

Use uma escala previsível:

- 8 px: micro-gap;
- 12–16 px: componentes pequenos;
- 20–24 px: padding de UI;
- 32–48 px: separação interna de blocos;
- 64–80 px: seções mobile/tablet;
- 96–112 px: seções desktop;
- 1180 px: largura máxima das landings principais.

### Bordas e raio

- borda padrão: `1px solid #CEC8BD`;
- raio padrão: 8–10 px;
- use 12 px apenas em superfícies de produto que realmente precisem;
- evite `rounded-full` fora de controles muito pequenos;
- evite raios de 20–34 px em cards comuns;
- evite sombra em componentes normais;
- quando precisar de elevação, use contraste de superfície antes de usar shadow.

## 4. Regra de composição

A interface deve parecer editorial e orientada a produto.

Preferir:

- whitespace;
- hairlines;
- grids simples;
- listas e tabelas quando a informação é estrutural;
- screenshots, previews e dados reais do produto;
- uma superfície escura forte por página, quando necessário;
- cards apenas quando o próprio objeto é naturalmente um card.

Evitar:

- card de marca mostrando apenas logo + slogan;
- ilustração abstrata ocupando o espaço em que poderia existir produto real;
- sequência de feature cards genéricos;
- círculos decorativos sem função;
- grid/dots apenas para “dar textura”;
- glow, glassmorphism e gradientes de IA;
- badges em excesso;
- animação sem função;
- sombras para diferenciar cada bloco.

## 5. Template obrigatório das landings

As três homes públicas devem seguir a mesma arquitetura.

### 1. Header do ecossistema

À esquerda: wordmark do domínio atual.

À direita:

- comunidade;
- vagas;
- construir;
- ação de entrada quando existir conta/autenticação.

O produto atual é indicado por underline coral, não por um grande pill preto.

### 2. Hero

O hero tem apenas:

- micro-label com domínio + função;
- uma promessa comercial;
- uma explicação curta;
- uma CTA primária;
- no máximo uma CTA secundária;
- preview real do produto.

Não repetir o logo em um card de hero.

### 3. Faixa do ecossistema

Depois do hero, mostrar os três produtos com domínio, função e uma linha de explicação.

O produto atual recebe uma linha coral no topo.

### 4. Valor do produto

No máximo três princípios. Devem explicar como o produto é usado, não listar atributos abstratos.

### 5. Produto real

- Club: comunidades, membros, conversas, escritório virtual.
- Work: vagas reais e busca.
- Dev: builds, arquitetura e projetos reais.

### 6. Próximo passo

CTA simples, ligada à ação principal daquele produto.

- Club: entrar na comunidade.
- Work: ver vagas / criar perfil.
- Dev: abrir um build / começar a construir.

## 6. Voz comercial

O texto precisa responder rapidamente:

1. o que é isto?
2. para quem é?
3. o que consigo fazer aqui?
4. qual é o próximo passo?

### Preferir

- encontre;
- entre;
- publique;
- busque;
- compare;
- converse;
- compartilhe;
- construa;
- teste;
- conecte;
- adapte.

### Evitar

- `instrumentar um fluxo`;
- `orquestrar a jornada`;
- `transformar sua jornada`;
- `revolucionar o jurídico`;
- `solução inteligente` sem função concreta;
- `AI-powered` como proposta de valor;
- `otimize seus processos` sem explicar quais processos e como;
- perguntas que exigem vocabulário técnico antes de apresentar o benefício.

## 7. Exemplos de primeira dobra

### Club

Micro-label: `legalops.club / comunidade`

Headline: `troque com quem vive os mesmos problemas do jurídico.`

CTA: `explorar a comunidade`

Produto no hero: preview das conversas e do escritório virtual.

### Work

Micro-label: `legalops.work / vagas`

Headline: `encontre sua próxima oportunidade no jurídico.`

CTA: `ver vagas`

Produto no hero: vagas reais verificadas recentemente.

### Dev

Micro-label: `legalops.dev / construir`

Headline: `construa o que o jurídico precisa.`

CTA: `explorar builds`

Produto no hero: preview do build atual com as camadas reais do sistema.

## 8. Checklist antes de publicar

- A função do domínio está óbvia em até 5 segundos?
- Os outros dois produtos aparecem como partes do mesmo ecossistema?
- O hero mostra produto ou uma demonstração útil, em vez de decoração?
- A CTA descreve uma ação real?
- O layout usa radius de 8–10 px em vez de grandes pills/cards arredondados?
- Há alguma sombra, círculo, grid ou badge que pode ser removido?
- O coral está sendo usado como acento, não como preenchimento dominante?
- Há termos técnicos antes de o benefício estar claro?
- Club está vendendo comunidade?
- Work está vendendo vagas?
- Dev está vendendo construir?
- A página ainda funciona e comunica bem sem animação e sem efeitos?
