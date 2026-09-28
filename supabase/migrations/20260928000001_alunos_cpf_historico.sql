-- Feature 005-listar-alunos-cpf-auditoria
-- Trilha imutável de correções de CPF + RLS GESTOR/AUDITOR.
-- Delta sobre 001_schema.sql: não edita o DDL canônico (regra Reversa).

CREATE TABLE public.alunos_cpf_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE RESTRICT,
  valor_anterior VARCHAR(11) NOT NULL,
  valor_novo VARCHAR(11) NOT NULL,
  motivo TEXT NOT NULL,
  autor_id UUID NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_alunos_cpf_historico_aluno_id ON public.alunos_cpf_historico(aluno_id);

-- Append-only: UPDATE e DELETE bloqueados.
CREATE OR REPLACE FUNCTION public.trg_prevent_changes_alunos_cpf_historico()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Operações de UPDATE e DELETE são bloqueadas em alunos_cpf_historico. Tabela append-only.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_changes_alunos_cpf_historico
BEFORE UPDATE OR DELETE ON public.alunos_cpf_historico
FOR EACH ROW EXECUTE FUNCTION public.trg_prevent_changes_alunos_cpf_historico();

-- RLS: leitura para GESTOR e AUDITOR; escrita para GESTOR.
ALTER TABLE public.alunos_cpf_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alunos_cpf_historico select gestor auditor" ON public.alunos_cpf_historico
FOR SELECT USING (auth.jwt() -> 'app_metadata' ->> 'app_role' IN ('GESTOR', 'AUDITOR'));

CREATE POLICY "alunos_cpf_historico insert gestor" ON public.alunos_cpf_historico
FOR INSERT WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'app_role' = 'GESTOR');
