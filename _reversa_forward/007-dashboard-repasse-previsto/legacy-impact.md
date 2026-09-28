# Legacy Impact — Repasse previsto no dashboard do gestor

> Identificador: `007-dashboard-repasse-previsto`
> Data: `2026-09-28`
> Cenário: **greenfield** — sem legado pré-existente extraído de código. Âncora: `prd.md` + specs em `_reversa_sdd/sdd/`.
> Política de edição do legado: `allowLegacyEdits: true`; caminho liberado usado: `src/app/**`.

## Arquivos afetados

| Arquivo afetado | Componente (spec SDD) | Tipo | Severidade | Justificativa |
|-----------------|-----------------------|------|------------|---------------|
| `src/app/dashboard/page.tsx` | `dashboard-gerencial-relatorios` | regra-alterada | MEDIUM | Novo KPI "Repasse previsto", coluna por venda e valor por curso (fatores 100% Técnico/Livre e 36% Graduação sobre `valor_entrada`) |

## Diff conceitual por componente

- **`dashboard-gerencial-relatorios`**: a Visão Geral passa a exibir o repasse previsto ao polo por venda e agregado, derivado de `vendas.valor_entrada` × fator da `categoria` do curso. Pós-Graduação fica fora. A métrica é informativa e não altera status de venda/comissão.

## Preservadas

> Feature greenfield, sem legado pré-existente extraído de código. Nada a listar.

## Modificadas

> Sem regras 🟢 extraídas de código. O delta recai sobre a spec `_reversa_sdd/sdd/dashboard-gerencial-relatorios.md` (nova métrica), não sobre código anterior.
