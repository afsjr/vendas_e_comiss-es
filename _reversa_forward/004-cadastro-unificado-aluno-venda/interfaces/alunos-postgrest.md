# Interface: `alunos` via PostgREST (Supabase client)

> Identificador: `004-cadastro-unificado-aluno-venda`
> Data: `2026-09-15`
> Status: **Contrato existente com uma operação nova (DELETE)** — SELECT e INSERT já usados por `/alunos/novo`

## Resumo

A tela unificada fala com a tabela `alunos` diretamente pelo Supabase client (PostgREST + RLS), sem Edge Function. Usa três operações: SELECT (detecção de CPF), INSERT (cadastro) e DELETE (compensação). A operação de DELETE passa a ser possível apenas após a migration de policy descrita em `data-delta.md`.

## Endpoints PostgREST

Base: `${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/alunos`

### 1. SELECT por CPF (detecção de duplicidade)

```
GET /rest/v1/alunos?select=id,nome&cpf=eq.<cpf>&limit=1
Authorization: Bearer <JWT>
apikey: <anon>
```

- Resposta 200: `[]` (não existe) ou `[{ id, nome }]`.
- Usa `idx_alunos_cpf`. Permitido pela policy `Alunos readable by all roles`.

### 2. INSERT (cadastro do aluno)

```
POST /rest/v1/alunos
Content-Type: application/json
Prefer: return=representation
Authorization: Bearer <JWT>
apikey: <anon>

{
  "nome": "Aluno Teste",
  "cpf": "52998224725",
  "email": "teste@email.com",
  "telefone": "11999990000",
  "is_whatsapp": false,
  "criado_por": "<uuid-do-usuario>"
}
```

- Resposta 201: `[{ id, ... }]`.
- Erro 409 (`23505`): CPF já cadastrado → entra no ramo "vincular".
- Permitido por `Alunos insertable by VENDEDOR and SECRETARIA` e `Alunos insertable by GESTOR`.

### 3. DELETE (compensação — NOVA operação)

```
DELETE /rest/v1/alunos?id=eq.<aluno_id>
Authorization: Bearer <JWT>
apikey: <anon>
```

- Só executa quando as condições da policy forem atendidas:
  - `criado_por = auth.uid()` (só o próprio criador), e
  - `NOT EXISTS (venda do aluno)` (aluno órfão).
- Se a venda já tiver sido criada, o DELETE afeta 0 linhas — comportamento esperado e seguro.
- Sem a migration, afeta 0 linhas sempre (esta era a lacuna que motivou D-05).

## Erros e tratamento no frontend

| Situação | Resposta | Tratamento |
|----------|----------|------------|
| CPF já existe | INSERT 409 / `23505` | Exibir aluno mascarado, oferecer vincular |
| Sem permissão de papel | 401/403 | Mensagem de acesso negado |
| Falha de rede no INSERT | erro de fetch | Não chamar a Edge Function; exibir retry |
| Falha na venda após INSERT | n/a | Chamar DELETE de compensação; se falhar, orientar retry da venda |

## Idempotência

- INSERT: protegido por `alunos.cpf UNIQUE` (segunda tentativa retorna 409).
- DELETE: idempotente (remover um id já ausente retorna 204 sem efeito).
