# Actions: Repasse previsto no dashboard do gestor

> Identificador: `007-dashboard-repasse-previsto`
> Data: `2026-09-28`
> Roadmap: `_reversa_forward/007-dashboard-repasse-previsto/roadmap.md`

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de ações | 6 |
| Paralelizáveis (`[//]`) | 0 |
| Maior cadeia de dependência | 4 |

> Todas as ações tocam o mesmo arquivo (`src/app/dashboard/page.tsx`), portanto são sequenciais.

## Fase 1, Preparação

n/a (sem setup, sem migração, sem dependência nova).

## Fase 2, Testes

n/a (frontend sem infraestrutura de testes; validação por `tsc` e cenários de onboarding).

## Fase 3, Núcleo

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T001 | Incluir `categoria` no select de `cursos` e adicionar os helpers `fatorRepasse(categoria)` (Técnico/Livre = 1,00; Graduação = 0,36; demais = null) e `repassePrevisto(venda)` | - | - | `src/app/dashboard/page.tsx` | 🟢 | `[X]` |
| T002 | Calcular o total de repasse previsto sobre as vendas em `APROVADAS` e expor em `stats` | T001 | - | `src/app/dashboard/page.tsx` | 🟢 | `[X]` |

## Fase 4, Integração

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T003 | Adicionar o card KPI "Repasse previsto" na grade da visão geral | T002 | - | `src/app/dashboard/page.tsx` | 🟢 | `[X]` |
| T004 | Adicionar a coluna "Repasse previsto" na tabela de Acompanhamento de Vendas | T002 | - | `src/app/dashboard/page.tsx` | 🟢 | `[X]` |
| T005 | Somar o repasse previsto por curso na agregação e exibir na tabela "Desempenho por Curso" | T002 | - | `src/app/dashboard/page.tsx` | 🟢 | `[X]` |

## Fase 5, Polimento

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T006 | Sinalizar o critério adotado (100% Técnico/Livre · 36% Graduação) junto ao KPI | T003 | - | `src/app/dashboard/page.tsx` | 🟡 | `[X]` |

## Notas de execução

<!-- Reservado para /reversa-coding. -->

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-28 | Versão inicial gerada por `/reversa-to-do` | reversa |
