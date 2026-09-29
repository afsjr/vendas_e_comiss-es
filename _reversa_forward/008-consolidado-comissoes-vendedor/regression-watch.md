# Regression Watch — Consolidado de comissões por vendedor para pagamento

> Identificador: `008-consolidado-comissoes-vendedor`
> Data: `2026-09-29`
> Cenário: greenfield (âncora: `prd.md` + specs em `_reversa_sdd/sdd/`). Sem regras 🟢 extraídas de código ainda.

## Watch principal

| ID | Origem (arquivo, seção) | Regra esperada após mudança | Tipo de verificação | Sinal de violação |
|----|--------------------------|------------------------------|---------------------|-------------------|
| — | — | Nenhum item com peso de regressão nesta rodada (greenfield) | — | — |

## Observações (sem peso de regressão)

RFs implementados; ganham peso quando uma futura extração `/reversa` os confirmar como 🟢.

| Item | Descrição | Onde verificar |
|------|-----------|----------------|
| RF-01/RF-02 | Consolidado por vendedor com totais A pagar/Previsto/Pago/Estornada | `src/lib/consolidado.ts`, `src/app/consolidado/page.tsx` |
| RF-03 | Filtro por `data_liberacao` | `dentroDoPeriodo` / inputs de período |
| RF-04 | Detalhamento por vendedor (aluno, curso, valor, situação, liberação) | drill-down na página |
| RF-05 | Export CSV | `buildConsolidadoCsv` + botão |
| RF-06 | Acesso a GESTOR/FINANCEIRO | guard da página + RLS (`perfis` com FINANCEIRO) |

## Histórico de re-extrações

| Data | Extração | Resultado |
|------|----------|-----------|
| — | — | — |

## Arquivadas

| ID | Motivo | Data |
|----|--------|------|
| — | — | — |
