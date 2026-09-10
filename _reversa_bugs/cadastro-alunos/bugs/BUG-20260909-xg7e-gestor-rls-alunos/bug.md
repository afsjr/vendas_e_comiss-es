---
schema_version: 1
id: BUG-20260909-xg7e
display_number: 1
title: "Gestor bloqueado ao criar aluno pela policy RLS de INSERT"
status: resolved
phase: delivering
severity: medium
priority: P1
created: 2026-09-09
updated: 2026-09-09
express: true

origin:
  type: manual-report
  external_ref: null

area: cadastro-alunos-documentacao
module: auth-rls
feature: cadastro-alunos
labels: []

visibility: normal
security_suspected: false

reproduction:
  classification: deterministic
  rate: "1/1"
  suspected_triggers: []

blocking: []

relationships: []

traceability:
  specs:
    - "_reversa_sdd/sdd/cadastro-alunos-documentacao.md#4-usuarios-e-perfis-de-acesso-rbac"
    - "_reversa_sdd/sdd/autenticacao-controle-acesso.md#endpoints-apontamento"
  affected_code:
    - "src/app/alunos/novo/page.tsx"
    - "supabase/migrations/001_schema.sql"
  root_cause:
    state: confirmed
    hypothesis: "A policy de INSERT de alunos (001_schema.sql:172) só autoriza app_role VENDEDOR/SECRETARIA; o token de GESTOR tem app_role=GESTOR e o WITH CHECK falha."
    causal_path:
      - "POST /rest/v1/alunos com token GESTOR"
      - "RLS avalia WITH CHECK da policy Alunos insertable by VENDEDOR and SECRETARIA"
      - "app_role GESTOR nao esta na lista -> WITH CHECK falso"
      - "PostgREST responde 42501 new row violates row-level security policy"
    evidence:
      - ref: "evidence/reproduction.md"
        observation: "INSERT real rejeitado com 42501; JWT decodificado com app_role=GESTOR; nenhuma linha criada"
    code_refs:
      - file: "supabase/migrations/001_schema.sql"
        symbol: "Alunos insertable by VENDEDOR and SECRETARIA"
        commit: null
  reproduction_tests:
    - "evidence/reproduction.md (curl live antes do fix: 42501; apos o fix: insert de aluno ok, id de187cf5-9fcc-4b0b-8304-a37aeb196077)"
    - "tests/rls_alunos_gestor.test.ts (falhava antes da migration: policy GESTOR ausente)"
  regression_tests:
    - "tests/rls_alunos_gestor.test.ts (0 passed/2 failed antes; 2 passed/0 failed apos CHG-002)"

spec_verdict: spec-desatualizada

change_set:
  - id: CHG-001
    kind: test
    artifact: tests/rls_alunos_gestor.test.ts
    purpose: "Contrato de regressao: policy de INSERT de alunos autoriza GESTOR e policy original de VENDEDOR/SECRETARIA permanece"
  - id: CHG-002
    kind: migration
    artifact: supabase/migrations/20260909000002_alunos_insert_gestor.sql
    purpose: "Policy permissiva OR autorizando GESTOR no INSERT de alunos (aditivo; nao toca 001_schema.sql)"
  - id: CHG-003
    kind: specification
    artifact: _reversa_sdd/addenda/bug-BUG-20260909-xg7e-v001.md
    purpose: "Adendo de spec: GESTOR passa a criar alunos (section 4 do cadastro-alunos-documentacao)"

closure:
  policy: local-software
  satisfied: true
resolution_kind: fixed
---

# Gestor bloqueado ao criar aluno pela policy RLS de INSERT

## Summary

Usuário logado como GESTOR (`gestor@teste.local`, login posterior ao seed, token com claim
`app_metadata.app_role`) não consegue cadastrar aluno em `/alunos/novo`. O INSERT é rejeitado pelo
PostgREST com "new row violates row-level security policy for table 'alunos'", porque a policy
`"Alunos insertable by VENDEDOR and SECRETARIA"` não inclui `GESTOR`.

## Expected Behavior

O usuário desejava concluir o cadastro do aluno (criar linha em `alunos`). A spec de referência é
ambígua: `cadastro-alunos-documentacao.md` seção 4 trata GESTOR como somente leitura, enquanto
`autenticacao-controle-acesso.md:107` permite GESTOR apontar vendas. Comportamento esperado depende
do veredito de spec (decisão humana): GESTOR poder criar aluno, ou GESTOR não ter acesso à criação.

