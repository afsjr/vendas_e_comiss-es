-- Corrige a leitura/atualização de perfis pelo GESTOR/AUDITOR.
-- O papel do usuário fica em app_metadata.app_role no JWT, não no top-level.
-- A migration 20260910000000 lia request.jwt.claims ->> 'app_role' (null),
-- fazendo o GESTOR enxergar apenas a própria linha (Leitura pessoal) e não
-- conseguir atualizar o papel de outros usuários.
DROP POLICY IF EXISTS "Leitura gestor ou auditor" ON public.perfis;
DROP POLICY IF EXISTS "Update gestor" ON public.perfis;

CREATE POLICY "Leitura gestor ou auditor" ON public.perfis
    FOR SELECT USING (
        auth.jwt() -> 'app_metadata' ->> 'app_role' IN ('GESTOR', 'AUDITOR')
    );

CREATE POLICY "Update gestor" ON public.perfis
    FOR UPDATE USING (
        auth.jwt() -> 'app_metadata' ->> 'app_role' = 'GESTOR'
    );
