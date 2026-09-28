# Actions: Listagem de alunos com CPF mascarado e trilha de auditoria

> Identificador: `005-listar-alunos-cpf-auditoria`
> Data: `2026-09-28`
> Roadmap: `_reversa_forward/005-listar-alunos-cpf-auditoria/roadmap.md`

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de ações | 8 |
| Paralelizáveis (`[//]`) | 4 |
| Maior cadeia de dependência | 4 |

## Fase 1, Preparação

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T001 | Criar a migration `alunos_cpf_historico` (tabela, índice, trigger append-only, RLS GESTOR/AUDITOR) | - | - | `supabase/migrations/20260928000001_alunos_cpf_historico.sql` | 🟢 | `[X]` |
| T002 | Adicionar o helper `maskCpf` (`ddd.****.dddd`) em `src/lib/cpf.ts`, reusando os helpers existentes | - | `[//]` | `src/lib/cpf.ts` | 🟢 | `[X]` |

## Fase 2, Testes

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T003 | Criar testes Deno de `maskCpf` e `isValidCpf` (formatos válidos/inválidos e máscara) | T002 | - | `tests/alunos_cpf.test.ts` | 🟢 | `[X]` |

## Fase 3, Núcleo

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T004 | Criar a server action `corrigirCpf` (valida `isValidCpf`, unicidade e motivo; grava na trilha e atualiza `alunos.cpf`) e `listarHistoricoCpf`, com `authorizeGestor` | T001 | `[//]` | `src/app/actions/alunos.ts` | 🟢 | `[X]` |
| T005 | Criar a página de listagem `/alunos` com busca (nome/e-mail/CPF) e CPF mascarado por papel | T002 | `[//]` | `src/app/alunos/page.tsx` | 🟢 | `[X]` |
| T006 | Editar o detalhe do aluno: CPF completo para GESTOR/AUDITOR, formulário de correção (motivo obrigatório) e histórico de alterações | T004 | - | `src/app/alunos/[id]/page.tsx` | 🟢 | `[X]` |

## Fase 4, Integração

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T007 | Adicionar o item de menu "Alunos" visível a GESTOR/AUDITOR/VENDEDOR/SECRETARIA | - | `[//]` | `src/components/DashboardLayout.tsx` | 🟢 | `[X]` |

## Fase 5, Polimento

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T008 | Tratar estados de carregamento, lista vazia e erros, com feedback de salvamento e destaque de CPF inválido | T005, T006 | - | `src/app/alunos/page.tsx`, `src/app/alunos/[id]/page.tsx` | 🟡 | `[X]` |

## Notas de execução

<!-- Reservado para /reversa-coding. -->

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-28 | Versão inicial gerada por `/reversa-to-do` | reversa |