## Actual Behavior

O POSTGREST rejeita o INSERT com "new row violates row-level security policy for table 'alunos'"
quando o papel é GESTOR. A policy de INSERT (`001_schema.sql:172`) aceita somente
`app_metadata.app_role IN ('VENDEDOR', 'SECRETARIA')`.

## Steps to Reproduce

1. Logar como `gestor@teste.local` (senha `Teste@123`) em ambiente cloud (projeto
   `jgvmqglkgbflptohqaus`) com token emitido após o seed (claim `app_role=GESTOR` presente).
2. Acessar `src/app/alunos/novo` (rota "Cadastrar Aluno").
3. Preencher Nome, CPF e E-mail e submeter.
4. Observar o alert "Erro ao criar: new row violates row-level security policy for table 'alunos'".

## Evidence

- `evidence/reprod-usuario-gestor.txt`: erro reportado pelo usuário (alert do frontend).

## Suspected Area

Policy RLS de INSERT em `alunos` (`supabase/migrations/001_schema.sql:172`), não alinhada ao esperado
pelo fluxo de criação para GESTOR. Ponto de entrada que dispara: `src/app/alunos/novo/page.tsx:21`.

## Acceptance Criteria

- Logado como GESTOR, o cadastro de aluno em `/alunos/novo` conclui (ou a criação é explicitamente
  inacessível a GESTOR conforme veredito de spec), sem erro de RLS.
- Demais papéis continuam com o comportamento atual: VENDEDOR e SECRETARIA podem criar; SELECT
  permanece como está.
- Veredito de spec registrado (spec-correta ou spec-desatualizada com adendo).

## Traceability

- Specs: `_reversa_sdd/sdd/cadastro-alunos-documentacao.md#4-usuarios-e-perfis-de-acesso-rbac`;
  `_reversa_sdd/sdd/autenticacao-controle-acesso.md` (endpoints de apontamento).
- Código afetado: `src/app/alunos/novo/page.tsx` (insert), `supabase/migrations/001_schema.sql`
  (policy "Alunos insertable by VENDEDOR and SECRETARIA").
- Causa raiz: pendente (hipótese: policy de INSERT sem GESTOR/AUDITOR).

## Resolution

- **Root cause (confirmed):** policy de INSERT de `alunos` (`001_schema.sql:172`) só autorizava
  `app_role IN ('VENDEDOR','SECRETARIA')`; GESTOR (token com `app_metadata.app_role=GESTOR`) falhava
  no WITH CHECK.
- **Veredito de spec:** `spec-desatualizada` (decisão humana). GESTOR passa a criar alunos.
  Adendo `_reversa_sdd/addenda/bug-BUG-20260909-xg7e-v001.md` (seção 4 do cadastro-alunos-documentacao);
  GESTOR segue sem UPDATE/DELETE em cadastros.
- **Change set aplicado:**
  | CHG | kind | artefato | propósito |
  |---|---|---|---|
  | CHG-001 | test | `tests/rls_alunos_gestor.test.ts` | contrato de regressão do RLS de alunos |
  | CHG-002 | migration | `supabase/migrations/20260909000002_alunos_insert_gestor.sql` | policy OR autorizando GESTOR |
  | CHG-003 | specification | `_reversa_sdd/addenda/bug-BUG-20260909-xg7e-v001.md` | adendo de spec do veredito |
- **Prova vermelho→verde:**
  - Gate: `deno test --allow-read tests/rls_alunos_gestor.test.ts`
    - antes de CHG-002: `FAILED | 1 passed | 1 failed`
    - após CHG-002: `ok | 2 passed | 0 failed`
  - Live na nuvem: INSERT como gestor → `42501` (vermelho); após aplicar a migration no SQL Editor,
    INSERT → id `de187cf5-9fcc-4b0b-8304-a37aeb196077` (verde). Linha de teste removida via service role (HTTP 204).
- **Closure policy (local-software):** regressão passando + veredito registrado = resolvido.

## Agent Notes

- Regra Reversa aplicável: não editar `001_schema.sql` legado; correção como migration nova.
- Veredito de spec precisa de decisão humana: GESTOR deve poder criar aluno? E AUDITOR?
- Proposta de taxonomia: área/module/feature já existentes em taxonomy.yaml.
- Severidade e prioridade assumidas na rota expressa: P1 (bloqueia criação do papel admin).