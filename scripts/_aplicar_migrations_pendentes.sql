-- ============================================================
-- Migrations pendentes (aplicar na ORDEM abaixo, de uma vez)
-- Origin: 20260730094500, 20260730094501, 20260909000000, 20260909000001
-- ============================================================

-- ---------- 20260730094500_create_perfis_table.sql ----------
CREATE TABLE IF NOT EXISTS public.perfis (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'VENDEDOR' CHECK (role IN ('VENDEDOR', 'SECRETARIA', 'AUDITOR', 'GESTOR')),
    criado_em TIMESTAMPTZ DEFAULT now()
);

-- Função e Trigger para inserir perfil automaticamente ao criar usuário no Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.perfis (id, email, nome, role)
    VALUES (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', new.email),
        'VENDEDOR'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill de usuários existentes
INSERT INTO public.perfis (id, email, nome, role)
SELECT id, email, coalesce(raw_user_meta_data->>'full_name', email), 'GESTOR'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ---------- 20260730094501_create_perfis_rls.sql ----------
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pessoal" ON public.perfis
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Leitura gestor ou auditor" ON public.perfis
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.perfis AS p 
            WHERE p.id = auth.uid() AND p.role IN ('GESTOR', 'AUDITOR')
        )
    );

CREATE POLICY "Update gestor" ON public.perfis
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.perfis AS p 
            WHERE p.id = auth.uid() AND p.role = 'GESTOR'
        )
    );

-- ---------- 20260909000000_postvenda_status.sql ----------
-- Novos valores do enum status_venda_enum (append)
ALTER TYPE status_venda_enum ADD VALUE IF NOT EXISTS 'AGUARDANDO_FINANCEIRO';
ALTER TYPE status_venda_enum ADD VALUE IF NOT EXISTS 'AGUARDANDO_PAGAMENTO_1M';
ALTER TYPE status_venda_enum ADD VALUE IF NOT EXISTS 'PRIMEIRA_MENSALIDADE_PAGA';
ALTER TYPE status_venda_enum ADD VALUE IF NOT EXISTS 'CANCELADA';

-- Colunas de contraprova em vendas
ALTER TABLE public.vendas
  ADD COLUMN IF NOT EXISTS contrato_storage_path VARCHAR(512),
  ADD COLUMN IF NOT EXISTS boleto_referencia VARCHAR(255),
  ADD COLUMN IF NOT EXISTS comprovante_pgto_1m_path VARCHAR(512);

-- CHECK de perfis.role passa a aceitar FINANCEIRO
ALTER TABLE public.perfis DROP CONSTRAINT IF EXISTS perfis_role_check;
ALTER TABLE public.perfis ADD CONSTRAINT perfis_role_check
  CHECK (role IN ('VENDEDOR', 'SECRETARIA', 'AUDITOR', 'GESTOR', 'FINANCEIRO'));

-- ---------- 20260909000001_postvenda_rls.sql ----------
DROP POLICY IF EXISTS "Vendas readable by VENDEDOR (own) and others" ON public.vendas;
CREATE POLICY "Vendas readable by VENDEDOR (own) and others" ON public.vendas
FOR SELECT USING (
  (auth.jwt() -> 'app_metadata' ->> 'app_role' = 'VENDEDOR' AND criado_por = auth.uid())
  OR
  (auth.jwt() -> 'app_metadata' ->> 'app_role' IN ('AUDITOR', 'GESTOR', 'FINANCEIRO'))
  OR
  (auth.jwt() -> 'app_metadata' ->> 'app_role' = 'SECRETARIA')
);

DROP POLICY IF EXISTS "Evidencias vendas readable" ON public.evidencias_vendas;
CREATE POLICY "Evidencias vendas readable" ON public.evidencias_vendas
FOR SELECT USING (
  venda_id IN (
    SELECT id FROM public.vendas WHERE
    (criado_por = auth.uid() AND auth.jwt() -> 'app_metadata' ->> 'app_role' IN ('VENDEDOR', 'SECRETARIA'))
    OR
    (auth.jwt() -> 'app_metadata' ->> 'app_role' IN ('AUDITOR', 'GESTOR', 'FINANCEIRO'))
  )
);

DROP POLICY IF EXISTS "Historico vendas readable" ON public.vendas_historico_status;
CREATE POLICY "Historico vendas readable" ON public.vendas_historico_status
FOR SELECT USING (
  venda_id IN (
    SELECT id FROM public.vendas WHERE
    (criado_por = auth.uid() AND auth.jwt() -> 'app_metadata' ->> 'app_role' IN ('VENDEDOR', 'SECRETARIA'))
    OR
    (auth.jwt() -> 'app_metadata' ->> 'app_role' IN ('AUDITOR', 'GESTOR', 'FINANCEIRO'))
  )
);

DROP POLICY IF EXISTS "Comissoes readable" ON public.comissoes;
CREATE POLICY "Comissoes readable" ON public.comissoes
FOR SELECT USING (
  venda_id IN (
    SELECT id FROM public.vendas WHERE
    (criado_por = auth.uid() AND auth.jwt() -> 'app_metadata' ->> 'app_role' IN ('VENDEDOR', 'SECRETARIA'))
    OR
    (auth.jwt() -> 'app_metadata' ->> 'app_role' IN ('AUDITOR', 'GESTOR', 'FINANCEIRO'))
  )
);