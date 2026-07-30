# Delta no Modelo de Dados (Data-Delta)

> Identificador: `001-implementar-v1-comissionamento`  
> Data: `2026-07-23`  
> Fonte Canônica: `_reversa_sdd/decisions-gate.md`  

---

## 1. Visão Geral das Entidades V1

O modelo de dados para a V1 implementa as entidades unificadas do `decisions-gate.md`, garantindo imutabilidade contábil, unicidade de comprovantes por hash SHA-256 e isolamento RLS granular por operação. Vendas e evidências são registros permanentes de auditoria e jamais são removidos fisicamente do banco de dados.

---

## 2. Enumerados (Enums PostgreSQL)

```sql
-- Status do Apontamento de Venda
CREATE TYPE status_venda_enum AS ENUM (
    'PENDENTE_VALIDACAO',  -- Venda criada pelo Vendedor/Secretaria com comprovante
    'DEVOLVIDA_AJUSTE',    -- Auditor rejeitou comprovante (com justificativa)
    'APROVADA',            -- Auditor validou comprovante
    'CANCELADA_ESTORNADA'  -- Venda estornada pela gestão (gera lançamento negativo no Livro-Caixa)
);

-- Status da Comissão
CREATE TYPE status_comissao_enum AS ENUM (
    'BLOQUEADA_AUDITORIA',       -- Venda ainda não foi aprovada pelo auditor
    'AGUARDANDO_INICIO_AULAS',   -- Venda aprovada, mas data_inicio_curso > HOJE
    'LIBERADA_PAGAMENTO',        -- Venda aprovada E data_inicio_curso <= HOJE
    'PAGA',                      -- Comissão paga no fechamento mensal
    'ESTORNADA'                  -- Comissão cancelada por reembolso/estorno
);
```

---

## 3. Definições de Tabelas DDL, Constraints e Imutabilidade

### 3.1. Tabela `cursos` (DEC-02)
```sql
CREATE TABLE cursos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    valor_curso NUMERIC(10, 2) NOT NULL,
    valor_comissao_fixo NUMERIC(10, 2) NOT NULL, -- Comissão em valor fixo R$
    data_inicio_curso DATE NOT NULL,             -- Trava de liberação (DEC-03)
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);
```

### 3.2. Tabela `vendas` e Trava de Imutabilidade Cadastral (DEC-01, DEC-04)
```sql
CREATE TABLE vendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID NOT NULL REFERENCES alunos(id),
    curso_id UUID NOT NULL REFERENCES cursos(id),
    valor_entrada NUMERIC(10, 2) NOT NULL,       -- Entrada inicial (DEC-01)
    status_venda status_venda_enum NOT NULL DEFAULT 'PENDENTE_VALIDACAO',
    motivo_devolucao TEXT,
    criado_por UUID NOT NULL,                     -- User ID do Vendedor ou Secretaria
    criado_em TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- Trigger para impedir mutação de dados cadastrais essenciais da venda após a criação
CREATE OR REPLACE FUNCTION block_vendas_data_mutation()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.aluno_id <> NEW.aluno_id OR OLD.curso_id <> NEW.curso_id OR OLD.valor_entrada <> NEW.valor_entrada OR OLD.criado_por <> NEW.criado_por THEN
        RAISE EXCEPTION 'Dados cadastrais da venda (aluno_id, curso_id, valor_entrada, criado_por) sao imutaveis apos a criacao.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_vendas_data_mutation
BEFORE UPDATE ON vendas
FOR EACH ROW EXECUTE FUNCTION block_vendas_data_mutation();
```

### 3.3. Tabela `evidencias_vendas` e Integridade Referencial (DEC-05)
```sql
CREATE TABLE evidencias_vendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venda_id UUID NOT NULL REFERENCES vendas(id) ON DELETE RESTRICT, -- RESTRICT impede remoção de vendas
    sha256_checksum VARCHAR(64) NOT NULL,         -- Hash SHA-256 da imagem
    storage_path TEXT NOT NULL,                   -- Caminho no Bucket Privado
    nome_arquivo VARCHAR(255) NOT NULL,
    tamanho_bytes BIGINT NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT unique_hash_sha256 UNIQUE (sha256_checksum) -- Trava 1 Comprovante = 1 Venda
);
```

