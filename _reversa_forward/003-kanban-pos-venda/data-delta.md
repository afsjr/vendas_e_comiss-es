# Data Delta: Kanban de Pós-Venda

> Identificador: `003-kanban-pos-venda`
> Data: `2026-09-09`
> Fonte canônica do estado atual: `supabase/migrations/001_schema.sql`, `supabase/migrations/20260730094500_create_perfis_table.sql`, `supabase/migrations/20260730094501_create_perfis_rls.sql`

## 1. Diferença conceitual

A entidade `vendas` deixa de ter só o ciclo "pendente → aprovada/devolvida" e passa a carregar um ciclo de pós-venda com 3 contraprovas (contrato, boleto, comprovante de pagamento da 1ª mensalidade). O modelo de histórico e a política RLS continuam sendo o `vendas_historico_status` e o `app_metadata.app_role`.

## 2. Mudanças em enums

### `status_venda_enum` — 4 valores novos (append via `ALTER TYPE ... ADD VALUE`)

| Novo valor | Semântica | Preenchido por | Trava exigida |
|------------|-----------|----------------|---------------|
| `AGUARDANDO_FINANCEIRO` | Contrato validado e enviado; Financeiro vai emitir cobrança | SECRETARIA | `contrato_storage_path` NOT NULL |
| `AGUARDANDO_PAGAMENTO_1M` | Cobrança emitida (externo); aguarda pagamento da 1ª mensalidade | FINANCEIRO | `boleto_referencia` NOT NULL |
| `PRIMEIRA_MENSALIDADE_PAGA` | 1ª mensalidade quitada (confirmada); apta à auditoria final | FINANCEIRO | `comprovante_pgto_1m_path` NOT NULL |
| `CANCELADA` | Desistência/estorno; comissão → `ESTORNADA` | SECRETARIA (ou ADMIN) | `motivo` NOT NULL |

**Valores existentes mantidos:** `PENDENTE_VALIDACAO` (fila da Secretaria / venda nova), `DEVOLVIDA_AJUSTE` (devolvida ao Vendedor — RN-05), `APROVADA` (após auditoria, somente a partir de `PRIMEIRA_MENSALIDADE_PAGA`).

### `status_comissao_enum` — sem mudança
Os 5 valores existentes atendem: `BLOQUEADA_AUDITORIA`, `AGUARDANDO_INICIO_AULAS`, `LIBERADA_PAGAMENTO`, `PAGA`, `ESTORNADA` (para `CANCELADA`).

## 3. Mudanças em tabelas

### `vendas` — 3 colunas novas (opcionais, sem default)

| Coluna | Tipo | Obrig. | Notas |
|--------|------|--------|-------|
| `contrato_storage_path` | VARCHAR(512) | não (exigido por trava na transição) | Path no bucket `contratos_pdf`; exigido para `PENDENTE_VALIDACAO` → `AGUARDANDO_FINANCEIRO` |
| `boleto_referencia` | VARCHAR(255) | não (exigido por trava na transição) | Referência/identificador do boleto emitido externamente (sistema bancário é Won't Have) |
| `comprovante_pgto_1m_path` | VARCHAR(512) | não (exigido por trava na transição) | Path no bucket `comprovantes`; exigido para `AGUARDANDO_PAGAMENTO_1M` → `PRIMEIRA_MENSALIDADE_PAGA` |

> As travas ficam nas transições da Edge Function `postvenda-mover`: `motivo`, `boleto_referencia` e paths são verificados antes do `UPDATE`. Colunas nuláveis no DDL; obrigatoriedade é transitória.

### `perfis` — papel novo

- `role` CHECK constraint passa a aceitar `'FINANCEIRO'` (DROP + re-criar constraint).

## 4. RLS — papéis novos nas policies existentes

Base: `001_schema.sql` (todas via `app_metadata.app_role`).

| Policy | Mudança |
|--------|---------|
| `vendas` SELECT | incluir `OR (auth.jwt() -> 'app_metadata' ->> 'app_role' = 'FINANCEIRO')` — Financeiro enxerga a fila completa de pós-venda |
| `evidencias_vendas` SELECT | via subselect em `vendas` (`FINANCEIRO` no subselect) |
| `vendas_historico_status` SELECT | idem (estrutura espelha vendas) |
| `comissoes` SELECT | idem (Financeiro pode consultar situação da comissão para validar destravamento) |
| `livro_caixa_lancamentos` | sem mudança (AUDITOR/GESTOR apenas) |
| Storage `comprovantes` | sem mudança estrutural — o Financeiro grava comprovante em path `sub/<id>/...` (policy de INSERT já aceita qualquer autenticado com path próprio) e lê o próprio por prefixo |

**Ressalva de segurança:** `vendas` NÃO terá policy de UPDATE — transições de status continuam exclusivas das Edge Functions com `SERVICE_ROLE_KEY` (padrão atual), garantindo a trava independente de RLS.

## 5. Migrações necessárias (ordem de aplicação)

1. `supabase/migrations/20260909000000_postvenda_status.sql`
   - `ALTER TYPE status_venda_enum ADD VALUE ...` (4 valores)
   - `ALTER TABLE vendas ADD COLUMN contrato_storage_path VARCHAR(512)`, `boleto_referencia VARCHAR(255)`, `comprovante_pgto_1m_path VARCHAR(512)`
   - DROP/re-criar CHECK de `perfis.role` com `'FINANCEIRO'`
2. `supabase/migrations/20260909000001_postvenda_rls.sql`
   - Policies SELECT têm `FINANCEIRO` adicionado (vendas, evidencias_vendas, vendas_historico_status, comissoes)

## 6. Nota sobre tipos no código

Os tipos espelham o enum em dois lugares e precisarão de `'AGUARDANDO_FINANCEIRO' | ... | 'CANCELADA'` e `'FINANCEIRO'`:
- `supabase/functions/_shared/types.ts` (`StatusVenda`, `UserRole`)
- `src/types/index.ts` (`AppRole`, `StatusVenda`)

## 7. Backfill / dados

Sem dados a migrar: sistema em desenvolvimento, sem vendas legadas faturadas (decisão da sessão de clarify). Não há default para os novos campos.