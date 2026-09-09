-- Feature 003-kanban-pos-venda
-- Novos estados de pós-venda + colunas de contraprova + papel FINANCEIRO.
-- Este arquivo NÃO edita 001_schema.sql (regra Reversa): evolui por delta.

-- 1. Novos valores do enum status_venda_enum (append)
ALTER TYPE status_venda_enum ADD VALUE IF NOT EXISTS 'AGUARDANDO_FINANCEIRO';
ALTER TYPE status_venda_enum ADD VALUE IF NOT EXISTS 'AGUARDANDO_PAGAMENTO_1M';
ALTER TYPE status_venda_enum ADD VALUE IF NOT EXISTS 'PRIMEIRA_MENSALIDADE_PAGA';
ALTER TYPE status_venda_enum ADD VALUE IF NOT EXISTS 'CANCELADA';

-- 2. Colunas de contraprova em vendas
-- Nuláveis no DDL: a obrigatoriedade é transitória e validada server-side
-- pela Edge Function postvenda-mover (RN-03).
ALTER TABLE public.vendas
  ADD COLUMN IF NOT EXISTS contrato_storage_path VARCHAR(512),
  ADD COLUMN IF NOT EXISTS boleto_referencia VARCHAR(255),
  ADD COLUMN IF NOT EXISTS comprovante_pgto_1m_path VARCHAR(512);

-- 3. CHECK de perfis.role passa a aceitar FINANCEIRO
ALTER TABLE public.perfis DROP CONSTRAINT IF EXISTS perfis_role_check;
ALTER TABLE public.perfis ADD CONSTRAINT perfis_role_check
  CHECK (role IN ('VENDEDOR', 'SECRETARIA', 'AUDITOR', 'GESTOR', 'FINANCEIRO'));