### 3.4. Tabela `vendas_historico_status` (Log Auditável de Transições)
```sql
CREATE TABLE vendas_historico_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venda_id UUID NOT NULL REFERENCES vendas(id),
    status_anterior status_venda_enum,
    status_novo status_venda_enum NOT NULL,
    motivo TEXT,
    alterado_por UUID NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);
```

### 3.5. Tabela `comissoes` (DEC-02, DEC-03)
```sql
CREATE TABLE comissoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venda_id UUID NOT NULL UNIQUE REFERENCES vendas(id),
    beneficiario_id UUID NOT NULL,               -- User ID do Vendedor/Secretaria
    valor_comissao NUMERIC(10, 2) NOT NULL,      -- Copiado do valor_comissao_fixo do curso
    status_comissao status_comissao_enum NOT NULL DEFAULT 'BLOQUEADA_AUDITORIA',
    liberada_em TIMESTAMPTZ,
    paga_em TIMESTAMPTZ,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);
```

### 3.6. Tabela `livro_caixa_lancamentos` (DEC-06 - Append-Only)
```sql
CREATE TABLE livro_caixa_lancamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comissao_id UUID REFERENCES comissoes(id),
    tipo_lancamento VARCHAR(30) NOT NULL,        -- 'PAGAMENTO_COMISSAO', 'ESTORNO_COMISSAO'
    valor_credito NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    valor_debito NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    mes_competencia VARCHAR(7) NOT NULL,         -- Format 'YYYY-MM' (fuso America/Sao_Paulo)
    historico TEXT NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- Trigger de Imutabilidade Append-Only
CREATE OR REPLACE FUNCTION block_update_delete_livro_caixa()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'A tabela livro_caixa_lancamentos eh imutavel (append-only). UPDATE e DELETE sao proibidos.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_changes_livro_caixa
BEFORE UPDATE OR DELETE ON livro_caixa_lancamentos
FOR EACH ROW EXECUTE FUNCTION block_update_delete_livro_caixa();
```

---

## 4. Políticas de Row Level Security (RLS) Granulares por Operação (DEC-04)

```sql
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;

-- 1. POLICY SELECT (Leitura)
CREATE POLICY vendas_select_policy ON vendas
    FOR SELECT
    TO authenticated
    USING (
        (
            (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'app_role') IN ('VENDEDOR', 'SECRETARIA')
            AND criado_por = ((current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid)
        )
        OR (
            (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'app_role') IN ('AUDITOR', 'GESTOR')
        )
    );

-- 2. POLICY INSERT (Inserção apenas por Vendedor e Secretaria)
CREATE POLICY vendas_insert_policy ON vendas
    FOR INSERT
    TO authenticated
    WITH CHECK (
        (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'app_role') IN ('VENDEDOR', 'SECRETARIA')
        AND criado_por = ((current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid)
        AND status_venda = 'PENDENTE_VALIDACAO'
    );

-- 3. POLICY UPDATE (Atualização restrita por perfil e status)
CREATE POLICY vendas_update_policy ON vendas
    FOR UPDATE
    TO authenticated
    USING (
        -- Vendedor / Secretaria só atualizam vendas em ajuste para reenviar
        (
            (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'app_role') IN ('VENDEDOR', 'SECRETARIA')
            AND criado_por = ((current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid)
            AND status_venda = 'DEVOLVIDA_AJUSTE'
        )
        -- Auditor aprova ou devolve vendas pendentes
        OR (
            (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'app_role') = 'AUDITOR'
            AND status_venda = 'PENDENTE_VALIDACAO'
        )
        -- Gestor estorna vendas aprovadas
        OR (
            (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'app_role') = 'GESTOR'
        )
    )
    WITH CHECK (
        (
            (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'app_role') IN ('VENDEDOR', 'SECRETARIA')
            AND criado_por = ((current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid)
            AND status_venda = 'PENDENTE_VALIDACAO'
        )
        OR (
            (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'app_role') = 'AUDITOR'
            AND status_venda IN ('APROVADA', 'DEVOLVIDA_AJUSTE')
        )
        OR (
            (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'app_role') = 'GESTOR'
            AND status_venda = 'CANCELADA_ESTORNADA'
        )
    );

-- 4. POLICY DELETE (Exclusão proibida para TODOS os perfis)
-- Nenhuma policy para DELETE é criada; por padrão no PostgreSQL RLS ativado, DELETE sem policy resulta em bloqueio total.
```

---
*Detalhamento do modelo de dados para a V1 com RLS granular e integridade referencial.*
