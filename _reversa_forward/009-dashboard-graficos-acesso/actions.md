# Actions: Dashboard visual — funil por etapa, volume acumulado e acesso por papel

> Identificador: `009-dashboard-graficos-acesso`
> Data: `2026-10-05`
> Roadmap: `_reversa_forward/009-dashboard-graficos-acesso/roadmap.md`

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de ações | 10 |
| Paralelizáveis (`[//]`) | 6 |
| Maior cadeia de dependência | 4 |

## Fase 1, Preparação

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T001 | Criar `src/lib/dashboard-metrics.ts` com tipos, constantes (fator de repasse, ordem e rótulos das etapas) e helper de período (mês atual, mês anterior, intervalo) | - | `[//]` | `src/lib/dashboard-metrics.ts` | 🟢 | `[X]` |
| T002 | Criar `src/components/charts/ChartFrame.tsx` (invólucro comum: título, legenda, estado vazio e `aria`) | - | `[//]` | `src/components/charts/ChartFrame.tsx` | 🟡 | `[X]` |

## Fase 2, Testes

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T003 | Criar testes Deno da lib pura: funil por etapa, volume acumulado, repasse por categoria, distribuição por categoria, comparativo por vendedor e filtro de período | T001 | `[//]` | `tests/dashboard_metrics.test.ts` | 🟢 | `[X]` |

## Fase 3, Núcleo

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T004 | Implementar na lib as funções de agregação puras: `agruparFunil`, `volumeAcumulado`, `repassePrevisto`, `agruparPorCategoria`, `comparativoPorVendedor` | T001 | - | `src/lib/dashboard-metrics.ts` | 🟢 | `[X]` |
| T005 | Criar `FunnelChart.tsx` (SVG de funil por etapa, com contagem e valor, rótulos e alternativa textual) | T002 | `[//]` | `src/components/charts/FunnelChart.tsx` | 🟢 | `[X]` |
| T006 | Criar `ComparisonChart.tsx` (SVG de barras **lado a lado** por vendedor, com rótulos e alternativa textual) | T002 | `[//]` | `src/components/charts/ComparisonChart.tsx` | 🟡 | `[X]` |
| T007 | Criar `CategoryChart.tsx` (SVG de distribuição por categoria de curso, com legenda e percentuais) | T002 | `[//]` | `src/components/charts/CategoryChart.tsx` | 🟡 | `[X]` |

## Fase 4, Integração

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T008 | Reescrever `src/app/dashboard/page.tsx`: remover a guarda exclusiva de `GESTOR`, aplicar o recorte por papel (`VENDEDOR`/`SECRETARIA` só o próprio; `GESTOR`/`AUDITOR`/`FINANCEIRO` próprio × geral), filtro de período e montagem dos cards e gráficos | T004, T005, T006, T007 | - | `src/app/dashboard/page.tsx` | 🟡 | `[X]` |
| T009 | Liberar o item de menu "Visão Geral" (`/dashboard`) para todos os papéis | - | `[//]` | `src/components/DashboardLayout.tsx` | 🟢 | `[X]` |

## Fase 5, Polimento

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T010 | Tratar estados de carregamento, vazio e erro de consulta no dashboard, e documentar em comentário que o recorte de `SECRETARIA` é filtro de consulta (RLS amplo) | T008 | - | `src/app/dashboard/page.tsx` | 🟡 | `[X]` |

## Notas de execução

- Execução completa (10/10). `npx tsc --noEmit` sem erros e `deno test tests/dashboard_metrics.test.ts` com 10/10 verdes.
- Gráficos implementados em SVG próprio, sem dependência nova (decisão D-01), conforme `allowedPaths`.
- Recorte de `SECRETARIA` no dashboard é filtro de consulta (RLS amplo por necessidade do pós-venda), documentado em comentário em `src/app/dashboard/page.tsx`.

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-10-05 | Versão inicial gerada por `/reversa-to-do` | reversa |
| 2026-10-05 | Execução completa por `/reversa-coding` (10/10 ações) | reversa |
