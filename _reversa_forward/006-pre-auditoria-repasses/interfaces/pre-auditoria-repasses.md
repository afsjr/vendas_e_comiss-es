# Interface: `pre-auditoria-repasses` (Edge Function)

> Identificador: `006-pre-auditoria-repasses`
> Data: `2026-09-28`
> Tipo: HTTP (Supabase Edge Function)
> Autenticação: JWT Bearer do Supabase; papel exigido `GESTOR`
> Padrão de resposta: `{ success: boolean, data?: T, error?: { code, message } }` (ver `supabase/functions/_shared/types.ts`)

## Visão geral

Uma única função com duas ações, no padrão de `postvenda-mover` (matriz server-side; o cliente nunca envia status/role).

```
POST /functions/v1/pre-auditoria-repasses
Authorization: Bearer <jwt>
Content-Type: application/json
```

## Ação `importar`

Importa o CSV e concilia.

Request:

```json
{
  "acao": "importar",
  "storage_path": "<uuid>/relatorio-2026-08.csv",
  "competencia_pagamento": "Agosto/2026"
}
```

Response `200`:

```json
{
  "success": true,
  "data": {
    "relatorio_id": "<uuid>",
    "total_linhas": 301,
    "linhas_validas": 294,
    "resumo_alunos": 120,
    "resultados": { "APARECEU": 80, "NAO_APARECEU": 35, "AMBIGUO": 5 }
  }
}
```

Erros:

| Status | `code` | Quando |
|--------|--------|--------|
| 401 | `UNAUTHORIZED` | Token ausente/inválido ou papel ≠ `GESTOR` |
| 400 | `BAD_REQUEST` | `storage_path` ausente ou arquivo vazio |
| 404 | `NOT_FOUND` | Arquivo não encontrado no bucket |
| 409 | `CONFLICT` | `sha256_checksum` já importado |
| 422 | `UNPROCESSABLE` | Cabeçalho obrigatório ausente/layout inválido |
| 500 | `INTERNAL_ERROR` | Falha inesperada |

Idempotência: o `sha256_checksum` é `UNIQUE` em `relatorios_repasse`; reimportar o mesmo arquivo retorna `409`.

## Ação `confirmar`

Confirma itens pré-auditados em lote e libera a comissão.

Request:

```json
{
  "acao": "confirmar",
  "conciliacao_ids": ["<uuid>", "<uuid>"]
}
```

Response `200`:

```json
{
  "success": true,
  "data": { "confirmados": 2, "ignorados": 0 }
}
```

Regras server-side:

- Só confirma itens com `resultado = 'APARECEU'`; `NAO_APARECEU`/`AMBIGUO` são `ignorados`.
- Grava `confirmado_por`/`confirmado_em` em `conciliacoes_repasse`.
- Atualiza `comissoes.status = 'LIBERADA_PAGAMENTO'` e `data_liberacao` para as comissões vinculadas.
- Se `comissao_id` for nulo, o item não é confirmável (`ignorado`).

Erros:

| Status | `code` | Quando |
|--------|--------|--------|
| 401 | `UNAUTHORIZED` | Papel ≠ `GESTOR` |
| 400 | `BAD_REQUEST` | `conciliacao_ids` ausente/vazio |
| 404 | `NOT_FOUND` | Nenhum id corresponde a conciliações existentes |
| 500 | `INTERNAL_ERROR` | Falha inesperada |

Idempotência: reenviar os mesmos ids após confirmação não altera `comissoes` já `LIBERADA_PAGAMENTO` nem reescreve `confirmado_em` (retorna em `ignorados`).

## Fluxo do cliente

1. GESTOR sobe o CSV via `uploadFile('relatorios_repasse', path, file)`.
2. Chama a função com `acao: "importar"`.
3. Revisa a lista e chama `acao: "confirmar"` com os ids selecionados.

## Timeouts e limites

- Request body pequeno (apenas caminho/ids); o CSV vai pelo Storage.
- Processamento síncrono, alvo < 5 s para ~300 linhas (p95).
- Limite de upload do bucket: 5 MB.
