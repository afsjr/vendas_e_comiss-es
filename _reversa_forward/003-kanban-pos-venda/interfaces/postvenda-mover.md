# Interface: `postvenda-mover` (nova Edge Function)

> Identificador: `003-kanban-pos-venda`
> Tipo: HTTP (Supabase Edge Function, Deno)
> Arquivo previsto: `supabase/functions/postvenda-mover/index.ts`
> Padrão de referência: `supabase/functions/auditoria-aprovar/index.ts`

## Propósito

Executa as transições de status da fila de pós-venda com **trava obrigatória server-side** (RN-03), devolução (RN-04) e cancelamento/devolução ao vendedor (RN-05), registrando sempre auditoria em `vendas_historico_status` (RF-05) e validando o papel do JWT (RF-04).

## Autenticação e autorização

- `Authorization: Bearer <access_token>` obrigatório.
- Papel extraído de `app_metadata.app_role` pelo padrão `getUserAndRole`.
- Papéis permitidos por ação (matriz abaixo); qualquer outro → `401 UNAUTHORIZED`.

## Matriz de transições (máquina de estados)

| Papel | status_atual → status_novo | Pré-condição (trava) | Campo exigido |
|-------|---------------------------|----------------------|---------------|
| SECRETARIA | `PENDENTE_VALIDACAO` → `AGUARDANDO_FINANCEIRO` | arquivo no bucket `contratos_pdf` | `contrato_storage_path` |
| SECRETARIA | `PENDENTE_VALIDACAO` → `DEVOLVIDA_AJUSTE` | motivo | `motivo` (≥ 10 chars) |
| SECRETARIA | `PENDENTE_VALIDACAO` → `CANCELADA` | motivo | `motivo` |
| FINANCEIRO | `AGUARDANDO_FINANCEIRO` → `AGUARDANDO_PAGAMENTO_1M` | referência do boleto emitido | `boleto_referencia` |
| FINANCEIRO | `AGUARDANDO_FINANCEIRO` → `PENDENTE_VALIDACAO` (devolução) | motivo | `motivo` (≥ 10 chars) |
| FINANCEIRO | `AGUARDANDO_PAGAMENTO_1M` → `PRIMEIRA_MENSALIDADE_PAGA` | arquivo no bucket `comprovantes` | `comprovante_pgto_1m_path` |

Transições fora da matriz → `400 INVALID_TRANSITION`.

## Request

```
POST /functions/v1/postvenda-mover
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "venda_id": "uuid",
  "acao": "mover_para_financeiro | devolver_vendedor | cancelar | emitir_boleto | devolver_secretaria | confirmar_pgto_1m",
  "motivo": "string | null",
  "contrato_storage_path": "string | null",
  "boleto_referencia": "string | null",
  "comprovante_pgto_1m_path": "string | null"
}
```

## Response

Sucesso (`200`):
```json
{ "success": true, "data": { "venda_id": "uuid", "status_novo": "AGUARDANDO_FINANCEIRO" } }
```

Erros (`success: false`), seguindo `ApiResponse<T>` do `_shared/types.ts`:

| HTTP | code | Quando |
|------|------|--------|
| 401 | `UNAUTHORIZED` | sem token, token inválido ou papel sem permissão para a ação |
| 400 | `BAD_REQUEST` | `venda_id` ausente ou payload inválido |
| 400 | `INVALID_STATE` | venda inexistente ou status atual não bate com a transição |
| 400 | `INVALID_TRANSITION` | combinação papel→transição não prevista |
| 400 | `TRABVA_BLOQUEADA` | pré-condição da trava ausente (ex. sem `contrato_storage_path`) |
| 500 | `INTERNAL_ERROR` | falha não tratada |

## Comportamento (transação)

1. Lê a venda com service role (`SERVICE_ROLE_KEY`); valida `status` atual.
2. Valida a combinação papel→transição e a trava (campos obrigatórios; para paths, confirma existência no bucket via `createSignedUrl` ou `list`).
3. `UPDATE vendas SET status = <novo>, atualizado_em = now(), <coluna_trava> = <campo>` onde apropriado.
4. Efeito colateral:
   - `CANCELADA` → `UPDATE comissoes SET status = 'ESTORNADA'` (se comissão existir) — evita pagamento de comissão de venda cancelada.
5. `INSERT vendas_historico_status (venda_id, status_anterior, status_novo, motivo, mudado_por = user.id)` — RF-05.
6. Responde `{ success: true }`.

## Idempotência

- Reenvio da mesma transição com mesmo `venda_id` no mesmo status → `INVALID_STATE` (não duplica histórico). Não há idempotência por chave externa; o `UPDATE` é condicional ao status atual.

## Timeouts

- Supabase Edge Function default (nenhum timeout custom). A validação de bucket usa chamada ao Storage; em caso de erro, `500 INTERNAL_ERROR` com mensagem descritiva.

## Notas de segurança

- Nunca confiar em `status` enviado pelo cliente — a matriz é servidor.
- `mudado_por` vem do JWT (`user.id`), nunca do payload.
- Não logar conteúdo dos arquivos nem do `boleto_referencia` em texto (apenas ids/caminhos no `_shared/log.ts` se usado).