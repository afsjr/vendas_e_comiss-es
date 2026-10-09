-- Correção de privacidade (P2.3): a tabela alunos expunha cpf/rg para todo
-- VENDEDOR/SECRETARIA via PostgREST (RLS "Alunos readable by all roles").
-- Estratégia: revogar SELECT direto na tabela e conceder colunas não sensíveis;
-- expor uma view alunos_resumo que mascara o CPF para quem não é GESTOR/AUDITOR.
-- Escritas (INSERT/UPDATE/DELETE) não são afetadas; corrigirCpf usa service_role.

REVOKE SELECT ON public.alunos FROM authenticated, anon;

GRANT SELECT (id, nome, email, telefone, is_whatsapp, criado_por, criado_em, atualizado_em)
  ON public.alunos TO authenticated;

CREATE OR REPLACE FUNCTION public.mask_cpf(p_cpf text)
RETURNS text AS $$
  SELECT CASE
    WHEN p_cpf IS NULL OR length(regexp_replace(p_cpf, '\D', '', 'g')) <> 11 THEN NULL
    ELSE left(regexp_replace(p_cpf, '\D', '', 'g'), 3)
      || '.****.'
      || right(regexp_replace(p_cpf, '\D', '', 'g'), 4)
  END;
$$ LANGUAGE sql IMMUTABLE;

-- View executada com privilégios do owner para poder ler cpf/rg; o filtro de
-- papel e a máscara são aplicados explicitamente abaixo.
CREATE OR REPLACE VIEW public.alunos_resumo AS
SELECT
  a.id,
  a.nome,
  CASE
    WHEN (auth.jwt() -> 'app_metadata' ->> 'app_role') IN ('GESTOR', 'AUDITOR') THEN a.cpf
    ELSE public.mask_cpf(a.cpf)
  END AS cpf,
  a.email,
  a.telefone,
  a.is_whatsapp,
  a.criado_por,
  a.criado_em,
  a.atualizado_em
FROM public.alunos a
WHERE (auth.jwt() -> 'app_metadata' ->> 'app_role')
  IN ('GESTOR', 'AUDITOR', 'VENDEDOR', 'SECRETARIA', 'FINANCEIRO');

GRANT SELECT ON public.alunos_resumo TO authenticated;

NOTIFY pgrst, 'reload schema';
