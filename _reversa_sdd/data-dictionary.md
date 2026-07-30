# Dicionário de Dados — comissionamento e venda

> Gerado pelo **Arqueólogo** em 2026-07-26
> Fonte canônica: `supabase/migrations/001_schema.sql`
> ⚠️ Divergências com o código Rust documentadas em `_reversa_sdd/questions.md` (L1).
> 🟢 CONFIRMADO (do DDL) · 🟡 INFERIDO · 🔴 LACUNA

---

## Enums

### `status_venda_enum`
| Valor | Significado |
|-------|-------------|
| `PENDENTE_VALIDACAO` | Venda recém-criada, aguardando auditor (default) |
| `DEVOLVIDA_AJUSTE` | Auditor devolveu para vendedor corrigir |
| `APROVADA` | Auditor aprovou a venda |
| `CANCELADA_ESTORNADA` | Venda cancelada, comissão estornada |

### `status_comissao_enum`
| Valor | Significado |
|-------|-------------|
| `BLOQUEADA_AUDITORIA` | Comissão criada, bloqueada até auditoria (default) |
| `AGUARDANDO_INICIO_AULAS` | Venda aprovada mas curso ainda não começou |
| `LIBERADA_PAGAMENTO` | Pronta para pagamento no fechamento |
| `PAGA` | Paga no fechamento mensal |
| `ESTORNADA` | Estornada (venda cancelada) |

### `categoria` (cursos) — CHECK constraint
`TECNICO` · `GRADUACAO` · `POS_GRADUACAO` · `CURSO_LIVRE`

### `tipo_documento` (documentos_alunos) — CHECK
`RG` · `CPF` · `COMPROVANTE_RESIDENCIA` · `HISTORICO`

### `tipo_lancamento` (livro_caixa) — CHECK
`PAGAMENTO_COMISSAO` · `ESTORNO_COMISSAO`

---

## Tabelas

### `cursos`
| Campo | Tipo | Obrig. | Default | Notas |
|-------|------|--------|---------|-------|
| id | UUID PK | sim | gen_random_uuid() | |
| nome | VARCHAR(255) | sim | — | |
| categoria | VARCHAR(50) | sim | — | CHECK enum acima |
| valor_curso | NUMERIC(10,2) | sim | — | 🟡 Rust usa `valor_total` |
| valor_comissao_fixo | NUMERIC(10,2) | sim | — | 🟡 Rust usa `percentual_comissao` (conflito I2) |
| data_inicio_curso | DATE | sim | — | define liberação de comissão |
| ativo | BOOLEAN | sim | true | |
| criado_em | TIMESTAMPTZ | sim | clock_timestamp() | |

🟡 **Inferido:** o DDL usa **valor fixo** de comissão por curso; o Rust (`comissoes.rs:calcular`) usa **percentual** sobre `valor_total`. Decisão de negógio não resolvida (I2).

### `alunos`
| Campo | Tipo | Obrig. | Default | Notas |
|-------|------|--------|---------|-------|
| id | UUID PK | sim | gen_random_uuid() | |
| nome | VARCHAR(255) | sim | — | |
| cpf | VARCHAR(11) | sim | — | UNIQUE, só dígitos |
| rg | VARCHAR(20) | não | — | |
| email | VARCHAR(255) | não | — | |
| telefone | VARCHAR(20) | não | — | |
| criado_por | UUID | sim | — | 🟡 = `auth.users.id` (sub do JWT) |
| criado_em | TIMESTAMPTZ | sim | clock_timestamp() | |
| atualizado_em | TIMESTAMPTZ | sim | clock_timestamp() | |

RLS: VENDEDOR/SECRETARIA veem apenas os que criaram; AUDITOR/GESTOR veem todos.

### `vendas`
| Campo | Tipo | Obrig. | Default | Notas |
|-------|------|--------|---------|-------|
| id | UUID PK | sim | gen_random_uuid() | |
| aluno_id | UUID FK→alunos | sim | — | imutável pós-criação (trigger) |
| curso_id | UUID FK→cursos | sim | — | imutável |
| valor_entrada | NUMERIC(10,2) | sim | — | imutável; 🟡 Rust usa `valor_total` |
| status_venda | status_venda_enum | sim | `PENDENTE_VALIDACAO` | 🔴 Rust usa `status` |
| motivo_devolucao | TEXT | não | — | setado na devolução |
| criado_por | UUID | sim | — | 🔴 Rust omite no INSERT (NOT NULL!) |
| criado_em | TIMESTAMPTZ | sim | clock_timestamp() | 🔴 Rust usa `criado_em`/`atualizado_em` manual |
| atualizado_em | TIMESTAMPTZ | sim | clock_timestamp() | |

**Trigger `block_vendas_data_mutation`:** proíbe UPDATE em `aluno_id`, `curso_id`, `valor_entrada`, `criado_por`.

RLS granular por papel + status (SELECT/INSERT/UPDATE policies — ver módulo auth-rls).

🔴 **Lacuna L1:** o Rust não tem `valor_total`, `forma_pagamento`, `vendedor_id` — colunas referenciadas em `contratos.rs`/`comissoes.rs` que **não existem** no DDL.

