-- legalops.club Bench + regional community leadership.
-- Bench is intentionally free/public to discover; registrations and leadership
-- applications are written only through server actions using the service role.

CREATE TABLE IF NOT EXISTS public.community_regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  country_code text NOT NULL DEFAULT 'BR',
  region_type text NOT NULL DEFAULT 'state'
    CHECK (region_type IN ('country', 'macroregion', 'state', 'city', 'metro')),
  macro_region text,
  state_code text,
  status text NOT NULL DEFAULT 'forming'
    CHECK (status IN ('forming', 'active', 'paused', 'archived')),
  description text,
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  whatsapp_url text,
  meeting_cadence text,
  is_public boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS community_regions_public_idx
  ON public.community_regions (is_public, status, sort_order, name);
CREATE INDEX IF NOT EXISTS community_regions_state_idx
  ON public.community_regions (country_code, state_code);

ALTER TABLE public.community_regions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS community_regions_public_read ON public.community_regions;
CREATE POLICY community_regions_public_read
  ON public.community_regions FOR SELECT TO anon, authenticated
  USING (is_public = true AND status <> 'archived');

REVOKE ALL ON public.community_regions FROM anon, authenticated;
GRANT SELECT (id, slug, name, country_code, region_type, macro_region, state_code,
  status, description, timezone, whatsapp_url, meeting_cadence, is_public, sort_order,
  created_at, updated_at)
  ON public.community_regions TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.community_regional_leaders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id uuid NOT NULL REFERENCES public.community_regions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 2 AND 120),
  email text NOT NULL CHECK (char_length(email) BETWEEN 5 AND 254),
  title text,
  organization text,
  linkedin_url text,
  role text NOT NULL DEFAULT 'co_lead'
    CHECK (role IN ('lead', 'co_lead', 'organizer')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'paused', 'declined')),
  motivation text,
  responsibilities text[] NOT NULL DEFAULT '{}',
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS community_regional_leaders_region_email_idx
  ON public.community_regional_leaders (region_id, lower(email));
CREATE INDEX IF NOT EXISTS community_regional_leaders_active_idx
  ON public.community_regional_leaders (region_id, status, role);
CREATE INDEX IF NOT EXISTS community_regional_leaders_user_idx
  ON public.community_regional_leaders (user_id);

ALTER TABLE public.community_regional_leaders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS community_regional_leaders_public_read ON public.community_regional_leaders;
CREATE POLICY community_regional_leaders_public_read
  ON public.community_regional_leaders FOR SELECT TO anon, authenticated
  USING (status = 'active');

REVOKE ALL ON public.community_regional_leaders FROM anon, authenticated;
GRANT SELECT (id, region_id, user_id, display_name, title, organization, linkedin_url,
  role, status, responsibilities, approved_at, created_at, updated_at)
  ON public.community_regional_leaders TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.bench_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 180),
  description text NOT NULL CHECK (char_length(description) BETWEEN 10 AND 3000),
  category text NOT NULL DEFAULT 'geral',
  region_id uuid REFERENCES public.community_regions(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'forming'
    CHECK (status IN ('forming', 'scheduled', 'completed', 'archived')),
  is_public boolean NOT NULL DEFAULT true,
  interest_count integer NOT NULL DEFAULT 0 CHECK (interest_count >= 0),
  min_participants integer NOT NULL DEFAULT 5 CHECK (min_participants > 0),
  ideal_participants integer NOT NULL DEFAULT 12 CHECK (ideal_participants > 0),
  summary text,
  key_findings text[] NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ideal_participants >= min_participants)
);

CREATE INDEX IF NOT EXISTS bench_topics_public_idx
  ON public.bench_topics (is_public, status, interest_count DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS bench_topics_region_idx
  ON public.bench_topics (region_id, status);

ALTER TABLE public.bench_topics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bench_topics_public_read ON public.bench_topics;
CREATE POLICY bench_topics_public_read
  ON public.bench_topics FOR SELECT TO anon, authenticated
  USING (is_public = true AND status <> 'archived');

REVOKE ALL ON public.bench_topics FROM anon, authenticated;
GRANT SELECT (id, slug, title, description, category, region_id, status, is_public,
  interest_count, min_participants, ideal_participants, summary, key_findings,
  created_at, updated_at)
  ON public.bench_topics TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.bench_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.bench_topics(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  capacity integer CHECK (capacity IS NULL OR capacity > 0),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'completed', 'canceled')),
  is_public boolean NOT NULL DEFAULT true,
  google_event_id text,
  meeting_url text,
  calendar_sync_status text NOT NULL DEFAULT 'pending'
    CHECK (calendar_sync_status IN ('pending', 'synced', 'error', 'not_configured')),
  calendar_sync_error text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS bench_sessions_topic_idx
  ON public.bench_sessions (topic_id, starts_at DESC);
