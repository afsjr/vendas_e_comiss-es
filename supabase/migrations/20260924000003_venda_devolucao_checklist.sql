-- Feature: checklist estruturado de devolução da auditoria + reenvio pelo vendedor.
-- Guarda os itens marcados pelo auditor e a observação no próprio registro da venda.
-- O vendedor corrige substituindo o comprovante (valor/curso/aluno permanecem imutáveis).
ALTER TABLE public.vendas
  ADD COLUMN IF NOT EXISTS devolucao_itens JSONB,
  ADD COLUMN IF NOT EXISTS devolucao_observacao TEXT;
