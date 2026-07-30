-- Enums
CREATE TYPE status_venda_enum AS ENUM (
  'PENDENTE_VALIDACAO',
  'APROVADA',
  'DEVOLVIDA_AJUSTE'
);

CREATE TYPE status_comissao_enum AS ENUM (
  'AGUARDANDO_INICIO_AULAS',
  'LIBERADA_PAGAMENTO',
  'PAGA',
  'BLOQUEADA_AUDITORIA',
  'ESTORNADA'
);

CREATE TYPE lancamento_tipo_enum AS ENUM (
  'CRÉDITO',
  'DÉBITO'
);

-- Tabelas core
CREATE TABLE cursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('Técnico', 'Graduação', 'Pós-Graduação', 'Cursos Livres')),
  valor_comissao_fixo NUMERIC(10,2) NOT NULL CHECK (valor_comissao_fixo > 0),
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  cpf VARCHAR(11) NOT NULL UNIQUE,
  rg VARCHAR(20),
  email VARCHAR(255) NOT NULL,
  criado_por UUID NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE documentos_alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE RESTRICT,
  tipo VARCHAR(50) NOT NULL,
  storage_path VARCHAR(512) NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE RESTRICT,
  curso_id UUID NOT NULL REFERENCES cursos(id) ON DELETE RESTRICT,
  valor_entrada NUMERIC(10,2) NOT NULL CHECK (valor_entrada > 0),
  status status_venda_enum NOT NULL DEFAULT 'PENDENTE_VALIDACAO',
  data_inicio_curso DATE NOT NULL,
  criado_por UUID NOT NULL,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE evidencias_vendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venda_id UUID NOT NULL REFERENCES vendas(id) ON DELETE RESTRICT,
  comprovante_storage_path VARCHAR(512) NOT NULL,
  sha256_checksum VARCHAR(64) NOT NULL UNIQUE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vendas_historico_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venda_id UUID NOT NULL REFERENCES vendas(id) ON DELETE RESTRICT,
  status_anterior status_venda_enum NOT NULL,
  status_novo status_venda_enum NOT NULL,
  motivo TEXT,
  mudado_por UUID NOT NULL,
  mudado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comissoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venda_id UUID NOT NULL UNIQUE REFERENCES vendas(id) ON DELETE RESTRICT,
  valor_comissao NUMERIC(10,2) NOT NULL CHECK (valor_comissao > 0),
  status status_comissao_enum NOT NULL DEFAULT 'AGUARDANDO_INICIO_AULAS',
  data_liberacao TIMESTAMP WITH TIME ZONE,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE livro_caixa_lancamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comissao_id UUID NOT NULL REFERENCES comissoes(id) ON DELETE RESTRICT,
  tipo lancamento_tipo_enum NOT NULL,
  valor_credito NUMERIC(10,2) CHECK ((tipo = 'CRÉDITO' AND valor_credito > 0) OR (tipo = 'DÉBITO' AND valor_credito IS NULL)),
  valor_debito NUMERIC(10,2) CHECK ((tipo = 'DÉBITO' AND valor_debito > 0) OR (tipo = 'CRÉDITO' AND valor_debito IS NULL)),
  descricao TEXT,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_alunos_cpf ON alunos(cpf);
CREATE INDEX idx_alunos_email ON alunos(email);
CREATE INDEX idx_documentos_alunos_aluno_id ON documentos_alunos(aluno_id);
CREATE INDEX idx_vendas_aluno_id ON vendas(aluno_id);
CREATE INDEX idx_vendas_curso_id ON vendas(curso_id);
CREATE INDEX idx_vendas_status ON vendas(status);
CREATE INDEX idx_vendas_criado_por ON vendas(criado_por);
CREATE INDEX idx_evidencias_vendas_venda_id ON evidencias_vendas(venda_id);
CREATE INDEX idx_vendas_historico_venda_id ON vendas_historico_status(venda_id);
CREATE INDEX idx_comissoes_venda_id ON comissoes(venda_id);
CREATE INDEX idx_comissoes_status ON comissoes(status);
CREATE INDEX idx_livro_caixa_comissao_id ON livro_caixa_lancamentos(comissao_id);

-- Triggers
CREATE OR REPLACE FUNCTION trg_prevent_changes_livro_caixa()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Operações de UPDATE e DELETE são bloqueadas na tabela livro_caixa_lancamentos. Tabela append-only.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_changes_livro_caixa
BEFORE UPDATE OR DELETE ON livro_caixa_lancamentos
FOR EACH ROW
EXECUTE FUNCTION trg_prevent_changes_livro_caixa();

CREATE OR REPLACE FUNCTION trg_prevent_vendas_data_mutation()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.aluno_id IS DISTINCT FROM NEW.aluno_id THEN
    RAISE EXCEPTION 'Não é permitido alterar aluno_id após a criação da venda';
  END IF;
  IF OLD.curso_id IS DISTINCT FROM NEW.curso_id THEN
    RAISE EXCEPTION 'Não é permitido alterar curso_id após a criação da venda';
  END IF;
  IF OLD.valor_entrada IS DISTINCT FROM NEW.valor_entrada THEN
    RAISE EXCEPTION 'Não é permitido alterar valor_entrada após a criação da venda';
  END IF;
  IF OLD.criado_por IS DISTINCT FROM NEW.criado_por THEN
    RAISE EXCEPTION 'Não é permitido alterar criado_por após a criação da venda';
  END IF;
  NEW.atualizado_em = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_vendas_data_mutation
