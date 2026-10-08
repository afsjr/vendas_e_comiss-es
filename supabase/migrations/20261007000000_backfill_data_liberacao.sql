-- Feature: correcao de data_liberacao das comissoes.
-- LIBERADA_PAGAMENTO sem data usa atualizado_em (fallback criado_em).
-- PAGA sem data usa a competencia do credito registrado no livro-caixa.

UPDATE public.comissoes
SET data_liberacao = COALESCE(atualizado_em, criado_em)
WHERE status = 'LIBERADA_PAGAMENTO'
  AND data_liberacao IS NULL;

UPDATE public.comissoes AS c
SET data_liberacao = lc.criado_em
FROM public.livro_caixa_lancamentos AS lc
WHERE lc.comissao_id = c.id
  AND lc.tipo = 'CRÉDITO'
  AND c.status = 'PAGA'
  AND c.data_liberacao IS NULL;

UPDATE public.comissoes
SET data_liberacao = COALESCE(atualizado_em, criado_em)
WHERE status = 'PAGA'
  AND data_liberacao IS NULL;
