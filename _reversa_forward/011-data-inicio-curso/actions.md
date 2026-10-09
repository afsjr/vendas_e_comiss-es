# Actions: Data de início do curso — fallback de exibição e obrigatoriedade no cadastro

> Identificador: `011-data-inicio-curso`
> Data: `2026-10-09`
> Roadmap: `_reversa_forward/011-data-inicio-curso/roadmap.md`

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de ações | 7 |
| Paralelizáveis (`[//]`) | 4 |
| Maior cadeia de dependência | 3 |

## Fase 1, Preparação

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T001 | Criar migration de backfill de `vendas.data_inicio_curso` nulo com `criado_em::date` | - | `[//]` | `supabase/migrations/20261009000003_backfill_vendas_data_inicio_curso.sql` | 🟡 | `[X]` |
| T002 | Criar migration da constraint `CHECK (data_inicio_curso IS NOT NULL) NOT VALID` em `vendas` | - | `[//]` | `supabase/migrations/20261009000004_vendas_data_inicio_curso_check.sql` | 🟢 | `[X]` |
| T003 | Adicionar helper puro `dataInicioExibicao` à lib de comissões | - | `[//]` | `src/lib/comissoes-pagamento.ts` | 🟡 | `[X]` |

## Fase 2, Testes

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T004 | Adicionar testes Deno do helper: com data real, com fallback e com ambos nulos | T003 | `[//]` | `tests/comissoes_pagamento.test.ts` | 🟡 | `[X]` |

## Fase 3, Núcleo

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T005 | Usar `dataInicioExibicao` na coluna "Início do curso" e exibir o selo "via data da venda" no fallback | T003 | - | `src/app/comissoes/page.tsx` | 🟡 | `[X]` |

## Fase 4, Integração

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T006 | Confirmar que as validações de cadastro permanecem (UI `vendas/novo` e `cadastro-unificado` + Edge Function `vendas`) e ajustar rótulos se necessário | T005 | - | `src/app/comissoes/page.tsx` | 🟢 | `[X]` |

## Fase 5, Polimento

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T007 | Documentar em comentário a regra de fallback e o backfill na lib/página | T005 | - | `src/lib/comissoes-pagamento.ts` | 🟡 | `[X]` |

## Notas de execução

- Execução completa (7/7). `npx tsc --noEmit` sem erros e `deno test tests/comissoes_pagamento.test.ts` com 13/13 verdes.
- T006 sem mudança de código: as validações de cadastro (UI + Edge Function) já rejeitam ausência de `data_inicio_curso`.
- Migrações de banco (backfill e CHECK) ainda precisam de `supabase db push` (passo operacional).

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-10-09 | Versão inicial gerada por `/reversa-to-do` | reversa |
| 2026-10-09 | Execução completa por `/reversa-coding` (7/7 ações) | reversa |