BEFORE UPDATE ON vendas
FOR EACH ROW
EXECUTE FUNCTION trg_prevent_vendas_data_mutation();

-- RLS (Row Level Security)
ALTER TABLE cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidencias_vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas_historico_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE comissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE livro_caixa_lancamentos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cursos
CREATE POLICY "Cursos readable by authenticated users" ON cursos
FOR SELECT USING (auth.role() = 'authenticated_user');

-- RLS Policies for alunos
CREATE POLICY "Alunos readable by all roles" ON alunos
FOR SELECT USING (
  auth.jwt() ->> 'app_metadata' -> 'app_role' IN ('VENDEDOR', 'SECRETARIA', 'AUDITOR', 'GESTOR')
);

CREATE POLICY "Alunos insertable by VENDEDOR and SECRETARIA" ON alunos
FOR INSERT WITH CHECK (
  auth.jwt() ->> 'app_metadata' -> 'app_role' IN ('VENDEDOR', 'SECRETARIA')
);

-- RLS Policies for documentos_alunos
CREATE POLICY "Documentos alunos readable by all authenticated" ON documentos_alunos
FOR SELECT USING (auth.role() = 'authenticated_user');

CREATE POLICY "Documentos alunos insertable by VENDEDOR and SECRETARIA" ON documentos_alunos
FOR INSERT WITH CHECK (
  auth.jwt() ->> 'app_metadata' -> 'app_role' IN ('VENDEDOR', 'SECRETARIA')
);

-- RLS Policies for vendas
CREATE POLICY "Vendas readable by VENDEDOR (own) and others" ON vendas
FOR SELECT USING (
  (auth.jwt() ->> 'app_metadata' -> 'app_role' = 'VENDEDOR' AND criado_por = auth.uid())
  OR
  (auth.jwt() ->> 'app_metadata' -> 'app_role' IN ('AUDITOR', 'GESTOR'))
  OR
  (auth.jwt() ->> 'app_metadata' -> 'app_role' = 'SECRETARIA')
);

CREATE POLICY "Vendas insertable by VENDEDOR and SECRETARIA" ON vendas
FOR INSERT WITH CHECK (
  auth.jwt() ->> 'app_metadata' -> 'app_role' IN ('VENDEDOR', 'SECRETARIA')
);

-- RLS Policies for evidencias_vendas
CREATE POLICY "Evidencias vendas readable" ON evidencias_vendas
FOR SELECT USING (
  venda_id IN (
    SELECT id FROM vendas WHERE
    (criado_por = auth.uid() AND auth.jwt() ->> 'app_metadata' -> 'app_role' IN ('VENDEDOR', 'SECRETARIA'))
    OR
    (auth.jwt() ->> 'app_metadata' -> 'app_role' IN ('AUDITOR', 'GESTOR'))
  )
);

CREATE POLICY "Evidencias vendas insertable" ON evidencias_vendas
FOR INSERT WITH CHECK (
  venda_id IN (SELECT id FROM vendas WHERE criado_por = auth.uid())
);

-- RLS Policies for vendas_historico_status
CREATE POLICY "Historico vendas readable" ON vendas_historico_status
FOR SELECT USING (
  venda_id IN (
    SELECT id FROM vendas WHERE
    (criado_por = auth.uid() AND auth.jwt() ->> 'app_metadata' -> 'app_role' IN ('VENDEDOR', 'SECRETARIA'))
    OR
    (auth.jwt() ->> 'app_metadata' -> 'app_role' IN ('AUDITOR', 'GESTOR'))
  )
);

-- RLS Policies for comissoes
CREATE POLICY "Comissoes readable" ON comissoes
FOR SELECT USING (
  venda_id IN (
    SELECT id FROM vendas WHERE
    (criado_por = auth.uid() AND auth.jwt() ->> 'app_metadata' -> 'app_role' IN ('VENDEDOR', 'SECRETARIA'))
    OR
    (auth.jwt() ->> 'app_metadata' -> 'app_role' IN ('AUDITOR', 'GESTOR'))
  )
);

CREATE POLICY "Comissoes updatable by AUDITOR/GESTOR" ON comissoes
FOR UPDATE USING (auth.jwt() ->> 'app_metadata' -> 'app_role' IN ('AUDITOR', 'GESTOR'));

-- RLS Policies for livro_caixa_lancamentos
CREATE POLICY "Livro caixa readable by AUDITOR/GESTOR" ON livro_caixa_lancamentos
FOR SELECT USING (auth.jwt() ->> 'app_metadata' -> 'app_role' IN ('AUDITOR', 'GESTOR'));

CREATE POLICY "Livro caixa insertable by AUDITOR/GESTOR" ON livro_caixa_lancamentos
FOR INSERT WITH CHECK (auth.jwt() ->> 'app_metadata' -> 'app_role' IN ('AUDITOR', 'GESTOR'));
