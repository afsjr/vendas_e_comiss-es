---
schema_version: 1
id: BUG-20261005-CJOB
display_number: 2
title: Comparativo de vendedores não exibe todos os vendedores e transborda os rótulos
status: resolved
phase: delivering
severity: medium
priority: P2
created: 2026-10-05
updated: 2026-10-05

origin:
  type: manual-report
  external_ref: null

area: dashboard-gerencial-relatorios
module: frontend
feature: unclassified
labels: []

visibility: normal
security_suspected: false

reproduction:
  classification: deterministic
  rate: "10/10"
  suspected_triggers: []

blocking: []

relationships: []

traceability:
  specs:
    - "_reversa_sdd/sdd/dashboard-gerencial-relatorios.md#6. Requisitos Funcionais (RF-XX)"
    - "_reversa_sdd/addenda/009-dashboard-graficos-acesso.md#Impacto por artefato da extração"
  affected_code:
    - "src/components/charts/ComparisonChart.tsx"
    - "src/app/dashboard/page.tsx"
    - "src/lib/dashboard-metrics.ts"
  root_cause:
    state: confirmed
    hypothesis: "O ComparisonChart estica um viewBox de largura minima fixa a 100% do container, ampliando o fontSize; e o comparativoPorVendedor so inclui vendedores que tem venda no periodo, omitindo os demais"
    causal_path:
      - "viewBox de 360x270 com w-full em container largo escala fontes ~3.3x (12px -> 40px), transbordando os rotulos"
      - "o mapa do comparativo e semeado apenas pelas vendas do periodo, sem semear a lista completa de vendedores"
    evidence:
      - ref: "evidence/reproduction.md"
        observation: "escala 3.33 com fontSize 40px; lista com 1 vendedor quando apenas u1 vendeu"
    code_refs:
      - file: "src/components/charts/ComparisonChart.tsx"
        symbol: "ComparisonChart"
      - file: "src/lib/dashboard-metrics.ts"
        symbol: "comparativoPorVendedor"
  reproduction_tests:
    - "tests/dashboard_metrics.test.ts::reprodução BUG-20261005-CJOB: vendedor sem venda no período some do comparativo"
  regression_tests:
    - "tests/dashboard_metrics.test.ts::regressão BUG-20261005-CJOB: sem lista de vendedores, mantém apenas quem vendeu"

spec_verdict: spec-correta
change_set:
  - id: CHG-001
    kind: code
    artifact: src/lib/dashboard-metrics.ts
    purpose: "comparativoPorVendedor semeia todos os vendedores, inclusive sem venda no período"
    diff: fix/CHG-001.diff
  - id: CHG-002
    kind: code
    artifact: src/app/dashboard/page.tsx
    purpose: "buscar role em perfis e passar a lista de VENDEDOR/SECRETARIA ao comparativo"
    diff: fix/CHG-002.diff
  - id: CHG-003
    kind: code
    artifact: src/components/charts/ComparisonChart.tsx
    purpose: "largura explícita com maxWidth 100% (sem ampliar) e rótulos contidos"
    diff: fix/CHG-003.diff
  - id: CHG-004
    kind: test
    artifact: tests/dashboard_metrics.test.ts
    purpose: "teste de reprodução e de regressão do BUG-20261005-CJOB"
    diff: fix/CHG-004.diff

change_risk:
  classification: baixa
  reasons:
    - "Apenas frontend e agregação pura; sem migração, contrato externo ou dados"
    - "Mudança cirúrgica no comparativo; comportamento anterior preservado por teste de regressão"

express: true

closure:
  policy: local-software
  satisfied: true
resolution_kind: fixed
---

# Comparativo de vendedores não exibe todos os vendedores e transborda os rótulos

## Summary

No gráfico "Comparativo por vendedor" da Visão Geral (`/dashboard`), nem todos os vendedores são exibidos e os rótulos usam fonte grande que transborda o quadro, prejudicando a leitura dos dados.

## Expected Behavior

O comparativo deve listar todos os vendedores relevantes do recorte e manter os rótulos contidos no quadro, legíveis. Requisito funcional RF-05 (comparativo lado a lado por vendedor) definido em `_reversa_forward/009-dashboard-graficos-acesso/requirements.md`, com a leitura de dashboard por papel registrada na spec `_reversa_sdd/sdd/dashboard-gerencial-relatorios.md#6. Requisitos Funcionais (RF-XX)` e no adendo `_reversa_sdd/addenda/009-dashboard-graficos-acesso.md`.

