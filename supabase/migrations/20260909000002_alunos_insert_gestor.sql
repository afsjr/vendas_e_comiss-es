-- Delta BUG-20260909-xg7e: GESTOR passa a criar alunos.
-- Aditivo: policy permissiva OR; VENDEDOR/SECRETARIA continuam cobertos pela policy original,
-- e as policies de SELECT permanecem inalteradas. Nao altera UPDATE nem DELETE (GESTOR segue
-- somente leitura no restante dos campos, conforme spec de cadastro de alunos).
CREATE POLICY "Alunos insertable by GESTOR" ON alunos
FOR INSERT WITH CHECK (
  auth.jwt() -> 'app_metadata' ->> 'app_role' = 'GESTOR'
);