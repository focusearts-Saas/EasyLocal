-- =========================================================================
-- SCRIPT DE MIGRAÇÃO: ADIÇÃO DE SUPORTE PARA OFERTAS E EVENTOS
-- Execute este script no SQL Editor do seu painel do Supabase.
-- =========================================================================

-- Adiciona novas colunas na tabela scheduled_posts se elas não existirem
ALTER TABLE public.scheduled_posts 
ADD COLUMN IF NOT EXISTS topic_type text DEFAULT 'STANDARD',
ADD COLUMN IF NOT EXISTS event_title text,
ADD COLUMN IF NOT EXISTS event_start_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS event_end_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS offer_coupon_code text,
ADD COLUMN IF NOT EXISTS offer_redeem_url text,
ADD COLUMN IF NOT EXISTS offer_terms text;

-- Atualizar RLS (já está habilitado no schema original, mas garante a consistência)
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;
