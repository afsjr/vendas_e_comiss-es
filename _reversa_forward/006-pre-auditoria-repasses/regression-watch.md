# Regression Watch — Pré-auditoria de repasses de Graduação

> Identificador: `006-pre-auditoria-repasses`
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
| RF-01/RF-02 | Upload de CSV e parser robusto (BOM, Latin-1, `;`, cabeçalho repetido, valores pt-BR) | `supabase/functions/_shared/repasse_parser.ts`, `tests/pre_auditoria_repasses.test.ts` |
| RF-03/RF-04 | Conciliação por CPF; resultado `APARECEU`/`NAO_APARECEU` com competência da parcela 1 | `supabase/functions/pre-auditoria-repasses/index.ts` |
| RF-05 | Confirmação em lote move a comissão para `LIBERADA_PAGAMENTO` | `supabase/functions/pre-auditoria-repasses/index.ts#confirmar` |
| RF-06 | Fallback: `/auditoria` permanece intacta | `src/app/auditoria/page.tsx` (sem alteração) |
| RF-07 | Importação/resultados append-only com `sha256` | `supabase/migrations/20260928000000_pre_auditoria_repasses.sql` |
| RF-08 | Acesso restrito a `GESTOR` (server-side + RLS) | `index.ts` (validação de papel), policies da migration |
| RF-10 | CPF com múltiplas vendas => `AMBIGUO` | `supabase/functions/_shared/repasse_parser.ts#resultadoConciliacao` |

## Histórico de re-extrações

| Data | Extração | Resultado |
|------|----------|-----------|
| — | — | — |

## Arquivadas

| ID | Motivo | Data |
|----|--------|------|
| — | — | — |
