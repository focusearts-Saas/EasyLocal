-- ==========================================
-- SCHEMA UNIFICADO PARA O NOVO SUPABASE (MeuLocalSaaS)
-- Copie e cole este script no painel SQL Editor do seu novo projeto Supabase.
-- ==========================================

-- Habilitar extensão para geração de UUIDs se não estiver ativa
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE NEGÓCIOS / CLIENTES
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL, -- Ex: "Serralheria Alvorada"
  gsc_url text, -- Ex: "sc-domain:serralheriaalvorada.com.br"
  gbp_account_id text, -- ID da Conta Google Meu Negócio
  gbp_location_id text, -- ID da Localização no Google Maps
  website_url text, -- URL pública para referência
  cms_type text DEFAULT 'nextjs', 
  business_context text, -- Resumo da identidade, tom de voz e diferenciais
  local_path text, -- Caminho local se aplicável
  project_folder text,
  stitch_prompt text,
  design_context jsonb DEFAULT '{}'::jsonb,
  seo_enabled boolean DEFAULT false,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- Dono do negócio
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS para clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own business" ON public.clients
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- 2. TABELA DE INTEGRACÕES GOOGLE OAUTH
CREATE TABLE IF NOT EXISTS public.google_integrations (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  google_email text,
  access_token text,
  refresh_token text NOT NULL,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS para google_integrations
ALTER TABLE public.google_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own google integrations" ON public.google_integrations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- 3. TABELA DE CRÉDITOS DO USUÁRIO e STATUS DA ASSINATURA
CREATE TABLE IF NOT EXISTS public.user_credits (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_allowance integer DEFAULT 150 NOT NULL,
  purchased_credits integer DEFAULT 0 NOT NULL,
  subscription_status text DEFAULT 'pending' NOT NULL, -- active, pending, cancelled
  seo_allowed boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS para user_credits
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own credits" ON public.user_credits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System/Admin can update credits" ON public.user_credits
  FOR ALL USING (true) WITH CHECK (true); -- Permitido acesso total via Service Role


-- 4. TABELA DE PERFIS DE USUÁRIO / ROLES
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'user' NOT NULL, -- user, super_admin
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS para user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);


-- 5. TABELA DE POSTAGENS AGENDADAS (GBP)
CREATE TABLE IF NOT EXISTS public.scheduled_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  location_id text NOT NULL, 
  content text NOT NULL, 
  image_url text, -- Link da imagem
  button_type text DEFAULT 'LEARN_MORE', -- NONE, LEARN_MORE, etc.
  button_url text,
  status text DEFAULT 'pending', -- pending, published, failed
  scheduled_for timestamp with time zone NOT NULL, 
  account_id text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS para scheduled_posts
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage posts of their own business" ON public.scheduled_posts
  FOR ALL USING (
    client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
  ) WITH CHECK (
    client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
  );


-- 6. TABELA DE BASE DE CONHECIMENTO DO CLIENTE
CREATE TABLE IF NOT EXISTS public.knowledge_base (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  source_type text DEFAULT 'text',
  category text DEFAULT 'general',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS para knowledge_base
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage knowledge base of their own business" ON public.knowledge_base
  FOR ALL USING (
    client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
  ) WITH CHECK (
    client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
  );


-- 7. TABELA DE PALAVRAS-CHAVE MONITORADAS (RANK TRACKER)
CREATE TABLE IF NOT EXISTS public.tracked_keywords (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id text NOT NULL, -- ID do local no Maps (link lógico com clients.gbp_location_id)
  business_name text NOT NULL,
  keyword text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS para tracked_keywords
ALTER TABLE public.tracked_keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage keywords of their own business" ON public.tracked_keywords
  FOR ALL USING (
    location_id IN (SELECT gbp_location_id FROM public.clients WHERE user_id = auth.uid())
  ) WITH CHECK (
    location_id IN (SELECT gbp_location_id FROM public.clients WHERE user_id = auth.uid())
  );


-- 8. TABELA DE HISTÓRICO DE RANKINGS (RANK TRACKER)
CREATE TABLE IF NOT EXISTS public.rank_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword_id uuid REFERENCES public.tracked_keywords(id) ON DELETE CASCADE NOT NULL,
  position integer NOT NULL,
  recorded_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS para rank_history
ALTER TABLE public.rank_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access rank history of their own keywords" ON public.rank_history
  FOR ALL USING (
    keyword_id IN (
      SELECT id FROM public.tracked_keywords 
      WHERE location_id IN (SELECT gbp_location_id FROM public.clients WHERE user_id = auth.uid())
    )
  ) WITH CHECK (
    keyword_id IN (
      SELECT id FROM public.tracked_keywords 
      WHERE location_id IN (SELECT gbp_location_id FROM public.clients WHERE user_id = auth.uid())
    )
  );


-- 9. TABELA DE HISTÓRICO DE MÉTRICAS (GBP)
CREATE TABLE IF NOT EXISTS public.gbp_metrics_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  location_id text NOT NULL,
  date date NOT NULL,
  period_type text DEFAULT 'MONTHLY',
  calls integer DEFAULT 0,
  directions integer DEFAULT 0,
  website_clicks integer DEFAULT 0,
  views_maps integer DEFAULT 0,
  views_search integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(location_id, date, period_type)
);

-- Habilitar RLS para gbp_metrics_history
ALTER TABLE public.gbp_metrics_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view metrics of their own business" ON public.gbp_metrics_history
  FOR ALL USING (
    client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
  ) WITH CHECK (
    client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
  );


-- 10. TABELA DE HISTÓRICO DE AUDITORIA (GBP)
CREATE TABLE IF NOT EXISTS public.gbp_audit_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  location_id text NOT NULL,
  date date NOT NULL,
  score integer NOT NULL,
  grade text NOT NULL,
  color text NOT NULL,
  checklist jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(location_id, date)
);

-- Habilitar RLS para gbp_audit_history
ALTER TABLE public.gbp_audit_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage audits of their own business" ON public.gbp_audit_history
  FOR ALL USING (
    client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
  ) WITH CHECK (
    client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
  );
