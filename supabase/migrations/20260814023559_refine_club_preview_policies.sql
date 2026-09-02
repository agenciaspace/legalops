-- Keep one SELECT policy per role/action and explicitly disable legacy classes.

DROP POLICY IF EXISTS community_posts_public_read ON public.community_posts;
DROP POLICY IF EXISTS community_posts_paid_read ON public.community_posts;

CREATE POLICY community_posts_public_read
  ON public.community_posts FOR SELECT TO anon
  USING (visibility = 'public');

CREATE POLICY community_posts_authenticated_read
  ON public.community_posts FOR SELECT TO authenticated
  USING (visibility = 'public' OR private.has_active_club_access());

DROP POLICY IF EXISTS community_summaries_public_read ON public.community_discussion_summaries;
DROP POLICY IF EXISTS community_summaries_paid_read ON public.community_discussion_summaries;

CREATE POLICY community_summaries_public_read
  ON public.community_discussion_summaries FOR SELECT TO anon
  USING (visibility = 'public');

CREATE POLICY community_summaries_authenticated_read
  ON public.community_discussion_summaries FOR SELECT TO authenticated
  USING (visibility = 'public' OR private.has_active_club_access());

CREATE POLICY community_courses_disabled
  ON public.community_courses FOR SELECT TO PUBLIC
  USING (false);

CREATE POLICY community_modules_disabled
  ON public.community_modules FOR SELECT TO PUBLIC
  USING (false);

CREATE POLICY community_lessons_disabled
  ON public.community_lessons FOR SELECT TO PUBLIC
  USING (false);

INSERT INTO public.community_posts
  (slug, author_name, author_role, category, title, body, visibility, is_pinned)
VALUES
  (
    'como-usar-as-discussoes-gerais', 'Equipe LegalOps', 'Curadoria', 'discussao',
    'Discussões gerais: comece pelo problema, não pela resposta',
    'Uma boa conversa de Legal Ops traz contexto, restrições e a decisão que precisa ser tomada. Use este espaço para desafios que atravessam mais de uma comunidade temática; a rede ajuda a encontrar o ângulo e os pares certos.',
    'public', false
  ),
  (
    'cases-playbooks-sem-teatro', 'Equipe LegalOps', 'Curadoria', 'cases',
    'Cases & playbooks: prática real, inclusive o que não funcionou',
    'Compartilhe ponto de partida, escolhas, obstáculos, resultado e o que faria diferente. O valor de um case está nos detalhes transferíveis — não em parecer perfeito.',
    'public', false
  )
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  visibility = EXCLUDED.visibility,
  updated_at = now();
;
