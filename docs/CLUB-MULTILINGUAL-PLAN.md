# Comunidade multilíngue — plano de implementação

Status: implementado; validação e liberação registradas em `CLUB-MULTILINGUAL-VERIFICATION.md`.
Data: 2026-09-18.
Idiomas confirmados por Leon: português, inglês e espanhol.

## Resultado esperado

Uma comunidade compartilhada. Cada membro publica no idioma em que prefere
escrever; os leitores recebem títulos, textos e comentários no idioma escolhido
na conta. Curtidas, respostas, links e identidade da publicação são os mesmos
para todos. Tradução é um recurso da comunidade gratuita.

Exemplo de aceite: uma pessoa publica em espanhol; Leon lê em português; um
membro que escolheu inglês lê em inglês. Leon responde em português e ambos
leem essa resposta em seus respectivos idiomas.

O texto exibe uma indicação discreta de tradução automática e a ação
“Ver original”, localizada no idioma do leitor. O original é preservado e é a
fonte da edição. A tradução não pode alterar jurisdição, moeda ou contexto legal.

## Situação inicial (antes da implementação)

- `lib/club-locale.ts` oferece `pt-BR` e `en`; a escolha fica no cookie
  `club-locale`. Não existe preferência de idioma persistida no perfil.
- O feed renderiza `community_posts.title/body` e comentários diretamente;
  ainda não há detecção de idioma, tradução ou armazenamento de traduções.
- Cadastro, formulário de entrada e perfil têm textos fixos em português.
  Interesses usam rótulos em português também nas validações do banco.
- Datas de eventos usam `America/Sao_Paulo`. A busca do feed remove caracteres
  fora de um conjunto latino e procura somente o texto original.
- O telefone já admite formato internacional no banco. Precisamos adaptar
  orientação e exemplos, preservando essa compatibilidade.

## 1. Idioma da conta e entrada internacional

Adicionar `preferred_locale`, `country_code` e `timezone` ao perfil, com leitura
e alteração limitadas ao próprio usuário. Idioma e país são escolhas separadas.
Oferecer Português, English e Español, com códigos `pt-BR`, `en` e `es`.

Para membros autenticados, o perfil é a fonte de verdade; o cookie serve como
apoio à renderização. Antes do login, usar a escolha explícita do visitante,
depois a preferência compatível do navegador. Quando não houver correspondência,
oferecer uma escolha clara. No primeiro preenchimento do perfil, preservar a
escolha atual; não redefinir todos os membros para português durante a migração.

Aplicar a preferência ao cadastro, confirmação de email, login, recuperação de
senha, regras, perfil, navegação, estados vazios, erros e notificações. Os emails
precisam carregar o idioma escolhido mesmo sem sessão/cookie no dispositivo que
abre a mensagem. Verificar separadamente os templates do Supabase Auth e os
emails enviados pela aplicação.

País e cidade/região substituem a suposição de localização brasileira. Fuso é
sugerido pelo navegador e pode ser corrigido; eventos mostram o horário local e
identificam o fuso. Não introduzir exigência de CPF, estado brasileiro ou +55.
Revisar nomes Unicode e URLs internacionais de LinkedIn na entrada e na edição.
Manter os mesmos critérios profissionais e permissões de acesso.

Converter opções controladas, como interesses, em identificadores estáveis com
rótulos traduzidos. Migrar os valores conhecidos sem perder interesses antigos
ou campos de texto livre. Interface traduzida não pode quebrar `join_club`.

## 2. Tradução persistida e processamento confiável

Preservar o original em sua tabela atual. Registrar idioma de origem detectado
e uma revisão/hash do conteúdo. Não presumir que o idioma escrito é o idioma do
perfil; permitir corrigir a detecção, inclusive para textos curtos ou mistos.

Criar traduções vinculadas ao conteúdo, idioma de destino e revisão. A chave
única dessa combinação impede traduções duplicadas. Guardar estado, texto,
versão do modelo/instrução, tentativas e datas. Usar referências que permitam
exclusão em cascata e não deixem traduções órfãs.

Publicar ou editar grava o conteúdo e uma tarefa durável na mesma transação.
Um consumidor na Cloudflare traduz em segundo plano, inicialmente para os
outros idiomas suportados. Usar fila com deduplicação, tentativas limitadas e
registro de falha; uma reconciliação encontra tarefas que não chegaram ao
consumidor. A publicação original não depende da disponibilidade do modelo.

Reaproveitar o OpenRouter existente. Escolher um modelo fixo após um piloto de
qualidade, tempo e custo, evitando depender de roteamento automático variável
para definir a qualidade das traduções. Manter as configurações existentes de
privacidade. Enviar somente o texto necessário; conteúdo do post é dado a
traduzir, nunca instrução para executar ações.

Validar a estrutura da resposta e a preservação de URLs, menções, nomes próprios,
números, moedas, código e formatação. Adotar um glossário pequeno de Legal Ops
e CLM, validado com textos reais autorizados ou exemplos sintéticos.

