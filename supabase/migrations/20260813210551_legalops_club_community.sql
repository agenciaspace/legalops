-- LegalOps Club: professional community, classroom, calendar and gamification.
-- This migration also reconciles profile columns that exist in the repository
-- but were never applied to the production project.

ALTER TABLE public.account_profiles
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS "current_role" text,
  ADD COLUMN IF NOT EXISTS professional_type text,
  ADD COLUMN IF NOT EXISTS years_experience integer,
  ADD COLUMN IF NOT EXISTS areas_of_expertise text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS linkedin_data jsonb,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS public_headline text,
  ADD COLUMN IF NOT EXISTS public_bio text,
  ADD COLUMN IF NOT EXISTS skills text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS certifications text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tools_used text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS open_to_opportunities boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS preferred_locations text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

-- These accounts predate the onboarding flow in production. Keep them active;
-- new profiles still receive the false default from the column definition.
UPDATE public.account_profiles
SET onboarding_completed = true
WHERE onboarding_completed = false;

ALTER TABLE public.account_profiles
  DROP CONSTRAINT IF EXISTS account_profiles_professional_type_check;

ALTER TABLE public.account_profiles
  ADD CONSTRAINT account_profiles_professional_type_check
  CHECK (
    professional_type IS NULL OR professional_type IN (
      'law_firm', 'legal_dept', 'public_sector', 'freelance', 'other'
    )
  );

ALTER TABLE public.account_profiles
  DROP CONSTRAINT IF EXISTS account_profiles_tier_check;

ALTER TABLE public.account_profiles
  ADD CONSTRAINT account_profiles_tier_check
  CHECK (tier IN ('free', 'paid', 'pro', 'expert'));

CREATE TABLE IF NOT EXISTS public.community_members (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT 'Membro LegalOps',
  "current_role" text,
  areas_of_expertise text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY community_members_member_read
  ON public.community_members FOR SELECT TO authenticated
  USING (true);
CREATE POLICY community_members_owner_update
  ON public.community_members FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

GRANT SELECT, UPDATE ON public.community_members TO authenticated;

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
    created_at,
    updated_at
  )
  VALUES (
    NEW.user_id,
    COALESCE(NULLIF(NEW.full_name, ''), 'Membro LegalOps'),
    NEW."current_role",
    COALESCE(NEW.areas_of_expertise, '{}'),
    COALESCE(NEW.created_at, now()),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    "current_role" = EXCLUDED."current_role",
    areas_of_expertise = EXCLUDED.areas_of_expertise,
    updated_at = now();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_community_member_profile() FROM PUBLIC;

DROP TRIGGER IF EXISTS account_profiles_sync_community_member ON public.account_profiles;
CREATE TRIGGER account_profiles_sync_community_member
  AFTER INSERT OR UPDATE OF full_name, "current_role", areas_of_expertise
  ON public.account_profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_community_member_profile();

INSERT INTO public.community_members (
  user_id,
  display_name,
  "current_role",
  areas_of_expertise,
  created_at,
  updated_at
)
SELECT
  profile.user_id,
  COALESCE(NULLIF(profile.full_name, ''), 'Membro LegalOps'),
  profile."current_role",
  profile.areas_of_expertise,
  profile.created_at,
  now()
FROM public.account_profiles profile
ON CONFLICT (user_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  "current_role" = EXCLUDED."current_role",
  areas_of_expertise = EXCLUDED.areas_of_expertise,
  updated_at = now();

CREATE TABLE IF NOT EXISTS public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text NOT NULL DEFAULT 'Equipe LegalOps',
  author_role text,
  category text NOT NULL DEFAULT 'discussao'
    CHECK (category IN ('anuncio', 'apresentacoes', 'discussao', 'carreira', 'ferramentas', 'cases')),
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 180),
  body text NOT NULL CHECK (char_length(body) BETWEEN 3 AND 10000),
  visibility text NOT NULL DEFAULT 'members'
    CHECK (visibility IN ('public', 'members')),
  is_pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS community_posts_created_idx
  ON public.community_posts (is_pinned DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS community_posts_author_idx
  ON public.community_posts (author_id);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY community_posts_public_read
  ON public.community_posts FOR SELECT TO anon
  USING (visibility = 'public');
CREATE POLICY community_posts_member_read
  ON public.community_posts FOR SELECT TO authenticated
  USING (true);
CREATE POLICY community_posts_member_insert
  ON public.community_posts FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = author_id);
CREATE POLICY community_posts_owner_update
  ON public.community_posts FOR UPDATE TO authenticated
  USING ((select auth.uid()) = author_id)
  WITH CHECK ((select auth.uid()) = author_id);
CREATE POLICY community_posts_owner_delete
  ON public.community_posts FOR DELETE TO authenticated
  USING ((select auth.uid()) = author_id);

GRANT SELECT ON public.community_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_posts TO authenticated;

CREATE TABLE IF NOT EXISTS public.community_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 3000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS community_comments_post_idx
  ON public.community_comments (post_id, created_at);
CREATE INDEX IF NOT EXISTS community_comments_author_idx
  ON public.community_comments (author_id);

ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY community_comments_member_read
  ON public.community_comments FOR SELECT TO authenticated
  USING (true);
CREATE POLICY community_comments_member_insert
  ON public.community_comments FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = author_id);
