-- Consistência de RBAC (P3.4): o papel FINANCEIRO já lê vendas/comissoes
-- (postvenda_rls.sql) e perfis (20260929000000), mas estava fora do SELECT de
-- alunos. Sem isso, os embeds `alunos(nome)` no pós-venda/consolidado retornam
-- nulo para o FINANCEIRO. A view alunos_resumo já inclui FINANCEIRO.
-- Observação: FINANCEIRO NÃO sobe contrato (apenas SECRETARIA); a policy de
-- INSERT de contratos_pdf permanece inalterada de propósito.

DROP POLICY IF EXISTS "Alunos readable by all roles" ON public.alunos;

CREATE POLICY "Alunos readable by all roles" ON public.alunos
FOR SELECT USING (
  auth.jwt() -> 'app_metadata' ->> 'app_role'
    IN ('VENDEDOR', 'SECRETARIA', 'AUDITOR', 'GESTOR', 'FINANCEIRO')
);
