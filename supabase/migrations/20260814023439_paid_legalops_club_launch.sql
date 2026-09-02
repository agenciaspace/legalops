-- Paid LegalOps Club access, launch cohorts and topic-led communities.

ALTER TABLE public.community_members
  ADD COLUMN IF NOT EXISTS club_plan text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS club_access_status text NOT NULL DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS club_access_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS club_member_number integer,
  ADD COLUMN IF NOT EXISTS club_price_cents integer,
  ADD COLUMN IF NOT EXISTS public_headline text,
  ADD COLUMN IF NOT EXISTS public_bio text,
  ADD COLUMN IF NOT EXISTS organization_name text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS profile_verification_status text NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS profile_verified_at timestamptz;

ALTER TABLE public.account_profiles
  ADD COLUMN IF NOT EXISTS organization_name text;

ALTER TABLE public.community_members
  DROP CONSTRAINT IF EXISTS community_members_club_plan_check,
  ADD CONSTRAINT community_members_club_plan_check CHECK (
    club_plan IN ('free', 'founder_199', 'founder_299', 'pioneer_499', 'launch_699', 'legacy')
  ),
  DROP CONSTRAINT IF EXISTS community_members_club_access_status_check,
  ADD CONSTRAINT community_members_club_access_status_check CHECK (
    club_access_status IN ('inactive', 'active', 'past_due', 'canceled', 'complimentary')
  ),
  DROP CONSTRAINT IF EXISTS community_members_club_member_number_check,
  ADD CONSTRAINT community_members_club_member_number_check CHECK (club_member_number IS NULL OR club_member_number > 0),
  DROP CONSTRAINT IF EXISTS community_members_club_price_cents_check,
  ADD CONSTRAINT community_members_club_price_cents_check CHECK (club_price_cents IS NULL OR club_price_cents > 0),
  DROP CONSTRAINT IF EXISTS community_members_profile_verification_status_check,
  ADD CONSTRAINT community_members_profile_verification_status_check CHECK (
    profile_verification_status IN ('unverified', 'pending', 'verified', 'rejected')
  );

CREATE UNIQUE INDEX IF NOT EXISTS community_members_club_member_number_idx
  ON public.community_members (club_member_number)
  WHERE club_member_number IS NOT NULL;

-- Preserve everyone who was already inside the Club before the paid launch.
UPDATE public.community_members
SET club_plan = 'legacy',
    club_access_status = 'complimentary'
WHERE club_plan = 'free'
  AND club_access_status = 'inactive'
  AND created_at < now();

-- Keep the Club directory in sync with the source professional profile.
CREATE OR REPLACE FUNCTION public.sync_community_member_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.community_members (
    user_id,
    display_name,
    "current_role",
    areas_of_expertise,
    public_headline,
    public_bio,
    organization_name,
    linkedin_url,
    created_at,
    updated_at
  )
  VALUES (
    NEW.user_id,
    COALESCE(NULLIF(NEW.full_name, ''), 'Membro LegalOps'),
    NEW."current_role",
    COALESCE(NEW.areas_of_expertise, '{}'),
    NEW.public_headline,
    NEW.public_bio,
    NEW.organization_name,
    NEW.linkedin_url,
    COALESCE(NEW.created_at, now()),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    "current_role" = EXCLUDED."current_role",
    areas_of_expertise = EXCLUDED.areas_of_expertise,
    public_headline = EXCLUDED.public_headline,
    public_bio = EXCLUDED.public_bio,
    organization_name = EXCLUDED.organization_name,
    linkedin_url = EXCLUDED.linkedin_url,
    updated_at = now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_community_member_profile() FROM PUBLIC;

DROP TRIGGER IF EXISTS account_profiles_sync_community_member ON public.account_profiles;
CREATE TRIGGER account_profiles_sync_community_member
  AFTER INSERT OR UPDATE OF full_name, "current_role", areas_of_expertise, public_headline, public_bio, organization_name, linkedin_url
  ON public.account_profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_community_member_profile();

UPDATE public.community_members member
SET public_headline = profile.public_headline,
    public_bio = profile.public_bio,
    organization_name = profile.organization_name,
    linkedin_url = profile.linkedin_url,
    profile_verification_status = CASE
      WHEN profile.linkedin_url IS NOT NULL AND profile.linkedin_data IS NOT NULL THEN 'verified'
      WHEN profile.linkedin_url IS NOT NULL THEN 'pending'
      ELSE 'unverified'
    END,
    profile_verified_at = CASE
      WHEN profile.linkedin_url IS NOT NULL AND profile.linkedin_data IS NOT NULL THEN now()
      ELSE NULL
    END,
    updated_at = now()
FROM public.account_profiles profile
WHERE profile.user_id = member.user_id;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.has_active_club_access()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.community_members member
    WHERE member.user_id = (SELECT auth.uid())
      AND member.club_access_status IN ('active', 'complimentary')
      AND (
        member.club_access_expires_at IS NULL
        OR member.club_access_expires_at > now()
      )
  );