O mesmo texto traduzido atende todos os leitores autorizados naquele idioma.
Não fazer uma chamada de IA por visita. O consumo fica separado da cota de
30 perguntas do agente. Medir custo por volume de texto e definir orçamento,
concorrência e limites antes da liberação geral; não assumir um custo mensal.

## 3. Leitura no idioma escolhido

Um serviço de leitura entrega original ou tradução da revisão atual conforme
o idioma da conta. Aplicar primeiro a título, corpo, comentários, subtemas e
textos de eventos exibidos no feed; incluir apresentações profissionais para
evitar cartões parcialmente traduzidos. Nomes e nomes de organizações permanecem.

Quando a tradução estiver pronta, ela já aparece na primeira renderização,
sem piscar o original antes. Ao trocar o idioma, invalidar o conteúdo exibido e
desconsiderar respostas atrasadas do idioma anterior. Links compartilhados
continuam apontando para a mesma publicação e respeitam o idioma do destinatário.

“Sempre no idioma escolhido” significa que o sistema não substitui silenciosamente
uma tradução ausente pelo texto em outro idioma. Durante o processamento, mostrar
um estado localizado; em falha, explicar a indisponibilidade e oferecer nova
tentativa e “Ver original” por escolha explícita. Não prometer disponibilidade
instantânea nem tradução infalível.

Editar invalida a tradução anterior imediatamente. O leitor não recebe uma
tradução da versão antiga como se fosse atual. Excluir remove traduções e tarefas;
um resultado atrasado não pode restaurar conteúdo excluído. Ações de moderação
se aplicam ao conteúdo e a todas as suas traduções.

Permissões de traduções seguem as do original em cada leitura, inclusive após
mudança de visibilidade ou de acesso do membro. Não criar um cache público de
conteúdo privado. Acrescentar “Reportar problema na tradução” ligado à revisão.

## 4. Busca, acervo e demais superfícies

Preparar as traduções dos posts e comentários existentes antes da liberação
geral, com prioridade para o feed recente. Fazer a migração em lotes retomáveis,
sem republicar posts, disparar notificações ou alterar autoria/data.

A busca deve procurar no original e na tradução do idioma selecionado, aceitar
Unicode e retornar cada publicação uma vez, sempre com as permissões corretas.
Categorias permanecem compartilhadas. Não separar feeds por nacionalidade nem
esconder conteúdo estrangeiro por padrão.

Conferir também páginas de eventos, diretório, resumos e agente pessoal. O agente
deve responder em espanhol quando escolhido, e os resumos visíveis devem ser
servidos no idioma do leitor. Tradução de texto não converte moeda ou adapta
regras jurídicas para outro país.

Arquivos anexos, texto dentro de imagens, áudio/vídeo, documentos colaborativos
e sites externos ficam fora desta primeira entrega de tradução automática.
Identificar o idioma original quando conhecido. Não anunciar esses conteúdos
como traduzidos. Checkout internacional do Pro é uma decisão separada; o PIX
não deve impedir entrada e participação na comunidade gratuita.

## 5. Aceite e liberação

Testar com três contas escolhendo idiomas diferentes: publicação, resposta,
troca de idioma, login em outro dispositivo, link direto e busca. Repetir o
cadastro completo e recuperação de senha nos três idiomas, sem dados brasileiros
obrigatórios. Revisar a linguagem das telas, não somente o texto dos posts.

Cobrir edição com tradução em andamento, exclusão, mudança de permissão, falha
e retorno do provedor, mensagens duplicadas da fila, textos mistos e conteúdos
com números, links e termos jurídicos. Validar que traduções privadas não são
acessíveis por usuários sem direito ao original.

Verificar celular de 320/390 px, tablet e desktop com textos longos nos três
idiomas. Medir cobertura de tradução, espera, erros, custo e relatos de qualidade.
Liberar primeiro a contas de teste, depois a um piloto e então a todos. Um
controle de ativação permite interromper a geração e informar indisponibilidade
no idioma selecionado sem apagar originais ou traduções já conferidas.

Ordem de entrega: preferências e cadastro → processamento e acervo → feed e
comentários → busca/demais superfícies → piloto e liberação geral. A experiência
multilíngue completa só é anunciada depois da validação de ponta a ponta.

## Decisões de implementação

- Interesses existentes continuam sendo as chaves canônicas; seus rótulos são traduzidos na interface. Isso mantém `join_club` e os perfis antigos compatíveis sem reescrever dados.
- A fila durável está no Postgres, gravada por trigger na transação do original. Cron Cloudflare executa três leases por minuto, com até três tentativas e trava transacional de orçamento.
- `openai/gpt-4.1-mini` é fixo. A configuração inicial reserva USD 0,10 por chamada e limita o orçamento diário a USD 1; consumo real conhecido substitui a reserva. Erros sem custo informado mantêm a reserva. Não é estimativa de mensalidade.
- Conteúdo compartilhado cobre posts, comentários, subtemas, eventos, apresentações profissionais, resumos e legendas de fotos/documentos. Arquivos e nomes de arquivo não são traduzidos.
- O original permanece intacto. A correção de idioma em posts/comentários pertence ao autor e invalida as traduções da revisão anterior.
