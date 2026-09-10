# Reprodução (live na nuvem)

Ambiente: projeto `jgvmqglkgbflptohqaus`, usuário `gestor@teste.local` (login com senha `Teste@123`),
em 2026-09-09. Comando de reprodução (curl):

1. `POST /auth/v1/token?grant_type=password` (email/password) → access_token.
2. Decodificar JWT: `app_metadata.app_role = "GESTOR"` (claim presente, token novo).
3. `POST /rest/v1/alunos` com o token + `criado_por: <user_id>` e payload mínimo
   (nome, cpf `00000000000`, email).

Resultado (exit 0 HTTP):

```json
{"code":"42501","details":null,"hint":null,"message":"new row violates row-level security policy for table \"alunos\""}
```

Nenhuma linha criada (RLS rejeitou o INSERT). Taxa: 1/1. Classificação: deterministic.

Causa raiz: a policy de INSERT `"Alunos insertable by VENDEDOR and SECRETARIA"`
(`supabase/migrations/001_schema.sql:172`) só aceita `app_role` em (`VENDEDOR`,`SECRETARIA`).
O claim do token do GESTOR é `GESTOR`, então o WITH CHECK falha. Estado: confirmed.