$$;

REVOKE ALL ON FUNCTION private.has_active_club_access() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_active_club_access() TO authenticated;

-- Members can maintain profile fields, never their own billing/access fields.
REVOKE UPDATE ON public.community_members FROM authenticated;
GRANT UPDATE (display_name, "current_role", areas_of_expertise, public_headline, public_bio, organization_name, linkedin_url, updated_at)
  ON public.community_members TO authenticated;

DROP POLICY IF EXISTS community_members_member_read ON public.community_members;
DROP POLICY IF EXISTS community_members_owner_update ON public.community_members;

CREATE POLICY community_members_paid_or_self_read
  ON public.community_members FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id OR private.has_active_club_access());

CREATE POLICY community_members_owner_update
  ON public.community_members FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Public posts are the free preview. Everything else requires active access.
DROP POLICY IF EXISTS community_posts_public_read ON public.community_posts;
DROP POLICY IF EXISTS community_posts_member_read ON public.community_posts;
DROP POLICY IF EXISTS community_posts_member_insert ON public.community_posts;
DROP POLICY IF EXISTS community_posts_owner_update ON public.community_posts;
DROP POLICY IF EXISTS community_posts_owner_delete ON public.community_posts;

CREATE POLICY community_posts_public_read
  ON public.community_posts FOR SELECT TO anon, authenticated
  USING (visibility = 'public');

CREATE POLICY community_posts_paid_read
  ON public.community_posts FOR SELECT TO authenticated
  USING (private.has_active_club_access());

CREATE POLICY community_posts_paid_insert
  ON public.community_posts FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = author_id
    AND visibility = 'members'
    AND private.has_active_club_access()
  );

CREATE POLICY community_posts_paid_owner_update
  ON public.community_posts FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = author_id AND private.has_active_club_access())
  WITH CHECK (
    (SELECT auth.uid()) = author_id
    AND visibility = 'members'
    AND private.has_active_club_access()
  );

CREATE POLICY community_posts_paid_owner_delete
  ON public.community_posts FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = author_id AND private.has_active_club_access());

DROP POLICY IF EXISTS community_comments_member_read ON public.community_comments;
DROP POLICY IF EXISTS community_comments_member_insert ON public.community_comments;
DROP POLICY IF EXISTS community_comments_owner_update ON public.community_comments;
DROP POLICY IF EXISTS community_comments_owner_delete ON public.community_comments;

CREATE POLICY community_comments_paid_read
  ON public.community_comments FOR SELECT TO authenticated
  USING (private.has_active_club_access());

CREATE POLICY community_comments_paid_insert
  ON public.community_comments FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = author_id AND private.has_active_club_access());

CREATE POLICY community_comments_paid_owner_update
  ON public.community_comments FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = author_id AND private.has_active_club_access())
  WITH CHECK ((SELECT auth.uid()) = author_id AND private.has_active_club_access());

CREATE POLICY community_comments_paid_owner_delete
  ON public.community_comments FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = author_id AND private.has_active_club_access());

DROP POLICY IF EXISTS community_likes_member_read ON public.community_post_likes;
DROP POLICY IF EXISTS community_likes_owner_insert ON public.community_post_likes;
DROP POLICY IF EXISTS community_likes_owner_delete ON public.community_post_likes;

CREATE POLICY community_likes_paid_read
  ON public.community_post_likes FOR SELECT TO authenticated
  USING (private.has_active_club_access());

