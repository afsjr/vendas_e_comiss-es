-- Feature 011: backfill da data de início do curso nas vendas históricas.
-- Registros sem data de início passam a usar a data da venda (criado_em),
-- para dar uma referência temporal válida sem reescrever a regra de liberação.

UPDATE public.vendas
SET data_inicio_curso = criado_em::date
WHERE data_inicio_curso IS NULL;

NOTIFY pgrst, 'reload schema';
