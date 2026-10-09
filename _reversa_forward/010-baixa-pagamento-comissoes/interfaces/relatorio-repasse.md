# Interface: `relatorio-repasse` (Edge Function HTTP)

> Identificador: `010-baixa-pagamento-comissoes`
> Data: `2026-10-09`
> Tipo: HTTP (Supabase Edge Function), no padrão de `gerar-contrato`

## 1. Objetivo

Gerar o PDF de repasse por período e vendedor, para conferência e uso no pagamento bancário manual.

## 2. Requisição

`POST /functions/v1/relatorio-repasse`

Headers:
- `Authorization: Bearer <access_token>` (obrigatório)
- `Content-Type: application/json`

Corpo:

```json
{
  "periodo": { "inicio": "2026-10-01", "fim": "2026-10-31" },
  "vendedor_id": "uuid-ou-null",
  "situacao": "PAGA"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `periodo.inicio` | date | sim | Início do recorte |
| `periodo.fim` | date | sim | Fim do recorte |
| `vendedor_id` | uuid \| null | não | Vendedor específico; nulo = todos |
| `situacao` | `"PAGA"` \| `"LIBERADA_PAGAMENTO"` \| `"TODAS"` | não | Filtro de situação; padrão `"PAGA"` |

## 3. Resposta

- **200:** `application/pdf` (bytes do arquivo). `Content-Disposition: attachment; filename="repasse-<inicio>-<fim>.pdf"`.
- **400:** período inválido (fim antes do início) — JSON `{ "error": "..." }`.
- **401/403:** não autenticado ou papel não autorizado — JSON `{ "error": "..." }`.
- **404:** recorte sem comissões — JSON `{ "error": "Nenhuma comissão no recorte" }`.

O PDF contém: cabeçalho (período, data de emissão, autor), linhas com vendedor, curso, valor e data de referência, totais por vendedor e total geral.

## 4. Autorização

- Aceito apenas para `GESTOR`, `AUDITOR` e `FINANCEIRO` (validado pelo `app_metadata.app_role` do token).
- Usa `service_role` no servidor para ler os dados; não expõe CPF nem dados de aluno.

## 5. Idempotência

Leitura pura: reemitir o mesmo recorte produz o mesmo conteúdo para os mesmos dados. O PDF não é persistido (decisão do clarify: gerar sob demanda).

## 6. Erros e timeout

| Condição | Comportamento |
|----------|---------------|
| Falha na geração do PDF | 500 com mensagem genérica; nova tentativa permitida |
| Recorte muito grande | Processar em blocos; responder 200 com aviso se exceder o limite de tamanho |
| Timeout | Retornar erro claro; cliente oferece tentar novamente |

## 7. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-10-09 | Versão inicial gerada por `/reversa-plan` | reversa |