CREATE POLICY community_likes_paid_insert
  ON public.community_post_likes FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id AND private.has_active_club_access());

CREATE POLICY community_likes_paid_delete
  ON public.community_post_likes FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id AND private.has_active_club_access());

-- The Club has no classes. Legacy classroom tables remain inaccessible while
-- live events stay inside the paid area.
DROP POLICY IF EXISTS community_courses_public_read ON public.community_courses;
DROP POLICY IF EXISTS community_modules_public_read ON public.community_modules;
DROP POLICY IF EXISTS community_lessons_public_read ON public.community_lessons;
DROP POLICY IF EXISTS community_events_public_read ON public.community_events;
DROP POLICY IF EXISTS community_courses_paid_read ON public.community_courses;
DROP POLICY IF EXISTS community_modules_paid_read ON public.community_modules;
DROP POLICY IF EXISTS community_lessons_paid_read ON public.community_lessons;

REVOKE SELECT ON public.community_courses FROM anon, authenticated;
REVOKE SELECT ON public.community_modules FROM anon, authenticated;
REVOKE SELECT ON public.community_lessons FROM anon, authenticated;
REVOKE SELECT ON public.community_events FROM anon;

CREATE POLICY community_events_paid_read
  ON public.community_events FOR SELECT TO authenticated
  USING (is_published = true AND private.has_active_club_access());