CREATE POLICY community_comments_owner_update
  ON public.community_comments FOR UPDATE TO authenticated
  USING ((select auth.uid()) = author_id)
  WITH CHECK ((select auth.uid()) = author_id);
CREATE POLICY community_comments_owner_delete
  ON public.community_comments FOR DELETE TO authenticated
  USING ((select auth.uid()) = author_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_comments TO authenticated;

CREATE TABLE IF NOT EXISTS public.community_post_likes (
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS community_post_likes_user_idx
  ON public.community_post_likes (user_id);

ALTER TABLE public.community_post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY community_likes_member_read
  ON public.community_post_likes FOR SELECT TO authenticated
  USING (true);
CREATE POLICY community_likes_owner_insert
  ON public.community_post_likes FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY community_likes_owner_delete
  ON public.community_post_likes FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

GRANT SELECT, INSERT, DELETE ON public.community_post_likes TO authenticated;

CREATE TABLE IF NOT EXISTS public.community_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  emoji text NOT NULL DEFAULT '📘',
  accent text NOT NULL DEFAULT 'orange',
  level_label text NOT NULL DEFAULT 'Todos os níveis',
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.community_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY community_courses_public_read
  ON public.community_courses FOR SELECT TO anon, authenticated
  USING (is_published = true);

GRANT SELECT ON public.community_courses TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.community_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.community_courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, sort_order)
);

ALTER TABLE public.community_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY community_modules_public_read
  ON public.community_modules FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.community_courses course
      WHERE course.id = course_id AND course.is_published = true
    )
  );

GRANT SELECT ON public.community_modules TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.community_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.community_modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  summary text,
  content text,
  duration_minutes integer NOT NULL DEFAULT 8 CHECK (duration_minutes > 0),
  video_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (module_id, sort_order)
);

ALTER TABLE public.community_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY community_lessons_public_read
  ON public.community_lessons FOR SELECT TO anon, authenticated
  USING (
    is_published = true AND EXISTS (
      SELECT 1
      FROM public.community_modules module
      JOIN public.community_courses course ON course.id = module.course_id
      WHERE module.id = module_id AND course.is_published = true
    )
  );

GRANT SELECT ON public.community_lessons TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.community_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  host_name text NOT NULL DEFAULT 'LegalOps Club',
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  location_label text NOT NULL DEFAULT 'Online',
  location_url text,
  event_type text NOT NULL DEFAULT 'encontro'
    CHECK (event_type IN ('encontro', 'aula', 'office-hours', 'networking')),
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS community_events_starts_idx
  ON public.community_events (starts_at);

ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY community_events_public_read
  ON public.community_events FOR SELECT TO anon, authenticated
  USING (is_published = true);

GRANT SELECT ON public.community_events TO anon, authenticated;

CREATE OR REPLACE VIEW public.community_leaderboard
WITH (security_invoker = true)
AS
SELECT
  scored.user_id,
  scored.display_name,
  scored."current_role",
  scored.points,
  CASE
    WHEN scored.points >= 155 THEN 5
    WHEN scored.points >= 65 THEN 4
    WHEN scored.points >= 20 THEN 3
    WHEN scored.points >= 5 THEN 2
    ELSE 1
  END AS level
