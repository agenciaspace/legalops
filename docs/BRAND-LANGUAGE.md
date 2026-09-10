# LegalOps — brand & landing system

Este arquivo define a linguagem compartilhada entre `legalops.club`, `legalops.work` e `legalops.dev`.

A regra principal é simples:

- `legalops.club` = **comunidade**
- `legalops.work` = **vagas**
- `legalops.dev` = **open source Legal Tech / construir junto**

Os três produtos devem parecer partes do mesmo ecossistema. Cada domínio tem uma função clara e não deve tentar vender a função dos outros dois.

## 1. Arquitetura do ecossistema

Toda landing pública deve tornar esta relação visível no primeiro viewport ou imediatamente depois dele:

`club / comunidade` · `work / vagas` · `dev / open source`

A navegação entre os domínios deve parecer uma troca de área dentro do mesmo produto-mãe, não uma visita a outra empresa.

A tese do ecossistema é que código sozinho deixou de ser a principal barreira para criar software. O diferencial do LegalOps está na combinação de comunidade, conhecimento vertical, problemas reais, distribuição e construção colaborativa.

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
- troca prática entre profissionais;
- problemas reais que podem virar produtos e projetos no `legalops.dev`.

Evitar usar `construir` como promessa principal. O Club é onde as pessoas e os problemas se encontram. Quando uma conversa leva a uma automação ou produto, o próximo passo natural é o `legalops.dev`.

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

Promessa principal:

> **Open source Legal Tech, built by the people who run Legal.**

O `legalops.dev` é a base open source do ecossistema. Não é principalmente um curso, um catálogo de ferramentas ou uma coleção de tutoriais. É onde problemas reais do jurídico viram produtos abertos que podem ser usados, adaptados, implantados e melhorados coletivamente.

Pode falar sobre:

- produtos open source;
- repositórios;
- código;
- issues e pull requests;
- contributors;
- roadmaps;
- demos e deploys;
- automações;
- integrações;
- agentes;
- APIs;
- dados;
- produtos internos;
- componentes reutilizáveis;
- documentação;
- governança dentro de projetos concretos.

Aprender continua sendo uma consequência importante de participar, mas não deve ser a promessa principal do Dev. A proposta é **construir junto** e criar uma base de Legal Tech que o mercado possa usar e evoluir.

Evitar abrir com jargão de implementação, como `instrumentar um fluxo`, `orquestrar uma jornada` ou perguntas que pressupõem que o visitante já sabe qual arquitetura quer construir.

Evitar também apresentar produtos futuros como se já estivessem disponíveis. Diferenciar claramente `disponível`, `em construção`, `proposto` e `roadmap`.

## 2. Como Club e Dev se conectam

O fluxo desejado é:

```text
problema real no jurídico
        ↓
conversa no legalops.club
        ↓
projeto / repo no legalops.dev
        ↓
contribuições da comunidade
        ↓
uso real
        ↓
feedback + produto melhor
```

O código é aberto. O efeito de rede vem das pessoas que entendem o problema, usam a solução, contribuem e ajudam a distribuí-la.

O `legalops.dev` deve permitir que uma pessoa entre em diferentes níveis:

- usar um produto;
- fazer deploy;
- adaptar para sua empresa;
- abrir uma issue;
- contribuir código;
- contribuir requisitos, testes, documentação ou conhecimento jurídico;
- propor um novo produto.

Não presumir que contributor significa developer. Legal Ops, advogados, profissionais de inovação, dados, segurança, produto e tecnologia também são contributors.

## 3. Marca

- Escrever sempre em minúsculas: `legalops.club`, `legalops.work`, `legalops.dev`.
- Usar `BrandWordmark` de `components/BrandLogo.tsx` nas superfícies React públicas.
- Wordmark: `legalops` + ponto coral + sufixo.
- Ponto: coral `#E88A6A`.
- Não usar a antiga ligatura/símbolo `op` como marca principal.
- Não usar robô, sparkle, estrela, terminal ou símbolo genérico de IA como logo.

## 4. Tokens

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
- Headlines: tracking negativo, frases curtas, normalmente em minúsculas, exceto quando a tagline oficial do Dev for usada exatamente como definida.
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

## 5. Regra de composição

A interface deve parecer editorial e orientada a produto.

Preferir:

- whitespace;
- hairlines;
- grids simples;
- listas e tabelas quando a informação é estrutural;
- screenshots, previews e dados reais do produto;
- estado real de repositórios e produtos no Dev;
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

## 6. Template obrigatório das landings

As três homes públicas devem seguir a mesma arquitetura.

### 1. Header do ecossistema

À esquerda: wordmark do domínio atual.

À direita:

- comunidade;
- vagas;
- open source;
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
- Dev: registry de produtos open source, repositórios, contributors, status, demos, documentação e roadmaps.

### 6. Próximo passo

CTA simples, ligada à ação principal daquele produto.

- Club: entrar na comunidade.
- Work: ver vagas / criar perfil.
- Dev: explorar produtos / abrir o código / contribuir.

## 7. Voz comercial

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
- contribua;
- use;
- adapte;
- faça deploy;
- teste;
- conecte.

### Evitar

- `instrumentar um fluxo`;
- `orquestrar a jornada`;
- `transformar sua jornada`;
- `revolucionar o jurídico`;
- `solução inteligente` sem função concreta;
- `AI-powered` como proposta de valor;
- `otimize seus processos` sem explicar quais processos e como;
- perguntas que exigem vocabulário técnico antes de apresentar o benefício.

## 8. Exemplos de primeira dobra

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

Micro-label: `legalops.dev / open source`

Headline oficial: `Open source Legal Tech, built by the people who run Legal.`

CTA primária: `explorar produtos`

CTA secundária: `contribuir no GitHub`

Produto no hero: preview de um produto/repositório real, com status, código, documentação e forma de contribuição.

## 9. Checklist antes de publicar

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
- Dev está vendendo open source Legal Tech e construção colaborativa?
- O Dev diferencia claramente o que existe do que está em roadmap?
- A página ainda funciona e comunica bem sem animação e sem efeitos?
