-- Feature 003-kanban-pos-venda
-- RLS: papel FINANCEIRO nas policies SELECT do fluxo de pós-venda.
-- O FINANCEIRO precisa enxergar vendas, evidências, histórico e comissões
-- para operar a fila (sem ownership de venda). Transições continuam
-- exclusivas das Edge Functions com SERVICE_ROLE_KEY (sem policy de UPDATE).

-- vendas
DROP POLICY IF EXISTS "Vendas readable by VENDEDOR (own) and others" ON public.vendas;
CREATE POLICY "Vendas readable by VENDEDOR (own) and others" ON public.vendas
FOR SELECT USING (
  (auth.jwt() -> 'app_metadata' ->> 'app_role' = 'VENDEDOR' AND criado_por = auth.uid())
  OR
  (auth.jwt() -> 'app_metadata' ->> 'app_role' IN ('AUDITOR', 'GESTOR', 'FINANCEIRO'))
  OR
  (auth.jwt() -> 'app_metadata' ->> 'app_role' = 'SECRETARIA')
);

-- evidencias_vendas
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

-- vendas_historico_status
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

-- comissoes
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