# Data Delta — Listagem de alunos com CPF mascarado e trilha de auditoria

> Identificador: `005-listar-alunos-cpf-auditoria`
> Data: `2026-09-28`
> Base extraída: `_reversa_sdd/data-dictionary.md#alunos`, `supabase/migrations/001_schema.sql`
> Regra Reversa: a migration de feature é delta e não edita `001_schema.sql`.

## 1. Resumo do delta

| Objeto | Tipo | Ação |
|--------|------|------|
| `alunos_cpf_historico` | tabela | criar (append-only) |
| `alunos` | tabela existente | **sem alteração de estrutura** (só o valor de `cpf` muda pela correção) |

## 2. Tabela `alunos_cpf_historico` (append-only)

| Campo | Tipo | Restrições | Nota |
|-------|------|------------|------|
| `id` | UUID | PK, `gen_random_uuid()` | |
| `aluno_id` | UUID | FK → `alunos(id)` ON DELETE RESTRICT, NOT NULL | |
| `valor_anterior` | VARCHAR(11) | NOT NULL | CPF antes (só dígitos) |
| `valor_novo` | VARCHAR(11) | NOT NULL | CPF depois (só dígitos) |
| `motivo` | TEXT | NOT NULL | motivo obrigatório (RN-08) |
| `autor_id` | UUID | NOT NULL | `auth.uid()` do GESTOR |
| `criado_em` | TIMESTAMPTZ | NOT NULL DEFAULT `now()` | |

Índice: `idx_alunos_cpf_historico_aluno_id ON alunos_cpf_historico(aluno_id)`.

Trigger `trg_prevent_changes_alunos_cpf_historico` (BEFORE UPDATE OR DELETE) → RAISE EXCEPTION (padrão `trg_prevent_changes_livro_caixa` de `001_schema.sql`).

## 3. RLS

`ENABLE ROW LEVEL SECURITY`. Policies:

- `SELECT` para `GESTOR` e `AUDITOR` (RF-06).
- `INSERT` para `GESTOR` (escrita real ocorre via server action com service role, que ignora RLS, mas a policy mantém a intenção).
- Sem policy de `UPDATE`/`DELETE`.

Padrão de claim: `auth.jwt() -> 'app_metadata' ->> 'app_role'`.

## 4. Migration

Arquivo: `supabase/migrations/20260928000001_alunos_cpf_historico.sql`
Conteúdo: criação da tabela, índice, trigger append-only, `ENABLE ROW LEVEL SECURITY` e policies GESTOR/AUDITOR.

## 5. Impacto em dados existentes

Nenhum backfill. A tabela nasce vazia; os registros de correção são criados sob demanda. `alunos.cpf` continua `VARCHAR(11) UNIQUE` em texto claro.
