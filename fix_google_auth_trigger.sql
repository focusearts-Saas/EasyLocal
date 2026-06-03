-- =========================================================================
-- SCRIPT DE AJUSTE: CRIAÇÃO AUTOMÁTICA DE PERFIL E CRÉDITOS NO CADASTRO
-- Execute este script no SQL Editor do seu painel do Supabase.
-- =========================================================================

-- 1. Criar a função que lida com a inserção automática
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Inserir créditos iniciais na tabela user_credits
  INSERT INTO public.user_credits (user_id, monthly_allowance, purchased_credits, subscription_status, seo_allowed)
  VALUES (new.id, 150, 0, 'pending', false)
  ON CONFLICT (user_id) DO NOTHING;

  -- Inserir o perfil padrão na tabela user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$;

-- 2. Criar a trigger na tabela auth.users do Supabase
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================================
-- 3. RETROATIVIDADE: Criar registros para usuários que já se cadastraram
--    anteriormente (como os usuários que logaram via Google)
-- =========================================================================

-- Inserir registros de créditos ausentes
INSERT INTO public.user_credits (user_id, monthly_allowance, purchased_credits, subscription_status, seo_allowed)
SELECT id, 150, 0, 'pending', false
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_credits)
ON CONFLICT (user_id) DO NOTHING;

-- Inserir registros de roles ausentes
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT (user_id) DO NOTHING;
