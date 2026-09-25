-- Corrige policies de leitura que comparavam auth.role() com 'authenticated_user',
-- valor que não existe: o JWT de um usuário logado tem role = 'authenticated'.
-- Efeito do bug: usuários autenticados não enxergavam cursos nem documentos_alunos.
DROP POLICY IF EXISTS "Cursos readable by authenticated users" ON cursos;
CREATE POLICY "Cursos readable by authenticated users" ON cursos
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Documentos alunos readable by all authenticated" ON documentos_alunos;
CREATE POLICY "Documentos alunos readable by all authenticated" ON documentos_alunos
FOR SELECT USING (auth.role() = 'authenticated');