CREATE TABLE IF NOT EXISTS public.community_discussion_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL DEFAULT 'discussao',
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 180),
  summary text NOT NULL CHECK (char_length(summary) BETWEEN 3 AND 10000),
  key_points text[] NOT NULL DEFAULT '{}',
  source_post_count integer NOT NULL DEFAULT 0 CHECK (source_post_count >= 0),
  source_comment_count integer NOT NULL DEFAULT 0 CHECK (source_comment_count >= 0),
  model text NOT NULL DEFAULT 'unknown',
  visibility text NOT NULL DEFAULT 'members' CHECK (visibility IN ('public', 'members')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS community_discussion_summaries_period_idx
  ON public.community_discussion_summaries (period_end DESC, category);

ALTER TABLE public.community_discussion_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY community_summaries_public_read
  ON public.community_discussion_summaries FOR SELECT TO anon, authenticated
  USING (visibility = 'public');

CREATE POLICY community_summaries_paid_read
  ON public.community_discussion_summaries FOR SELECT TO authenticated
  USING (private.has_active_club_access());

GRANT SELECT ON public.community_discussion_summaries TO anon, authenticated;

ALTER TABLE public.community_posts
  DROP CONSTRAINT IF EXISTS community_posts_category_check,
  ADD CONSTRAINT community_posts_category_check CHECK (
    category IN (
      'anuncio',
      'apresentacoes',
      'discussao',
      'cases',
      'ia-automacao',
      'dados-metricas',
      'contratos-clm',
      'processos-projetos',
      'ferramentas',
      'financeiro-fornecedores',
      'governanca-conhecimento',
      'estrategia-maturidade',
      'modelos-entrega',
      'carreira'
    )
  );

-- One useful public starting point per topic. Full discussion stays member-only.
INSERT INTO public.community_posts
  (slug, author_name, author_role, category, title, body, visibility, is_pinned)
VALUES
  (
    'ia-juridica-do-piloto-a-escala', 'Equipe LegalOps', 'Curadoria', 'ia-automacao',
    'IA jurídica: do piloto isolado à operação que escala',
    'Comece pelo fluxo, não pela ferramenta. Mapeie a tarefa, defina o risco aceitável, escolha uma métrica de qualidade e compare o antes e o depois. Na comunidade, abrimos playbooks de casos de uso, governança e automações que já chegaram à rotina.',
    'public', true
  ),
  (
    'metricas-que-mudam-decisoes', 'Equipe LegalOps', 'Curadoria', 'dados-metricas',
    'Métricas que mudam decisões — e não apenas decoram dashboards',
    'Volume sozinho raramente explica a operação. Combine demanda, tempo de ciclo, capacidade, risco e resultado para enxergar onde agir. O espaço reúne modelos de indicadores, dashboards e histórias por trás dos números.',
    'public', true
  ),
  (
    'clm-alem-da-implantacao', 'Equipe LegalOps', 'Curadoria', 'contratos-clm',
    'CLM além da implantação: adoção, fluxo e valor',
    'Um CLM não termina no go-live. A conversa decisiva passa por adesão do negócio, qualidade dos dados, exceções e tempo até assinatura. Compartilhamos diagnósticos e padrões para evoluir processo, tecnologia e comportamento.',
    'public', true
  ),
  (
    'processos-projetos-sem-burocracia', 'Equipe LegalOps', 'Curadoria', 'processos-projetos',
    'Processos e projetos sem transformar Legal Ops em burocracia',
    'O objetivo do processo é reduzir atrito e tornar decisões repetíveis. Aqui discutimos intake, priorização, desenho de fluxo, gestão de portfólio e rituais leves para projetos jurídicos.',
    'public', false
  ),
  (
    'spend-fornecedores-escritorios', 'Equipe LegalOps', 'Curadoria', 'financeiro-fornecedores',
    'Spend jurídico: como conectar orçamento, escritórios e valor entregue',
    'Gestão financeira útil vai além de cortar custo. Ela conecta previsão, escopo, performance e relacionamento com escritórios e fornecedores. Este espaço concentra benchmarks, scorecards e modelos de gestão.',
    'public', false
  ),
  (
    'governanca-conhecimento-vivo', 'Equipe LegalOps', 'Curadoria', 'governanca-conhecimento',
    'Governança e conhecimento que sobrevivem à rotina',
    'Política sem uso e repositório sem busca não criam conhecimento. A comunidade explora taxonomias, retenção, segurança, playbooks e mecanismos para transformar experiência dispersa em capacidade institucional.',
    'public', false
  ),
  (
    'maturidade-legalops-roadmap', 'Equipe LegalOps', 'Curadoria', 'estrategia-maturidade',
    'Maturidade em Legal Ops: do diagnóstico ao roadmap financiável',
    'Um bom roadmap traduz ambição em capacidades, dependências e resultados observáveis. Trocamos modelos de diagnóstico, business cases e formas de conectar a operação à estratégia do negócio.',
    'public', false
  ),
  (
    'modelos-de-entrega-juridica', 'Equipe LegalOps', 'Curadoria', 'modelos-entrega',
    'Modelos de entrega: quem deve fazer o quê no jurídico?',
    'Equipe interna, escritório, ALSP, automação ou autosserviço: a resposta depende de risco, repetição e contexto. Este espaço organiza decisões de sourcing, desenho de serviço e experiência do cliente interno.',
    'public', false
  ),
  (
    'pessoas-carreira-lideranca', 'Equipe LegalOps', 'Curadoria', 'carreira',
    'Pessoas, carreira e liderança na nova operação jurídica',
    'Legal Ops cresce quando competências, papéis e incentivos acompanham a transformação. Conversamos sobre carreira, desenho de equipe, influência, treinamento e saúde organizacional.',
    'public', false
  )
ON CONFLICT (slug) DO UPDATE SET
  category = EXCLUDED.category,
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  visibility = EXCLUDED.visibility,
  is_pinned = EXCLUDED.is_pinned,
  updated_at = now();

INSERT INTO public.community_discussion_summaries
  (category, period_start, period_end, title, summary, key_points, source_post_count, source_comment_count, model, visibility)
VALUES
  (
    'discussao',
    date_trunc('week', now()) - interval '7 days',
    date_trunc('week', now()),
    'Radar LegalOps: os temas que estão movendo a operação',
    'As conversas desta edição convergem em três frentes: transformar pilotos de IA em fluxos governados, medir resultados que sustentem decisões e tratar a adoção como parte central de qualquer mudança. A síntese completa conecta os argumentos, práticas e perguntas que merecem continuar na próxima semana.',
    ARRAY[
      'IA começa pelo fluxo e por critérios claros de qualidade e risco.',
      'Métricas úteis conectam demanda, capacidade, tempo, risco e resultado.',
      'Adoção deve ser desenhada desde o início, não medida apenas depois do go-live.'
    ],
    3,
    0,
    'seed-curated',
    'public'
  )
ON CONFLICT (category, period_start, period_end) DO NOTHING;
;
