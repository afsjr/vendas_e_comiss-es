-- Feature 011: novos registros de venda exigem data de início do curso.
-- CHECK ... NOT VALID: vale para novas inserções sem varrer/reprovar o histórico.
ALTER TABLE public.vendas
  DROP CONSTRAINT IF EXISTS vendas_data_inicio_curso_not_null;

ALTER TABLE public.vendas
  ADD CONSTRAINT vendas_data_inicio_curso_not_null
  CHECK (data_inicio_curso IS NOT NULL) NOT VALID;

NOTIFY pgrst, 'reload schema';
