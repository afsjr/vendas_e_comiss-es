# Legacy Impact: Data de início do curso — fallback de exibição e obrigatoriedade no cadastro

> Identificador: `011-data-inicio-curso`
> Data: `2026-10-09`
> Âncora de contexto: **greenfield** (`_reversa_sdd/prd.md` + specs SDD). A extração de legado não produziu `architecture.md`/`domain.md`.
> Política de edição: `allowLegacyEdits: true`; `allowedPaths` liberou `src/app/**`, `src/components/**`, `src/lib/**`, `src/middleware.ts`, `supabase/**`, `tests/**`.

## 1. Arquivos afetados

| Arquivo afetado | Componente (spec de origem) | Tipo | Severidade | Justificativa |
|-----------------|------------------------------|------|------------|----------------|
| `supabase/migrations/20261009000003_backfill_vendas_data_inicio_curso.sql` | `sdd/painel-comissoes-por-vendedor.md` | delta-de-dados | MEDIUM | Backfill de `vendas.data_inicio_curso` nulo com a data da venda |
| `supabase/migrations/20261009000004_vendas_data_inicio_curso_check.sql` | `sdd/baixa-pagamento-comissoes.md` | regra-nova | MEDIUM | Constraint `CHECK NOT VALID` para novas inserções |
| `src/lib/comissoes-pagamento.ts` | `sdd/painel-comissoes-por-vendedor.md` | regra-nova | LOW | Helper puro `dataInicioExibicao` |
| `src/app/comissoes/page.tsx` | `sdd/painel-comissoes-por-vendedor.md` | regra-alterada | LOW | Coluna "Início do curso" com fallback + selo |
| `tests/comissoes_pagamento.test.ts` | `sdd/painel-comissoes-por-vendedor.md` | componente-alterado | LOW | Testes do helper de fallback |

## 2. Diff conceitual por componente

- **Dados (`vendas`):** o histórico nulo de `data_inicio_curso` é preenchido com a data da venda; novas inserções são protegidas por `CHECK NOT VALID`. A regra de liberação da comissão não muda.
- **Painel de comissões:** a coluna "Início do curso" passa a exibir a data da venda com o selo "via data da venda" quando não houver data real.
- **Validações de cadastro:** permanecem as já existentes (UI `vendas/novo`, `cadastro-unificado` e Edge Function `vendas`).

## 3. Preservadas

- Sem regras extraídas de `domain.md` (ausente). A regra de liberação por `data_inicio_curso` permanece intacta.

## 4. Modificadas

- `src/app/comissoes/page.tsx`: exibição da data de início (passou a usar fallback).
- `src/lib/comissoes-pagamento.ts`: novo helper (aditivo).

## 5. Observações

- Âncora greenfield, mas o repositório contém app pré-existente; arquivos de `src/` são marcados como alterados.
- O backfill é uma correção de dado; rollback do frontend não o desfaz.

## 6. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-10-09 | Versão inicial gerada por `/reversa-coding` | reversa |
