# Regression Watch: Data de início do curso — fallback de exibição e obrigatoriedade no cadastro

> Identificador: `011-data-inicio-curso`
> Data: `2026-10-09`
> Cenário: **greenfield** (âncora `prd.md` + specs SDD). Sem regras 🟢 extraídas de código; watch principal vazio.

## 1. Watch principal

| ID | Origem (arquivo, seção) | Regra esperada após mudança | Tipo de verificação | Sinal de violação |
|----|--------------------------|------------------------------|---------------------|-------------------|
| — | — | (sem regras 🟢 de legado para vigiar) | — | — |

## 2. Observações (sem peso de regressão)

- **RN-01:** painel exibe a data da venda (fallback) quando `data_inicio_curso` é nula, com selo.
- **RN-02:** cadastro de venda exige `data_inicio_curso` (UI + Edge Function).
- **RN-03:** backfill dos históricos nulos com a data da venda.
- **RN-04:** `vendas` protegida por `CHECK (data_inicio_curso IS NOT NULL) NOT VALID` para novas inserções.
- **D-06:** fallback é só de exibição; não altera a liberação da comissão.

## 3. Histórico de re-extrações

(vazio)

## 4. Arquivadas

(vazio)

## 5. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-10-09 | Versão inicial gerada por `/reversa-coding` | reversa |
