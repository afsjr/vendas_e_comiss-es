# Interface: `auditoria-devolver` (alterada)

> Identificador: `003-kanban-pos-venda`
> Tipo: HTTP (Supabase Edge Function, Deno)
> Arquivo: `supabase/functions/auditoria-devolver/index.ts`

## Mudança em relação ao legado

Assegurado o mesmo ajuste da `auditoria-aprovar`: a devolução do Auditor passa a operar somente com venda em `PRIMEIRA_MENSALIDADE_PAGA` (RN-02), e não mais `PENDENTE_VALIDACAO`.

## Request

```
POST /functions/v1/auditoria-devolver
Authorization: Bearer <access_token>
{ "venda_id": "uuid", "motivo": "string" }
```

## Autorização

- Papel `AUDITOR` ou `GESTOR` (mantém o atual).

## Validações alteradas

| Condição atual (legado) | Condição nova |
|--------------------------|---------------|
| `venda.status !== 'PENDENTE_VALIDACAO'` → `INVALID_STATE` | `venda.status !== 'PRIMEIRA_MENSALIDADE_PAGA'` → `INVALID_STATE` |

## Comportamento (mantido)

1. Valida token/papel; `motivo` obrigatório com `>= 10` chars.
2. `UPDATE vendas SET status='DEVOLVIDA_AJUSTE'`. (Retorna à bancada do Vendedor — RN-05.)
3. `UPDATE comissoes SET status='BLOQUEADA_AUDITORIA'`.
4. `INSERT vendas_historico_status`.

## Erros

`401 UNAUTHORIZED`, `400 BAD_REQUEST`, `400 INVALID_STATE`, `500 INTERNAL_ERROR`.

## Nota de fronteira

A devolução Financeiro→Secretaria é responsabilidade da `postvenda-mover` (RN-04), não desta função.