## Actual Behavior

1. Apenas parte dos vendedores aparece no gráfico. Os vendedores sem venda no período ou sem `criado_por` resolvido não são plotados, e a escala do SVG (`viewBox` com largura mínima fixa esticada a 100%) nem sempre acomoda todos.
2. Os tamanhos de fonte definidos em unidades do `viewBox` (12 e 11) são ampliados junto com o SVG quando a largura mínima é esticada, fazendo os textos saírem dos quadros.

## Steps to Reproduce

1. Autenticar com um papel com visão geral (`GESTOR`, `AUDITOR` ou `FINANCEIRO`).
2. Abrir `/dashboard` com o período padrão (mês atual).
3. Observar o card "Comparativo por vendedor".
4. Comparar a lista de vendedores exibida com os vendedores existentes e verificar o transbordo dos rótulos.

## Evidence

Sem anexos. Descrição textual no intake: `../../intake/relato-20261005-0001.md`.

## Suspected Area

- `src/components/charts/ComparisonChart.tsx`: cálculo de largura mínima do `viewBox`, uso de `w-full` com `preserveAspectRatio` padrão e `fontSize` em unidades do viewBox.
- `src/app/dashboard/page.tsx`: recorte de dados passado ao gráfico (posse do vendedor, período).
- `src/lib/dashboard-metrics.ts`: `comparativoPorVendedor` filtra vendedores sem venda no período.

## Acceptance Criteria

- [ ] Todos os vendedores do recorte relevantes aparecem no comparativo (ou o gráfico indica explicitamente que um vendedor não teve vendas no período).
- [ ] Nenhum rótulo transborda o quadro; textos mantêm tamanho legível e contido em telas estreitas e largas.
- [ ] A leitura "lado a lado" (Entradas x Repasse) permanece clara.

## Traceability

- Spec efetiva: `_reversa_sdd/sdd/dashboard-gerencial-relatorios.md#6. Requisitos Funcionais (RF-XX)`; `_reversa_sdd/addenda/009-dashboard-graficos-acesso.md#Impacto por artefato da extração`.
- Código afetado: `src/components/charts/ComparisonChart.tsx`, `src/app/dashboard/page.tsx`, `src/lib/dashboard-metrics.ts`.
- Testes relacionados: `tests/dashboard_metrics.test.ts`.

## Resolution

- Causa raiz (`confirmed`): o comparativo só semeava o mapa pelas vendas do período (omitindo vendedor sem venda) e o `ComparisonChart` esticava um `viewBox` de largura mínima fixa a 100% do contêiner, ampliando o `fontSize` (~3.3x, 12px para 40px).
- Veredito de spec: `spec-correta` (RF-05 já definia o comparativo por vendedor; o código divergiu). Nenhuma alteração de spec.
- `resolution_kind`: `fixed`.
- Prova vermelho → verde:
  - Vermelho: `deno test --no-check tests/dashboard_metrics.test.ts` → `FAILED | 11 passed | 1 failed` (u3 ausente do comparativo).
  - Verde: `deno test tests/dashboard_metrics.test.ts` → `ok | 12 passed | 0 failed`; `npx tsc --noEmit` sem erros.

### Change set

| CHG | Tipo | Artefato | Propósito | Diff |
|-----|------|----------|-----------|------|
| CHG-001 | code | `src/lib/dashboard-metrics.ts` | Semear todos os vendedores no comparativo | `fix/CHG-001.diff` |
| CHG-002 | code | `src/app/dashboard/page.tsx` | Buscar `role` e passar vendedores | `fix/CHG-002.diff` |
| CHG-003 | code | `src/components/charts/ComparisonChart.tsx` | Largura explícita sem ampliar e rótulos contidos | `fix/CHG-003.diff` |
| CHG-004 | test | `tests/dashboard_metrics.test.ts` | Reprodução e regressão | `fix/CHG-004.diff` |

Diffs salvos em `fix/`. Sem item de spec (veredito `spec-correta`). Sem reparo de dados.

## Agent Notes

- Registrado pela rota expressa; severidade `medium` e prioridade `P2` propostas pelo agente.
- Proposta de taxonomia: adicionar ao campo `feature` o termo `dashboard-visao-geral` (hoje `unclassified`).
- Sem suspeita de segurança.
- Não corrigir aqui; a correção é do `/reversa-debugger-fix`.
