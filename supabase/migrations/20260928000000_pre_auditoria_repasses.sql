-- Feature 006-pre-auditoria-repasses
-- Pré-auditoria de repasses de Graduação (importação de CSV + conciliação por CPF).
-- Delta sobre 001_schema.sql: não edita o DDL canônico (regra Reversa).

-- 1. Importações do relatório de repasses (append-only)
CREATE TABLE public.relatorios_repasse (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path VARCHAR(512) NOT NULL,
  formato VARCHAR(10) NOT NULL CHECK (formato IN ('CSV')),
  competencia_pagamento VARCHAR(20),
  bp_polo VARCHAR(20),
  divisao VARCHAR(20),
  sha256_checksum VARCHAR(64) NOT NULL UNIQUE,
  total_linhas INTEGER NOT NULL DEFAULT 0,
  linhas_validas INTEGER NOT NULL DEFAULT 0,
  importado_por UUID NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Resumo por aluno/CPF dentro de uma importação (append-only)
CREATE TABLE public.resumo_repasse_aluno (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relatorio_id UUID NOT NULL REFERENCES public.relatorios_repasse(id) ON DELETE RESTRICT,
  cpf_aluno VARCHAR(11) NOT NULL,
  total_repasse NUMERIC(12,2) NOT NULL DEFAULT 0,
  competencia_inicio VARCHAR(20),
  parcela_1_valor_repasse NUMERIC(12,2),
  teve_parcela_1 BOOLEAN NOT NULL DEFAULT false,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Resultado da conciliação por venda de Graduação pendente de liberação
CREATE TABLE public.conciliacoes_repasse (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relatorio_id UUID NOT NULL REFERENCES public.relatorios_repasse(id) ON DELETE RESTRICT,
  venda_id UUID NOT NULL REFERENCES public.vendas(id) ON DELETE RESTRICT,
  comissao_id UUID REFERENCES public.comissoes(id) ON DELETE RESTRICT,
  cpf_aluno VARCHAR(11) NOT NULL,
  resultado VARCHAR(15) NOT NULL CHECK (resultado IN ('APARECEU', 'NAO_APARECEU', 'AMBIGUO')),
  competencia_inicio VARCHAR(20),
  valor_repasse NUMERIC(12,2),
  confirmado_por UUID,
  confirmado_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_resumo_repasse_cpf ON public.resumo_repasse_aluno(relatorio_id, cpf_aluno);
CREATE INDEX idx_conciliacoes_repasse_relatorio ON public.conciliacoes_repasse(relatorio_id);
CREATE INDEX idx_conciliacoes_repasse_venda ON public.conciliacoes_repasse(venda_id);
CREATE INDEX idx_conciliacoes_repasse_cpf ON public.conciliacoes_repasse(cpf_aluno);

-- 4. Triggers de imutabilidade
CREATE OR REPLACE FUNCTION public.trg_prevent_changes_relatorios_repasse()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Operações de UPDATE e DELETE são bloqueadas em relatorios_repasse. Tabela append-only.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_changes_relatorios_repasse
BEFORE UPDATE OR DELETE ON public.relatorios_repasse
FOR EACH ROW EXECUTE FUNCTION public.trg_prevent_changes_relatorios_repasse();

CREATE OR REPLACE FUNCTION public.trg_prevent_changes_resumo_repasse_aluno()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Operações de UPDATE e DELETE são bloqueadas em resumo_repasse_aluno. Tabela append-only.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_changes_resumo_repasse_aluno
BEFORE UPDATE OR DELETE ON public.resumo_repasse_aluno
FOR EACH ROW EXECUTE FUNCTION public.trg_prevent_changes_resumo_repasse_aluno();

-- Em conciliacoes_repasse, UPDATE é permitido SOMENTE nos campos de confirmação.
CREATE OR REPLACE FUNCTION public.trg_conciliacoes_repasse_guard()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Operação de DELETE é bloqueada em conciliacoes_repasse.';
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.relatorio_id IS DISTINCT FROM OLD.relatorio_id
     OR NEW.venda_id IS DISTINCT FROM OLD.venda_id
     OR NEW.comissao_id IS DISTINCT FROM OLD.comissao_id
     OR NEW.cpf_aluno IS DISTINCT FROM OLD.cpf_aluno
     OR NEW.resultado IS DISTINCT FROM OLD.resultado
     OR NEW.competencia_inicio IS DISTINCT FROM OLD.competencia_inicio
     OR NEW.valor_repasse IS DISTINCT FROM OLD.valor_repasse
     OR NEW.criado_em IS DISTINCT FROM OLD.criado_em THEN
    RAISE EXCEPTION 'Apenas confirmado_por e confirmado_em podem ser alterados em conciliacoes_repasse.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_conciliacoes_repasse_guard
BEFORE UPDATE OR DELETE ON public.conciliacoes_repasse
FOR EACH ROW EXECUTE FUNCTION public.trg_conciliacoes_repasse_guard();

-- 5. RLS: exclusivo do perfil GESTOR
ALTER TABLE public.relatorios_repasse ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumo_repasse_aluno ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conciliacoes_repasse ENABLE ROW LEVEL SECURITY;

CREATE POLICY "relatorios_repasse select gestor" ON public.relatorios_repasse
FOR SELECT USING (auth.jwt() -> 'app_metadata' ->> 'app_role' = 'GESTOR');
CREATE POLICY "relatorios_repasse insert gestor" ON public.relatorios_repasse
FOR INSERT WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'app_role' = 'GESTOR');

CREATE POLICY "resumo_repasse_aluno select gestor" ON public.resumo_repasse_aluno
FOR SELECT USING (auth.jwt() -> 'app_metadata' ->> 'app_role' = 'GESTOR');
CREATE POLICY "resumo_repasse_aluno insert gestor" ON public.resumo_repasse_aluno
FOR INSERT WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'app_role' = 'GESTOR');

CREATE POLICY "conciliacoes_repasse select gestor" ON public.conciliacoes_repasse
FOR SELECT USING (auth.jwt() -> 'app_metadata' ->> 'app_role' = 'GESTOR');
CREATE POLICY "conciliacoes_repasse insert gestor" ON public.conciliacoes_repasse
FOR INSERT WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'app_role' = 'GESTOR');
CREATE POLICY "conciliacoes_repasse update gestor" ON public.conciliacoes_repasse
FOR UPDATE USING (auth.jwt() -> 'app_metadata' ->> 'app_role' = 'GESTOR')
WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'app_role' = 'GESTOR');

-- 6. Bucket privado para os relatórios importados
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('relatorios_repasse', 'relatorios_repasse', false, 5242880, ARRAY['text/csv', 'text/plain', 'application/vnd.ms-excel'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "relatorios_repasse storage select gestor" ON storage.objects
FOR SELECT USING (bucket_id = 'relatorios_repasse' AND auth.jwt() -> 'app_metadata' ->> 'app_role' = 'GESTOR');
CREATE POLICY "relatorios_repasse storage insert gestor" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'relatorios_repasse' AND auth.jwt() -> 'app_metadata' ->> 'app_role' = 'GESTOR');
CREATE POLICY "relatorios_repasse storage update gestor" ON storage.objects
FOR UPDATE USING (bucket_id = 'relatorios_repasse' AND auth.jwt() -> 'app_metadata' ->> 'app_role' = 'GESTOR');
CREATE POLICY "relatorios_repasse storage delete gestor" ON storage.objects
FOR DELETE USING (bucket_id = 'relatorios_repasse' AND auth.jwt() -> 'app_metadata' ->> 'app_role' = 'GESTOR');