FROM (
  SELECT
    member.user_id,
    member.display_name,
    member."current_role",
    (
      (SELECT count(*) FROM public.community_posts post WHERE post.author_id = member.user_id) * 5
      + (SELECT count(*) FROM public.community_comments comment WHERE comment.author_id = member.user_id) * 2
      + (
        SELECT count(*)
        FROM public.community_post_likes post_like
        JOIN public.community_posts liked_post ON liked_post.id = post_like.post_id
        WHERE liked_post.author_id = member.user_id
      )
    )::integer AS points
  FROM public.community_members member
) scored;

REVOKE ALL ON public.community_leaderboard FROM anon;
GRANT SELECT ON public.community_leaderboard TO authenticated;

INSERT INTO public.community_posts
  (slug, author_name, author_role, category, title, body, visibility, is_pinned, created_at)
VALUES
  (
    'bem-vindos-ao-legalops-club',
    'Equipe LegalOps',
    'Admin',
    'anuncio',
    'Bem-vindos ao LegalOps Club',
    'Esta é a casa de quem constrói operações jurídicas melhores. Apresente-se, compartilhe o que está implementando e traga as perguntas que não cabem em um post genérico de LinkedIn.',
    'public',
    true,
    '2026-08-13T12:00:00Z'
  ),
  (
    'apresente-se-em-tres-linhas',
    'Equipe LegalOps',
    'Community host',
    'apresentacoes',
    'Comece aqui: apresente-se em três linhas',
    'Conte em que tipo de operação jurídica você atua, qual problema está tentando resolver agora e uma ferramenta que faz parte do seu dia a dia.',
    'members',
    false,
    '2026-08-13T13:00:00Z'
  ),
  (
    'stack-legalops-2026',
    'Equipe LegalOps',
    'Curadoria',
    'ferramentas',
    'Qual ferramenta realmente mudou sua operação em 2026?',
    'Vale CLM, automação, BI, IA ou uma planilha muito bem construída. Compartilhe o caso de uso — não apenas o nome da ferramenta.',
    'public',
    false,
    '2026-08-13T14:00:00Z'
  )
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  visibility = EXCLUDED.visibility,
  is_pinned = EXCLUDED.is_pinned,
  updated_at = now();

INSERT INTO public.community_courses
  (slug, title, description, emoji, accent, level_label, sort_order, is_published)
VALUES
  ('fundamentos-legal-ops', 'Fundamentos de Legal Operations', 'Do diagnóstico da operação aos primeiros indicadores, com uma linguagem prática.', '🧭', 'orange', 'Comece aqui', 1, true),
  ('clm-na-pratica', 'CLM na prática', 'Desenhe o ciclo contratual, escolha tecnologia e aumente a adoção sem travar o jurídico.', '📑', 'violet', 'Intermediário', 2, true),
  ('ia-juridico', 'IA aplicada ao jurídico', 'Casos de uso, governança e implementação de IA para times jurídicos.', '✦', 'emerald', 'Atualizado em 2026', 3, true)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  emoji = EXCLUDED.emoji,
  accent = EXCLUDED.accent,
  level_label = EXCLUDED.level_label,
  sort_order = EXCLUDED.sort_order,
  is_published = true,
  updated_at = now();

INSERT INTO public.community_modules (course_id, title, description, sort_order)
SELECT course.id, seed.title, seed.description, seed.sort_order
FROM public.community_courses course
JOIN (
  VALUES
    ('fundamentos-legal-ops', '1. O papel de Legal Ops', 'Mandato, maturidade e alinhamento com o negócio.', 1),
    ('fundamentos-legal-ops', '2. Diagnóstico e prioridades', 'Como sair de uma lista infinita para um roadmap executável.', 2),
    ('clm-na-pratica', '1. Antes da tecnologia', 'Processo, dados e pessoas antes da ferramenta.', 1),
    ('clm-na-pratica', '2. Adoção e métricas', 'Implantação que o negócio realmente usa.', 2),
    ('ia-juridico', '1. Casos de uso seguros', 'Onde a IA gera valor e onde exige cautela.', 1),
    ('ia-juridico', '2. Piloto em 30 dias', 'Do problema ao experimento mensurável.', 2)
) AS seed(course_slug, title, description, sort_order)
  ON seed.course_slug = course.slug
