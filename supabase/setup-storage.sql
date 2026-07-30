-- setup-storage.sql
-- Configuração dos buckets de Storage Privado no Supabase
-- Fonte: architecture-proposal.md

-- Bucket: comprovantes (fotos/prints de comprovantes de pagamento)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('comprovantes', 'comprovantes', false, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Bucket: documentos_alunos (RG, CPF, comprovante de residência, histórico)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('documentos_alunos', 'documentos_alunos', false, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Bucket: contratos_pdf (minutas de contrato geradas)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('contratos_pdf', 'contratos_pdf', false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Política: acesso a comprovantes apenas pelo proprietário ou auditor/gestor
CREATE POLICY storage_comprovantes_select ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'comprovantes'
        AND (
            (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'app_role') IN ('AUDITOR', 'GESTOR')
            OR (storage.objects.path ILIKE (current_setting('request.jwt.claims', true)::jsonb ->> 'sub') || '/%')
        )
    );

CREATE POLICY storage_comprovantes_insert ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'comprovantes'
        AND (storage.objects.path ILIKE (current_setting('request.jwt.claims', true)::jsonb ->> 'sub') || '/%')
    );

-- Política: acesso a documentos de alunos
CREATE POLICY storage_documentos_alunos_select ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'documentos_alunos'
        AND (
            (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'app_role') IN ('AUDITOR', 'GESTOR')
            OR (storage.objects.path ILIKE (current_setting('request.jwt.claims', true)::jsonb ->> 'sub') || '/%')
        )
    );

CREATE POLICY storage_documentos_alunos_insert ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'documentos_alunos'
        AND (storage.objects.path ILIKE (current_setting('request.jwt.claims', true)::jsonb ->> 'sub') || '/%')
    );

-- Política: contratos_pdf — leitura para todos os perfis autenticados, escrita apenas para VENDEDOR/SECRETARIA
CREATE POLICY storage_contratos_pdf_select ON storage.objects
    FOR SELECT
    TO authenticated
    USING (bucket_id = 'contratos_pdf');

CREATE POLICY storage_contratos_pdf_insert ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'contratos_pdf'
        AND (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'app_role') IN ('VENDEDOR', 'SECRETARIA')
    );
