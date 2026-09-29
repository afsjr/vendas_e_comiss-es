-- Feature 008-consolidado-comissoes-vendedor
-- O papel FINANCEIRO precisa ler os nomes em perfis para o consolidado por vendedor.
-- As policies de comissoes/vendas ja liberam FINANCEIRO (20260909000001_postvenda_rls.sql).
-- Delta sobre 001_schema.sql: nao edita o DDL canonico (regra Reversa).

DROP POLICY IF EXISTS "Leitura gestor ou auditor" ON public.perfis;

CREATE POLICY "Leitura gestor ou auditor" ON public.perfis
  FOR SELECT USING (
    auth.jwt() -> 'app_metadata' ->> 'app_role' IN ('GESTOR', 'AUDITOR', 'FINANCEIRO')
  );
