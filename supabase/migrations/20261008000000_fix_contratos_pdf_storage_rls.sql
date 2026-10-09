-- Correção de segurança (P1): o bucket privado contratos_pdf estava com SELECT
-- liberado para todo usuário autenticado (setup-storage.sql), permitindo listar e
-- baixar contratos de terceiros via Storage API.
-- Nova regra: leitura apenas para papéis administrativos ou pelo dono da pasta.
-- A Edge Function gerar-contrato passou a gravar em `${auth.uid()}/...`.

DROP POLICY IF EXISTS storage_contratos_pdf_select ON storage.objects;

CREATE POLICY storage_contratos_pdf_select ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'contratos_pdf'
        AND (
            (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'app_role') IN ('AUDITOR', 'GESTOR', 'SECRETARIA', 'FINANCEIRO')
            OR (name ILIKE (current_setting('request.jwt.claims', true)::jsonb ->> 'sub') || '/%')
        )
    );