ON CONFLICT (course_id, sort_order) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description;

INSERT INTO public.community_lessons
  (module_id, title, summary, duration_minutes, sort_order, is_published)
SELECT module.id, seed.title, seed.summary, seed.duration_minutes, seed.sort_order, true
FROM public.community_modules module
JOIN public.community_courses course ON course.id = module.course_id
JOIN (
  VALUES
    ('fundamentos-legal-ops', 1, 'O que Legal Ops resolve', 'Resultados, não tarefas: a mudança de perspectiva que organiza todo o programa.', 8, 1),
    ('fundamentos-legal-ops', 1, 'Os quatro pilares da operação', 'Pessoas, processos, tecnologia e dados como um único sistema.', 11, 2),
    ('fundamentos-legal-ops', 2, 'Mapa de fricções', 'Uma dinâmica curta para localizar gargalos com o time e os clientes internos.', 9, 1),
    ('fundamentos-legal-ops', 2, 'Roadmap de 90 dias', 'Critérios simples para priorizar impacto, esforço e confiança.', 13, 2),
    ('clm-na-pratica', 1, 'Desenhe o ciclo atual', 'O fluxo real antes do fluxo ideal: intake, negociação, assinatura e obrigações.', 12, 1),
    ('clm-na-pratica', 1, 'Requisitos que importam', 'Como separar requisito operacional de preferência de interface.', 10, 2),
    ('clm-na-pratica', 2, 'Plano de adoção', 'Piloto, champions e comunicação para transformar ferramenta em hábito.', 14, 1),
    ('clm-na-pratica', 2, 'Métricas do CLM', 'Tempo de ciclo, taxa de exceção, retrabalho e valor capturado.', 12, 2),
    ('ia-juridico', 1, 'Escolha o caso de uso', 'Volume, repetibilidade, risco e dados disponíveis.', 9, 1),
    ('ia-juridico', 1, 'Guardrails essenciais', 'Privacidade, revisão humana, rastreabilidade e fornecedores.', 15, 2),
    ('ia-juridico', 2, 'Desenhe o piloto', 'Hipótese, baseline, grupo de teste e critério de parada.', 13, 1),
    ('ia-juridico', 2, 'Meça o resultado', 'Tempo, qualidade e confiança: como provar valor sem vanity metrics.', 11, 2)
) AS seed(course_slug, module_order, title, summary, duration_minutes, sort_order)
  ON seed.course_slug = course.slug AND seed.module_order = module.sort_order
ON CONFLICT (module_id, sort_order) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  duration_minutes = EXCLUDED.duration_minutes,
  is_published = true;

INSERT INTO public.community_events
  (slug, title, description, host_name, starts_at, ends_at, location_label, event_type, is_published)
VALUES
  ('office-hours-agosto-2026', 'Office hours: desafios reais de Legal Ops', 'Traga um gargalo da sua operação. Vamos destrinchar o problema em grupo e sair com um próximo passo.', 'Leon Hatori', '2026-08-20T22:00:00Z', '2026-08-20T23:00:00Z', 'Online · link para membros', 'office-hours', true),
  ('clm-sem-caos-agosto-2026', 'CLM sem caos: do business case à adoção', 'Aula prática sobre como estruturar uma iniciativa de CLM sem começar pela ferramenta.', 'LegalOps Club', '2026-08-27T15:00:00Z', '2026-08-27T16:00:00Z', 'Online · link para membros', 'aula', true),
  ('networking-setembro-2026', 'Networking LegalOps Brasil', 'Conexões orientadas por desafios e especialidades, sem pitch genérico.', 'LegalOps Club', '2026-09-03T22:00:00Z', '2026-09-03T23:00:00Z', 'Online · link para membros', 'networking', true)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  starts_at = EXCLUDED.starts_at,
  ends_at = EXCLUDED.ends_at,
  location_label = EXCLUDED.location_label,
  event_type = EXCLUDED.event_type,
  is_published = true;
