# Interface: `registrar_pagamento_comissoes` (RPC Postgres)

> Identificador: `010-baixa-pagamento-comissoes`
> Data: `2026-10-09`
> Tipo: RPC Postgres chamada por `service_role`

## 1. Objetivo

Registrar a baixa de pagamento de comissões selecionadas, de forma transacional e idempotente.

## 2. Assinatura

```sql
registrar_pagamento_comissoes(p_ids uuid[], p_data_pagamento date) RETURNS jsonb
```

## 3. Entrada

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `p_ids` | `uuid[]` | sim | Ids das comissões a baixar |
| `p_data_pagamento` | `date` | não | Data de pagamento; se nula, usa a data corrente |

## 4. Comportamento

1. Bloqueia (`FOR UPDATE`) as comissões cujos ids estão em `p_ids` e cujo `status = 'LIBERADA_PAGAMENTO'`.
2. Para cada comissão elegível:
   - Atualiza `status = 'PAGA'` e `data_pagamento = p_data_pagamento`.
   - Insere lançamento em `livro_caixa_lancamentos` (`tipo = 'CRÉDITO'`, `valor_credito = valor_comissao`, `descricao = 'Pagamento comissão <mes>'`), no mesmo padrão de `processar_fechamento_mensal`.
3. Ignora ids cujo status não seja `LIBERADA_PAGAMENTO` (conta como `ignoradas`).
4. Tudo em uma única transação: falha em qualquer passo reverte o conjunto.

## 5. Saída (jsonb)

```json
{ "pagas": 3, "ignoradas": 1, "total": 1234.56 }
```

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `pagas` | int | Quantidade de comissões efetivamente baixadas |
| `ignoradas` | int | Quantidade de ids não elegíveis |
| `total` | numeric | Soma dos valores baixados |

## 6. Erros

| Condição | Comportamento |
|----------|---------------|
| `p_ids` vazio/nulo | Retorna `{ "pagas": 0, "ignoradas": 0, "total": 0 }` sem erro |
| Falha de gravação | Transação revertida; erro propagado; nada alterado |
| Chamador sem permissão | `permission denied` (EXECUTE restrito a `service_role`) |

## 7. Idempotência

Baixa repetida dos mesmos ids não altera comissões já `PAGA` e não duplica lançamentos; elas entram em `ignoradas`.

## 8. Segurança

- `SECURITY DEFINER`, `SET search_path = public`.
- `REVOKE ALL ON FUNCTION ... FROM public, anon, authenticated` e `GRANT EXECUTE ... TO service_role`.
- Invocada por Edge Function/server action com a chave de serviço, após autorização de papel.

## 9. Timeouts e limites

- Escopo alvo: até 200 comissões por chamada.
- Timeout de execução: herdado do banco; recomendável < 3 s.

## 10. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-10-09 | Versão inicial gerada por `/reversa-plan` | reversa |
