-- Correção de segurança (P2): remove a policy que permitia ao cliente (PostgREST)
-- alterar comissoes.status diretamente. As transições de status são exclusivas das
-- Edge Functions com service_role (que ignoram RLS), conforme postvenda_rls.sql.
-- Sem esta policy, AUDITOR/GESTOR só conseguem ler comissoes; nenhum papel altera
-- status pelo client.

DROP POLICY IF EXISTS "Comissoes updatable by AUDITOR/GESTOR" ON public.comissoes;
