# Interface: Edge Function `vendas`

> Identificador: `004-cadastro-unificado-aluno-venda`
> Data: `2026-09-10`
> Status: **Sem mudança** — a Edge Function existente já aceita o payload necessário

## Resumo

A Edge Function `vendas` (`supabase/functions/vendas/index.ts`) **não precisa de alterações**. O frontend unificado cria o aluno primeiro (via Supabase client) e depois chama esta função com o `aluno_id` resultante, exatamente como o formulário `/vendas/novo` já faz hoje.

## Contrato atual (já implementado)

### Request

```
POST /functions/v1/vendas
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "aluno_id": "uuid",
  "curso_id": "uuid",
  "valor_entrada": 150.00,
  "data_inicio_curso": "2026-10-01",
  "comprovante_storage_path": "uuid/file.jpg"
}
```

### Response (sucesso)

```json
{
  "success": true,
  "data": {
    "id": "uuid-venda",
    "status": "PENDENTE_VALIDACAO",
    "criado_em": "2026-09-10T..."
  }
}
```
Status: `201 Created`

### Response (erro)

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST | CONFLICT | NOT_FOUND | UNAUTHORIZED | INTERNAL_ERROR",
    "message": "Descrição do erro"
  }
}
```

### Validações server-side

| Campo | Validação | Erro |
|-------|-----------|------|
| `aluno_id` | Obrigatório, deve existir na tabela `alunos` | 400 / 404 |
| `curso_id` | Obrigatório, deve existir na tabela `cursos` | 400 / 404 |
| `valor_entrada` | Obrigatório, > 0 | 400 |
| `data_inicio_curso` | Obrigatório, formato ISO date | 400 |
| `comprovante_storage_path` | Obrigatório, arquivo deve existir no bucket | 400 / 404 |
| SHA-256 do arquivo | Não pode duplicar hash existente em `evidencias_vendas` | 409 |
| Role do usuário | Deve ser VENDEDOR ou SECRETARIA | 401 |

### Efeitos colaterais

1. INSERT em `vendas` (status `PENDENTE_VALIDACAO`)
2. INSERT em `evidencias_vendas` (com SHA-256)
3. INSERT em `comissoes` (status `AGUARDANDO_INICIO_AULAS`, valor = `valor_comissao_fixo` do curso)

### Idempotência

Não idempotente. Submissões duplicadas com o mesmo arquivo serão bloqueadas pelo constraint UNIQUE de `sha256_checksum` (retorna 409).

## Fluxo no cadastro unificado

```
Frontend (/cadastro)
  │
  ├─ 1. Query: SELECT id, nome FROM alunos WHERE cpf = $1
  │     ├─ Não existe → INSERT aluno → obtem aluno_id
  │     └─ Existe → usa aluno_id existente (read-only)
  │
  ├─ 2. Upload: uploadFile('comprovantes', path, file)
  │
  └─ 3. POST /functions/v1/vendas { aluno_id, curso_id, ... }
        └─ Edge Function cria venda + evidência + comissão atomicamente
```
