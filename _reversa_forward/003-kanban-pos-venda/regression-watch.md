# Regression Watch — Kanban de Pós-Venda

> Feature greenfield: não há regras 🟢 extraídas de código legado; o watch
> principal é gerado vazio e ganha peso quando uma futura `/reversa` confirmar
> os RFs desta feature como 🟢.
> Identificador: `003-kanban-pos-venda`
> Data: `2026-09-09`

## 1. Watch (peso de regressão)

| ID | Origem (arquivo, seção) | Regra esperada após mudança | Tipo de verificação | Sinal de violação |

_Em branco — nada extraído de código pré-existente ainda._

## 2. Observações (sem peso de regressão)

RFs implementados nesta feature (da spec `003-kanban-pos-venda`, `requirements.md`):

- RF-01 — Fila Kanban Secretaria com upload de contrato (`postvenda-mover` + página).
- RF-02 — Fila Kanban Financeiro e emissão de boleto (status `AGUARDANDO_PAGAMENTO_1M`).
- RF-03 — Confirmação de pagamento da 1ª mensalidade → `PRIMEIRA_MENSALIDADE_PAGA`.
- RF-04 — RLS estrito por papel (FINANCEIRO/SECRETARIA) — migrations 002.
- RF-05 — Histórico de ações em `vendas_historico_status` (todas as transições).
- RF-06 — Devolução Financeiro→Secretaria com motivo (RN-04).
- RF-07 — Cancelar / devolver ao Vendedor pela Secretaria, com motivo (RN-05).
- RF-08 — Destravamento de comissão para auditoria após 1ª mensalidade paga (gate + ancoragem aprovar/devolver).

## 3. Histórico de re-extrações

_Em branco — preenchido quando `/reversa` rodar novamente._

## 4. Arquivadas

_Em branco._