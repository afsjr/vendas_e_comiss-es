# Interface: `auditoria-aprovar` (alterada)

> Identificador: `003-kanban-pos-venda`
> Tipo: HTTP (Supabase Edge Function, Deno)
> Arquivo: `supabase/functions/auditoria-aprovar/index.ts`

## Mudança em relação ao legado

A função hoje só opera com venda `PENDENTE_VALIDACAO`. Com a feature 003, a auditoria final acontece **depois** do pós-venda: o requisito torna a condição para `status = 'PRIMEIRA_MENSALIDADE_PAGA'` (RN-02 — comissão só aprovada após 1ª mensalidade paga).

## Request

```
POST /functions/v1/auditoria-aprovar
Authorization: Bearer <access_token>
{ "venda_id": "uuid" }
```

## Autorização

- Papel `AUDITOR` ou `GESTOR` (mantém o atual).

## Validação alterada

| Condição atual (legado) | Condição nova |
|--------------------------|---------------|
| `venda.status !== 'PENDENTE_VALIDACAO'` → `INVALID_STATE` | `venda.status !== 'PRIMEIRA_MENSALIDADE_PAGA'` → `INVALID_STATE` |

## Comportamento (mantido)

1. Lê venda (service role) e valida estado.
2. Calcula comissão: `data_inicio_curso <= hoje` → `LIBERADA_PAGAMENTO`, senão `AGUARDANDO_INICIO_AULAS`.
3. `UPDATE vendas SET status='APROVADA'`; `UPDATE comissoes`; `INSERT vendas_historico_status`.

## Erros

Idênticos ao atual: `401 UNAUTHORIZED`, `400 BAD_REQUEST`, `400 INVALID_STATE`, `500 INTERNAL_ERROR`.

## Nota de fronteira

A devolução do Auditor (`auditoria-devolver`) ganha o mesmo novo estado de partida (`PRIMEIRA_MENSALIDADE_PAGA`) e mantém regra de `motivo >= 10 chars` e comissão `BLOQUEADA_AUDITORIA`. Ver `interfaces/auditoria-devolver.md`.