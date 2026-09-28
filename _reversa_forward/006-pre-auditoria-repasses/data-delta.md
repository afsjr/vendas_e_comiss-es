# Data Delta — Pré-auditoria de repasses de Graduação

> Identificador: `006-pre-auditoria-repasses`
> Data: `2026-09-28`
> Base extraída: `_reversa_sdd/data-dictionary.md`, `supabase/migrations/001_schema.sql`, `supabase/migrations/20260909000000_postvenda_status.sql`
> Regra Reversa: a migration de feature **não edita** `001_schema.sql`; evolui por delta (ver `20260909000000_postvenda_status.sql` como referência).

## 1. Resumo do delta

| Objeto | Tipo | Ação |
|--------|------|------|
| `relatorios_repasse` | tabela | criar (append-only) |
| `resumo_repasse_aluno` | tabela | criar (append-only) |
| `conciliacoes_repasse` | tabela | criar (UPDATE só para confirmação) |
| bucket `relatorios_repasse` | storage | criar (privado) |
| `vendas` / `comissoes` / `alunos` | tabelas existentes | **sem alteração de colunas** |

A liberação da comissão reusa `comissoes.status` (`LIBERADA_PAGAMENTO`) e `comissoes.data_liberacao`, já existentes.

## 2. Tabela `relatorios_repasse` (append-only)

Metadados de cada importação.

| Campo | Tipo | Restrições | Nota |
|-------|------|------------|------|
| `id` | UUID | PK, `gen_random_uuid()` | |
| `storage_path` | VARCHAR(512) | NOT NULL | bucket `relatorios_repasse` |
| `formato` | VARCHAR(10) | NOT NULL, CHECK `('CSV')` | RN-10 |
| `competencia_pagamento` | VARCHAR(20) | NULL | ex.: `Agosto/2026` (cabeçalho do relatório) |
| `bp_polo` | VARCHAR(20) | NULL | metadado `BP Polo` (RN-02) |
| `divisao` | VARCHAR(20) | NULL | metadado `Divisao` |
| `sha256_checksum` | VARCHAR(64) | NOT NULL, **UNIQUE** | anti-reimportação |
| `total_linhas` | INTEGER | NOT NULL DEFAULT 0 | linhas lidas |
| `linhas_validas` | INTEGER | NOT NULL DEFAULT 0 | linhas interpretadas |
| `importado_por` | UUID | NOT NULL | `auth.uid()` |
| `criado_em` | TIMESTAMPTZ | NOT NULL DEFAULT `now()` | |

Trigger `trg_prevent_changes_relatorios_repasse` (BEFORE UPDATE OR DELETE) → RAISE EXCEPTION (padrão `trg_prevent_changes_livro_caixa`).

## 3. Tabela `resumo_repasse_aluno` (append-only)

Resumo por CPF dentro de uma importação (RN-08).

| Campo | Tipo | Restrições | Nota |
|-------|------|------------|------|
| `id` | UUID | PK | |
| `relatorio_id` | UUID | FK → `relatorios_repasse(id)` ON DELETE RESTRICT | |
| `cpf_aluno` | VARCHAR(11) | NOT NULL | 11 dígitos |
| `total_repasse` | NUMERIC(12,2) | NOT NULL DEFAULT 0 | soma de `Valor_Repasse` |
| `competencia_inicio` | VARCHAR(20) | NULL | competência da parcela 1 |
| `parcela_1_valor_repasse` | NUMERIC(12,2) | NULL | valor repassado da parcela 1 |
| `teve_parcela_1` | BOOLEAN | NOT NULL DEFAULT false | habilita comissão (RN-04) |
| `criado_em` | TIMESTAMPTZ | NOT NULL DEFAULT `now()` | |

Índice: `idx_resumo_repasse_cpf ON resumo_repasse_aluno(relatorio_id, cpf_aluno)`.
Trigger append-only idêntico.

## 4. Tabela `conciliacoes_repasse`

Resultado por **venda** de Graduação pendente de liberação (RN-12).

| Campo | Tipo | Restrições | Nota |
|-------|------|------------|------|
| `id` | UUID | PK | |
| `relatorio_id` | UUID | FK → `relatorios_repasse(id)` ON DELETE RESTRICT | |
| `venda_id` | UUID | FK → `vendas(id)` ON DELETE RESTRICT | |
| `comissao_id` | UUID | FK → `comissoes(id)` ON DELETE RESTRICT, NULL | |
| `cpf_aluno` | VARCHAR(11) | NOT NULL | |
| `resultado` | VARCHAR(15) | NOT NULL, CHECK `('APARECEU','NAO_APARECEU','AMBIGUO')` | RN-04/RN-09 |
| `competencia_inicio` | VARCHAR(20) | NULL | da parcela 1 |
| `valor_repasse` | NUMERIC(12,2) | NULL | |
| `confirmado_por` | UUID | NULL | GESTOR |
| `confirmado_em` | TIMESTAMPTZ | NULL | |
| `criado_em` | TIMESTAMPTZ | NOT NULL DEFAULT `now()` | |

Índices: `idx_conciliacoes_repasse_relatorio(relatorio_id)`, `idx_conciliacoes_repasse_venda(venda_id)`.

Diferente das duas anteriores, permite `UPDATE` **apenas** dos campos `confirmado_por`/`confirmado_em`. Trigger `trg_conciliacoes_repasse_guard` bloqueia `UPDATE` de qualquer outra coluna e bloqueia `DELETE`.

## 5. RLS (todas as três tabelas)

`ENABLE ROW LEVEL SECURITY`; policies restritas a `GESTOR` (RN-11), espelhando o padrão `auth.jwt() -> 'app_metadata' ->> 'app_role'`:

- `SELECT` e `INSERT` permitidos se `app_role = 'GESTOR'`.
- `UPDATE` (apenas em `conciliacoes_repasse`) permitido se `app_role = 'GESTOR'`.
- `DELETE` negado para todos (sem policy).

## 6. Storage

Bucket `relatorios_repasse` privado (limite 5 MB, MIME `text/csv`, `application/vnd.ms-excel`). Policy de storage: acesso apenas quando `app_metadata.app_role = 'GESTOR'`.

## 7. Migration

Arquivo: `supabase/migrations/20260928000000_pre_auditoria_repasses.sql`
Conteúdo: criação das 3 tabelas, índices, triggers append-only/guard, `ALTER ... ENABLE ROW LEVEL SECURITY`, policies GESTOR e criação do bucket + policies de storage.

## 8. Impacto em dados existentes

Nenhum backfill. As tabelas são novas e não referenciam registros prévios. `vendas`, `comissoes` e `alunos` não mudam de estrutura.