### `evidencias_vendas`
| Campo | Tipo | Obrig. | Default | Notas |
|-------|------|--------|---------|-------|
| id | UUID PK | sim | gen_random_uuid() | |
| venda_id | UUID FK→vendas | sim | — | ON DELETE RESTRICT |
| sha256_checksum | VARCHAR(64) | sim | — | UNIQUE — anti-fraude |
| storage_path | TEXT | sim | — | bucket `comprovantes` |
| nome_arquivo | VARCHAR(255) | sim | — | |
| tamanho_bytes | BIGINT | sim | — | 🔴 Rust não grava (NOT NULL!) |
| criado_em | TIMESTAMPTZ | sim | clock_timestamp() | |

🔴 Rust usa nome `evidencias_venda` (singular) e omite `nome_arquivo`/`tamanho_bytes`.

### `vendas_historico_status`
| Campo | Tipo | Obrig. | Default | Notas |
|-------|------|--------|---------|-------|
| id | UUID PK | sim | gen_random_uuid() | |
| venda_id | UUID FK→vendas | sim | — | |
| status_anterior | status_venda_enum | não | — | |
| status_novo | status_venda_enum | sim | — | |
| motivo | TEXT | não | — | |
| alterado_por | UUID | sim | — | |
| criado_em | TIMESTAMPTZ | sim | clock_timestamp() | |

🟢 Append-only (sem trigger de bloqueio, mas sem UPDATE no código).

### `comissoes`
| Campo | Tipo | Obrig. | Default | Notas |
|-------|------|--------|---------|-------|
| id | UUID PK | sim | gen_random_uuid() | |
| venda_id | UUID FK→vendas | sim | — | UNIQUE (1:1) |
| beneficiario_id | UUID | sim | — | 🟡 = vendedor; 🔴 Rust omite no INSERT |
| valor_comissao | NUMERIC(10,2) | sim | — | 🔴 Rust nunca calcula/grava (NOT NULL!) |
| status_comissao | status_comissao_enum | sim | `BLOQUEADA_AUDITORIA` | 🔴 Rust usa `status` |
| liberada_em | TIMESTAMPTZ | não | — | setado em `process_daily_commission_release` |
| paga_em | TIMESTAMPTZ | não | — | setado no fechamento mensal |
| criado_em | TIMESTAMPTZ | sim | clock_timestamp() | |

RLS: VENDEDOR/SECRETARIA veem apenas suas comissões (`beneficiario_id = sub`); AUDITOR/GESTOR veem todas.

### `livro_caixa_lancamentos`
| Campo | Tipo | Obrig. | Default | Notas |
|-------|------|--------|---------|-------|
| id | UUID PK | sim | gen_random_uuid() | |
| comissao_id | UUID FK→comissoes | não | — | 🔴 Rust usa `venda_id` |
| tipo_lancamento | VARCHAR(30) | sim | — | CHECK enum; 🔴 Rust usa `tipo` |
| valor_credito | NUMERIC(10,2) | sim | 0.00 | 🔴 Rust usa `valor` |
| valor_debito | NUMERIC(10,2) | sim | 0.00 | |
| mes_competencia | VARCHAR(7) | sim | — | formato "YYYY-MM" |
| historico | TEXT | sim | — | 🔴 Rust usa `descricao` |
| criado_em | TIMESTAMPTZ | sim | clock_timestamp() | 🔴 Rust usa `created_at` |

**Trigger `block_update_delete_livro_caixa`:** UPDATE e DELETE proibidos (append-only real).

### `documentos_alunos`
| Campo | Tipo | Obrig. | Default | Notas |
|-------|------|--------|---------|-------|
| id | UUID PK | sim | gen_random_uuid() | |
| aluno_id | UUID FK→alunos | sim | — | |
| tipo_documento | VARCHAR(30) | sim | — | CHECK enum |
| storage_path | TEXT | sim | — | bucket `documentos_alunos` |
| nome_arquivo | VARCHAR(255) | sim | — | |
| entregue | BOOLEAN | sim | false | |
| criado_em | TIMESTAMPTZ | sim | clock_timestamp() | |

---

## Storage buckets (Supabase)

| Bucket | Público | Limite | MIME |
|--------|---------|--------|------|
| `comprovantes` | não | 5 MB | png, jpeg, webp, pdf |
| `documentos_alunos` | não | 10 MB | png, jpeg, webp, pdf |
| `contratos_pdf` | não | 10 MB | pdf |

Políticas de storage: `comprovantes` acessível por proprietário (path começa com `sub/`) ou AUDITOR/GESTOR.

---

## Tipos TypeScript (frontend) — `types/index.ts`

| Tipo | Valores |
|------|---------|
| `AppRole` | `'VENDEDOR' \| 'SECRETARIA' \| 'AUDITOR' \| 'GESTOR'` |
| `StatusVenda` | 4 valores (espelha enum) |
| `StatusComissao` | 5 valores (espelha enum) |
| `Curso` | id, nome, categoria, valor_curso, valor_comissao_fixo, data_inicio_curso |
| `Venda` | id, aluno_id, curso_id, valor_entrada, status_venda, criado_em |
| `VendaDetalhada` | Venda + aluno_nome, curso_nome |
| `Comissao` | venda_id, curso_nome, valor_comissao, status_comissao, data_liberacao |
| `DashboardKpi` | titulo, valor, variacao |

🟢 Frontend types **alinhados ao DDL** (usam `valor_entrada`, `valor_comissao_fixo`, `status_venda`) — divergem do backend Rust.
