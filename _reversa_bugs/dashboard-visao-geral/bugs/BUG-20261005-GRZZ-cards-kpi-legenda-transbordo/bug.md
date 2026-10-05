---
schema_version: 1
id: BUG-20261005-GRZZ
display_number: 3
title: Cards de KPI e legenda por categoria transbordam em tela de 13 polegadas
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

relationships:
  - bug: BUG-20261005-CJOB
    type: related-to
    state: proposed
    evidence: []

traceability:
  specs:
    - "_reversa_sdd/sdd/dashboard-gerencial-relatorios.md#6. Requisitos Funcionais (RF-XX)"
    - "_reversa_sdd/addenda/009-dashboard-graficos-acesso.md#Impacto por artefato da extração"
  affected_code:
    - "src/app/dashboard/page.tsx"
    - "src/components/charts/CategoryChart.tsx"
  root_cause:
    state: confirmed
    hypothesis: "Cards de KPI sem min-w-0 com valor em text-3xl e legenda do CategoryChart em linha dentro de coluna estreita sem controle de largura"
    causal_path:
      - "grid xl:grid-cols-5 entrega ~173px uteis por card; text-3xl de valor monetario (~180px) ultrapassa a borda"
      - "CategoryChart com sm:flex-row deixa ~144px para a legenda, insuficiente para nome + valor, cortando a direita"
    evidence:
      - ref: "evidence/reproduction.md"
        observation: "calculo de largura: card 172,8px vs texto ~180px; legenda 144px vs conteudo ~222px"
    code_refs:
      - file: "src/app/dashboard/page.tsx"
        symbol: "cards de KPI"
      - file: "src/components/charts/CategoryChart.tsx"
        symbol: "CategoryChart"
  reproduction_tests:
    - "evidence/reproduction.md"
  regression_tests:
    - "tests/dashboard_metrics.test.ts"

spec_verdict: spec-correta
change_set:
  - id: CHG-001
    kind: code
    artifact: src/app/dashboard/page.tsx
    purpose: "cards de KPI com min-w-0 e valor em text-2xl 2xl:text-3xl break-words"
    diff: fix/CHG-001.diff
  - id: CHG-002
    kind: code
    artifact: src/components/charts/CategoryChart.tsx
    purpose: "empilhar sempre e conter a legenda (min-w-0/truncate/shrink-0)"
    diff: fix/CHG-002.diff
  - id: CHG-003
    kind: code
    artifact: src/components/charts/ChartFrame.tsx
    purpose: "min-w-0 no section para o grid nao forcar largura"
    diff: fix/CHG-003.diff

change_risk:
  classification: baixa
  reasons:
    - "Apenas layout (CSS/JSX); sem dados, contrato externo ou migracao"
    - "Ajuste cirurgico; nenhum comportamento de negocio alterado"

express: true

closure:
  policy: local-software
  satisfied: true
resolution_kind: fixed
---

# Cards de KPI e legenda por categoria transbordam em tela de 13 polegadas

## Summary

Na tela "Visão Geral" a 100% num MacBook Pro 13", os valores dos cards de KPI saem da borda do card (ex.: "R$ 4.858,89", "R$ 4.427,60") e a legenda do gráfico "Entradas por categoria" é cortada à direita. O enquadramento dos dados fica prejudicado.

## Expected Behavior

Todos os valores e rótulos permanecem contidos em seus cards e no quadro, em telas de 13" a 100%, mantendo a legibilidade. Segue RF-01/RF-05 e a preocupação de acessibilidade de `_reversa_sdd/sdd/dashboard-gerencial-relatorios.md#6. Requisitos Funcionais (RF-XX)` e do adendo `_reversa_sdd/addenda/009-dashboard-graficos-acesso.md`.

## Actual Behavior

1. Os 5 cards de KPI usam `grid xl:grid-cols-5` sem `min-w-0` e valor em `text-3xl`. Em largura de tela de 13" os cards ficam estreitos (~170px internos) e o valor monetário transborda a borda.
2. O `CategoryChart` usa layout em linha a partir de `sm` (donut + legenda) dentro de uma coluna estreita; a legenda fica sem largura e o valor "84% · R$ ..." é cortado.

## Steps to Reproduce

1. Autenticar com papel com visão geral (`GESTOR`, `AUDITOR` ou `FINANCEIRO`).
2. Abrir `/dashboard` em um MacBook Pro 13" com zoom 100%.
3. Observar os cards de KPI e o card "Entradas por categoria".

## Evidence

Imagem enviada no chat (captura da tela Visão Geral, 13" a 100%). Relato textual em `../../intake/relato-20261005-1230.md`.

## Suspected Area

- `src/app/dashboard/page.tsx`: grid dos 5 cards sem `min-w-0` e valor em `text-3xl`.
- `src/components/charts/CategoryChart.tsx`: layout `sm:flex-row` em coluna estreita e legenda sem controle de largura.

## Acceptance Criteria

- [ ] Nenhum valor de KPI sai da borda do card em telas de 13" a 100%.
- [ ] A legenda do gráfico de categoria permanece totalmente visível e legível.
- [ ] O layout continua harmônico em telas largas (sem regressão de proporção).

## Traceability

- Spec efetiva: `_reversa_sdd/sdd/dashboard-gerencial-relatorios.md#6. Requisitos Funcionais (RF-XX)`; `_reversa_sdd/addenda/009-dashboard-graficos-acesso.md#Impacto por artefato da extração`.
- Código afetado: `src/app/dashboard/page.tsx`, `src/components/charts/CategoryChart.tsx`.
- Relação proposta: `related-to BUG-20261005-CJOB` (mesmo tema de enquadramento no dashboard, componentes distintos).

## Resolution

- Causa raiz (`confirmed`): cards de KPI sem `min-w-0` com valor em `text-3xl` estouravam a borda; legenda do `CategoryChart` em linha dentro de coluna estreita era cortada.
- Veredito de spec: `spec-correta` (RNF-05 já exige dashboard otimizado para desktop >=1024px). Nenhuma alteração de spec.
- `resolution_kind`: `fixed`.
- Verificação: `deno test tests/dashboard_metrics.test.ts` -> `ok | 12 passed | 0 failed`; `npx tsc --noEmit` sem erros. Reprodução visual documentada em `evidence/reproduction.md`.

### Change set

| CHG | Tipo | Artefato | Propósito | Diff |
|-----|------|----------|-----------|------|
| CHG-001 | code | `src/app/dashboard/page.tsx` | Cards com `min-w-0` e valor responsivo | `fix/CHG-001.diff` |
| CHG-002 | code | `src/components/charts/CategoryChart.tsx` | Empilhar e conter a legenda | `fix/CHG-002.diff` |
| CHG-003 | code | `src/components/charts/ChartFrame.tsx` | `min-w-0` no `section` | `fix/CHG-003.diff` |

Sem item de spec (veredito `spec-correta`). Sem reparo de dados.

## Agent Notes

- Registrado pela rota expressa; severidade `medium` e prioridade `P2` propostas pelo agente.
- Proposta de taxonomia: adicionar ao campo `feature` o termo `dashboard-visao-geral` (hoje `unclassified`).
- Restrição: não refatorar amplamente; ajuste cirúrgico de layout nos dois arquivos.
