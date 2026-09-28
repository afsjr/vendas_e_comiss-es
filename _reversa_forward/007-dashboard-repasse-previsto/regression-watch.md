# Regression Watch — Repasse previsto no dashboard do gestor

> Identificador: `007-dashboard-repasse-previsto`
> Data: `2026-09-28`
> Cenário: greenfield (âncora: `prd.md` + specs em `_reversa_sdd/sdd/`). Sem regras 🟢 extraídas de código ainda.

## Watch principal

| ID | Origem (arquivo, seção) | Regra esperada após mudança | Tipo de verificação | Sinal de violação |
|----|--------------------------|------------------------------|---------------------|-------------------|
| — | — | Nenhum item com peso de regressão nesta rodada (greenfield) | — | — |

## Observações (sem peso de regressão)

RFs implementados; ganham peso quando uma futura extração `/reversa` os confirmar como 🟢.

| Item | Descrição | Onde verificar |
|------|-----------|----------------|
| RF-01 | KPI "Repasse previsto" total na Visão Geral | `src/app/dashboard/page.tsx` |
| RF-02 | Fator por categoria (Técnico/Livre 1,00; Graduação 0,36) | `FATOR_REPASSE` / `repassePrevisto` |
| RF-03 | Coluna "Repasse previsto" por venda | tabela de Acompanhamento de Vendas |
| RF-04 | Valor de repasse previsto por curso | tabela "Desempenho por Curso" |
| RF-05 | Rótulo do critério (100% Técnico/Livre · 36% Graduação) | card do KPI |

## Histórico de re-extrações

| Data | Extração | Resultado |
|------|----------|-----------|
| — | — | — |

## Arquivadas

| ID | Motivo | Data |
|----|--------|------|
| — | — | — |
