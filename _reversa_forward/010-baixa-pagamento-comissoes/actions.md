# Actions: Visibilidade e baixa de pagamento de comissões

> Identificador: `010-baixa-pagamento-comissoes`
> Data: `2026-10-09`
> Roadmap: `_reversa_forward/010-baixa-pagamento-comissoes/roadmap.md`

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de ações | 15 |
| Paralelizáveis (`[//]`) | 8 |
| Maior cadeia de dependência | 4 |

## Fase 1, Preparação

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T001 | Criar migration que adiciona `comissoes.data_pagamento TIMESTAMPTZ` | - | `[//]` | `supabase/migrations/20261009000001_comissoes_data_pagamento.sql` | 🟢 | `[X]` |
| T002 | Criar migration da RPC `registrar_pagamento_comissoes(uuid[], date)` transacional, SECURITY DEFINER, EXECUTE só `service_role` | - | `[//]` | `supabase/migrations/20261009000002_registrar_pagamento_comissoes.sql` | 🟢 | `[X]` |
| T003 | Criar `src/lib/comissoes-pagamento.ts` com tipos, rótulos de status e helpers de período/situação | - | `[//]` | `src/lib/comissoes-pagamento.ts` | 🟡 | `[X]` |
| T004 | Adicionar regra `/comissoes` (GESTOR/AUDITOR/FINANCEIRO) em `ROUTE_ROLES` e no `matcher` | - | `[//]` | `src/middleware.ts` | 🟢 | `[X]` |

## Fase 2, Testes

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T005 | Criar testes Deno da lib: agrupamento por vendedor, totais a receber/pagos, filtros de período/situação e detecção de comissão sem data de início | T003 | `[//]` | `tests/comissoes_pagamento.test.ts` | 🟡 | `[X]` |

## Fase 3, Núcleo

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T006 | Implementar na lib as funções puras: `agruparPorVendedor`, `totais`, `filtrar` e `semDataInicio` | T003 | - | `src/lib/comissoes-pagamento.ts` | 🟡 | `[X]` |
| T007 | Criar Edge Function `relatorio-repasse` (pdf-lib) que gera o PDF por período/vendedor com totais | T001 | `[//]` | `supabase/functions/relatorio-repasse/index.ts` | 🟢 | `[X]` |
| T008 | Criar server action `registrarPagamento` que valida o papel e chama a RPC `registrar_pagamento_comissoes` | T002 | `[//]` | `src/app/actions/comissoes.ts` | 🟢 | `[X]` |

## Fase 4, Integração

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T009 | Criar `src/app/comissoes/page.tsx`: seletor de vendedor, filtros, tabela por vendedor e cards de total | T004, T006 | - | `src/app/comissoes/page.tsx` | 🟡 | `[X]` |
| T010 | Adicionar item de menu "Comissões" para GESTOR/AUDITOR/FINANCEIRO | T004 | `[//]` | `src/components/DashboardLayout.tsx` | 🟢 | `[X]` |
| T011 | Integrar a baixa na página: seleção, confirmação e chamada da server action | T008, T009 | - | `src/app/comissoes/page.tsx` | 🟢 | `[X]` |
| T012 | Integrar geração e download do relatório PDF (chamada à Edge Function) | T007, T009 | - | `src/app/comissoes/page.tsx` | 🟡 | `[X]` |
| T013 | Implementar o alerta de fechamento (após o dia 22) e o fechamento prévio | T009 | - | `src/app/comissoes/page.tsx` | 🟡 | `[X]` |

## Fase 5, Polimento

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T014 | Tratar estados vazio, carregamento e erro, e destacar comissões sem data de início | T009 | - | `src/app/comissoes/page.tsx` | 🟡 | `[X]` |
| T015 | Documentar em comentário na página a regra do dia 22 e o caso "data não registrada" para comissões antigas | T013 | - | `src/app/comissoes/page.tsx` | 🟡 | `[X]` |

## Notas de execução

- Execução completa (15/15). `npx tsc --noEmit` sem erros e `deno test tests/comissoes_pagamento.test.ts` com 12/12 verdes.
- Âncora greenfield (`prd.md` + specs SDD); a extração de legado não produziu `architecture.md`/`domain.md`.
- Feature usa `pdf-lib` (Deno npm import) e RPC transacional, sem dependência nova em `package.json`.

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-10-09 | Versão inicial gerada por `/reversa-to-do` | reversa |
| 2026-10-09 | Execução completa por `/reversa-coding` (15/15 ações) | reversa |
