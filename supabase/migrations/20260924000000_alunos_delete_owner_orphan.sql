-- Feature 004-cadastro-unificado-aluno-venda
-- Permite ao criador remover um aluno SEM venda (compensação do cadastro unificado).
-- Aluno que já possui qualquer venda permanece indeletável.
CREATE POLICY "Alunos deletable by creator when orphan" ON public.alunos
FOR DELETE USING (
  criado_por = auth.uid()
  AND NOT EXISTS (
    SELECT 1 FROM public.vendas v WHERE v.aluno_id = public.alunos.id
  )
);
