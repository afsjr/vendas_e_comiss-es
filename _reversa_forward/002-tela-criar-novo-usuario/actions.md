# Actions: Tela para criar novo usuário

> Identificador: `002-tela-criar-novo-usuario`
> Data: `2026-07-30`
> Roadmap: `_reversa_forward/002-tela-criar-novo-usuario/roadmap.md`

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de ações | 9 |
| Paralelizáveis (`[//]`) | 5 |
| Maior cadeia de dependência | 4 |

## Fase 1, Preparação

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| `[//]` T001 | Criar migration DDL para a tabela `public.perfis`, enum `AppRole` e função/trigger de sincronia com `auth.users` | - | `[//]` | `supabase/migrations/TIMESTAMP_create_perfis_table.sql` | 🟢 | `[X]` |
| T002 | Criar migration com as políticas de segurança RLS (Leitura pessoal, Leitura Gestor, Update restrito a Gestor) | T001 | - | `supabase/migrations/TIMESTAMP_create_perfis_rls.sql` | 🟢 | `[X]` |
| `[//]` T003 | Atualizar os tipos globais TypeScript para incluir a nova interface/tipo do Perfil correspondente ao DDL | - | `[//]` | `types/index.ts` | 🟢 | `[X]` |

## Fase 2, Testes

<!-- Omitido, não aplicável de forma estrita no momento inicial da POC. Testes de QA via roteiro manual. -->

## Fase 3, Núcleo

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| `[//]` T004 | Criar layout, formulário base (Nome, Email, Senha) e rota pública `/cadastro` | T003 | `[//]` | `src/app/cadastro/page.tsx` | 🟢 | `[X]` |
| T005 | Integrar formulário de `/cadastro` com `supabase.auth.signUp()`, passando o nome nos meta-dados | T004 | - | `src/app/cadastro/page.tsx` | 🟢 | `[X]` |
| `[//]` T006 | Criar página administrativa `/admin/usuarios` que faz fetch e renderiza a lista de `public.perfis` | T001, T003 | `[//]` | `src/app/admin/usuarios/page.tsx` | 🟢 | `[X]` |
| T007 | Desenvolver Server Action para alteração do perfil (role) validando segurança/autorização | T001, T003 | - | `src/app/actions/usuarios.ts` | 🟢 | `[X]` |

## Fase 4, Integração

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T008 | Integrar a UI de `/admin/usuarios` com a Server Action, adicionando select dropdown para alterar o cargo | T006, T007 | - | `src/app/admin/usuarios/page.tsx` | 🟢 | `[X]` |

## Fase 5, Polimento

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| `[//]` T009 | Reforçar restrição de acesso na aplicação via Middleware, bloqueando não-gestores da rota `/admin` | - | `[//]` | `src/middleware.ts` | 🟢 | `[X]` |

## Notas de execução

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-07-30 | Versão inicial gerada por `/reversa-to-do` | reversa |