CREATE INDEX IF NOT EXISTS bench_sessions_public_idx
  ON public.bench_sessions (is_public, status, starts_at);

ALTER TABLE public.bench_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bench_sessions_public_read ON public.bench_sessions;
CREATE POLICY bench_sessions_public_read
  ON public.bench_sessions FOR SELECT TO anon, authenticated
  USING (is_public = true AND status IN ('scheduled', 'completed'));

REVOKE ALL ON public.bench_sessions FROM anon, authenticated;
GRANT SELECT (id, topic_id, starts_at, ends_at, timezone, capacity, status,
  is_public, calendar_sync_status, created_at, updated_at)
  ON public.bench_sessions TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.bench_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.bench_topics(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.bench_sessions(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL CHECK (char_length(email) BETWEEN 5 AND 254),
  full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 120),
  organization text,
  current_role text,
  status text NOT NULL DEFAULT 'interested'
    CHECK (status IN ('interested', 'registered', 'waitlist', 'canceled')),
  calendar_invited_at timestamptz,
  calendar_invite_status text NOT NULL DEFAULT 'pending'
    CHECK (calendar_invite_status IN ('pending', 'sent', 'error', 'not_required')),
  calendar_invite_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS bench_registrations_topic_email_idx
  ON public.bench_registrations (topic_id, lower(email));
CREATE INDEX IF NOT EXISTS bench_registrations_session_idx
  ON public.bench_registrations (session_id, status, created_at);
CREATE INDEX IF NOT EXISTS bench_registrations_user_idx
  ON public.bench_registrations (user_id);

ALTER TABLE public.bench_registrations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.bench_registrations FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS public.bench_topic_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 180),
  context text NOT NULL DEFAULT '',
  full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 120),
  email text NOT NULL CHECK (char_length(email) BETWEEN 5 AND 254),
  organization text,
  region_id uuid REFERENCES public.community_regions(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'reviewed', 'accepted', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bench_topic_suggestions_status_idx
  ON public.bench_topic_suggestions (status, created_at DESC);

ALTER TABLE public.bench_topic_suggestions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.bench_topic_suggestions FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.refresh_bench_interest_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  affected_topic uuid;
BEGIN
  affected_topic := COALESCE(NEW.topic_id, OLD.topic_id);
  UPDATE public.bench_topics topic
  SET interest_count = (
    SELECT count(*)::integer
    FROM public.bench_registrations registration
    WHERE registration.topic_id = affected_topic
      AND registration.status <> 'canceled'
  ),
  updated_at = now()
  WHERE topic.id = affected_topic;
  RETURN COALESCE(NEW, OLD);
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_bench_interest_count() FROM PUBLIC;
DROP TRIGGER IF EXISTS bench_registrations_refresh_interest ON public.bench_registrations;
CREATE TRIGGER bench_registrations_refresh_interest
  AFTER INSERT OR UPDATE OF status, topic_id OR DELETE
  ON public.bench_registrations
  FOR EACH ROW EXECUTE FUNCTION public.refresh_bench_interest_count();

INSERT INTO public.community_regions
  (slug, name, country_code, region_type, macro_region, state_code, timezone, status, sort_order)
VALUES
  ('acre', 'Acre', 'BR', 'state', 'Norte', 'AC', 'America/Rio_Branco', 'forming', 1),
  ('alagoas', 'Alagoas', 'BR', 'state', 'Nordeste', 'AL', 'America/Maceio', 'forming', 2),
  ('amapa', 'Amapá', 'BR', 'state', 'Norte', 'AP', 'America/Belem', 'forming', 3),
  ('amazonas', 'Amazonas', 'BR', 'state', 'Norte', 'AM', 'America/Manaus', 'forming', 4),
  ('bahia', 'Bahia', 'BR', 'state', 'Nordeste', 'BA', 'America/Bahia', 'forming', 5),
  ('ceara', 'Ceará', 'BR', 'state', 'Nordeste', 'CE', 'America/Fortaleza', 'forming', 6),
  ('distrito-federal', 'Distrito Federal', 'BR', 'state', 'Centro-Oeste', 'DF', 'America/Sao_Paulo', 'forming', 7),
  ('espirito-santo', 'Espírito Santo', 'BR', 'state', 'Sudeste', 'ES', 'America/Sao_Paulo', 'forming', 8),
  ('goias', 'Goiás', 'BR', 'state', 'Centro-Oeste', 'GO', 'America/Sao_Paulo', 'forming', 9),
  ('maranhao', 'Maranhão', 'BR', 'state', 'Nordeste', 'MA', 'America/Fortaleza', 'forming', 10),
  ('mato-grosso', 'Mato Grosso', 'BR', 'state', 'Centro-Oeste', 'MT', 'America/Cuiaba', 'forming', 11),
  ('mato-grosso-do-sul', 'Mato Grosso do Sul', 'BR', 'state', 'Centro-Oeste', 'MS', 'America/Campo_Grande', 'forming', 12),
  ('minas-gerais', 'Minas Gerais', 'BR', 'state', 'Sudeste', 'MG', 'America/Sao_Paulo', 'forming', 13),
  ('para', 'Pará', 'BR', 'state', 'Norte', 'PA', 'America/Belem', 'forming', 14),
  ('paraiba', 'Paraíba', 'BR', 'state', 'Nordeste', 'PB', 'America/Fortaleza', 'forming', 15),
  ('parana', 'Paraná', 'BR', 'state', 'Sul', 'PR', 'America/Sao_Paulo', 'forming', 16),
  ('pernambuco', 'Pernambuco', 'BR', 'state', 'Nordeste', 'PE', 'America/Recife', 'forming', 17),
  ('piaui', 'Piauí', 'BR', 'state', 'Nordeste', 'PI', 'America/Fortaleza', 'forming', 18),
  ('rio-de-janeiro', 'Rio de Janeiro', 'BR', 'state', 'Sudeste', 'RJ', 'America/Sao_Paulo', 'forming', 19),
  ('rio-grande-do-norte', 'Rio Grande do Norte', 'BR', 'state', 'Nordeste', 'RN', 'America/Fortaleza', 'forming', 20),
  ('rio-grande-do-sul', 'Rio Grande do Sul', 'BR', 'state', 'Sul', 'RS', 'America/Sao_Paulo', 'forming', 21),
  ('rondonia', 'Rondônia', 'BR', 'state', 'Norte', 'RO', 'America/Porto_Velho', 'forming', 22),
  ('roraima', 'Roraima', 'BR', 'state', 'Norte', 'RR', 'America/Boa_Vista', 'forming', 23),
  ('santa-catarina', 'Santa Catarina', 'BR', 'state', 'Sul', 'SC', 'America/Sao_Paulo', 'forming', 24),
  ('sao-paulo', 'São Paulo', 'BR', 'state', 'Sudeste', 'SP', 'America/Sao_Paulo', 'forming', 25),
  ('sergipe', 'Sergipe', 'BR', 'state', 'Nordeste', 'SE', 'America/Maceio', 'forming', 26),
  ('tocantins', 'Tocantins', 'BR', 'state', 'Norte', 'TO', 'America/Araguaina', 'forming', 27)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  macro_region = EXCLUDED.macro_region,
  state_code = EXCLUDED.state_code,
  timezone = EXCLUDED.timezone,
  updated_at = now();

INSERT INTO public.bench_topics
  (slug, title, description, category, min_participants, ideal_participants, status, is_public)
VALUES
  ('harvey-na-pratica', 'Harvey na prática', 'Como times jurídicos estão usando Harvey de verdade: casos de uso, workflows, adoção, integrações e o que está funcionando no dia a dia.', 'ia-automacao', 5, 12, 'forming', true),
  ('governanca-processo-contratos', 'Governança e processo de contratos', 'Intake, aprovações, CLM, responsabilidades, handoffs e gestão do ciclo contratual entre Jurídico e negócio.', 'contratos-clm', 5, 12, 'forming', true),
  ('intake-triage-juridico', 'Legal Intake & Triage', 'Como organizar entrada de demandas, triagem, priorização, SLAs e roteamento sem transformar o Jurídico em gargalo.', 'processos-projetos', 5, 12, 'forming', true),
  ('clm-implementation', 'CLM Implementation', 'Bench de implementação de CLM: seleção, migração, desenho de fluxo, integrações, adoção e métricas depois do go-live.', 'contratos-clm', 5, 12, 'forming', true),
  ('legal-ops-kpis-slas', 'Legal Ops KPIs & SLAs', 'Quais indicadores e SLAs os times realmente acompanham, como calculam e como usam os dados para tomar decisões.', 'dados-metricas', 5, 12, 'forming', true),
  ('ai-agents-automation', 'AI Agents & Automation', 'Casos reais de agentes, automações e IA aplicada à operação jurídica, incluindo governança, segurança e impacto mensurável.', 'ia-automacao', 5, 12, 'forming', true)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  min_participants = EXCLUDED.min_participants,
  ideal_participants = EXCLUDED.ideal_participants,
  updated_at = now();
