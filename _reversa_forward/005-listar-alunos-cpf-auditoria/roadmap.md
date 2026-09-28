# Roadmap: Listagem de alunos com CPF mascarado e trilha de auditoria

> Identificador: `005-listar-alunos-cpf-auditoria`
> Data: `2026-09-28`
> Requirements: `_reversa_forward/005-listar-alunos-cpf-auditoria/requirements.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Resumo da abordagem

Delta aditivo sobre o módulo de alunos. Cria a página de listagem `/alunos` (inexistente hoje), exibindo o CPF **mascarado** (`ddd.****.dddd`) para `VENDEDOR`/`SECRETARIA` e **completo** para `GESTOR` (e `AUDITOR`). O `GESTOR` corrige o CPF na página do aluno via **server action** com validação (`isValidCpf` + unicidade) e **motivo obrigatório**, gravando em uma nova tabela **append-only** `alunos_cpf_historico`. A listagem não aplica isolamento por autor (RN-07). A máscara é aplicada só na apresentação; o dado permanece em texto claro.

## 2. Princípios aplicados

`.reversa/principles.md` **não existe**. Nenhum conflito a registrar.

| Princípio | Como a feature se relaciona | Status |
|-----------|------------------------------|--------|
| n/a | Arquivo de princípios ausente | n/a |

## 3. Decisões técnicas

| ID | Decisão | Justificativa | Alternativas descartadas | Confidência |
|----|---------|----------------|--------------------------|-------------|
| D-01 | Correção de CPF via **Next server action** reaproveitando `authorizeGestor` | É mutação administrativa; o projeto já usa esse padrão (`src/app/actions/usuarios.ts`), evitando Edge Function nova | Edge Function nova | 🟢 |
| D-02 | Nova tabela **append-only** `alunos_cpf_historico` (trigger bloqueia UPDATE/DELETE) | Rastreabilidade imutável (RN-05/RN-08); padrão `livro_caixa_lancamentos` | guardar histórico em JSONB na `alunos` | 🟢 |
| D-03 | Máscara como helper puro `maskCpf` em `src/lib/cpf.ts`, aplicado na UI | Mascaramento é apresentação; reusa `isValidCpf`/`formatCpf` já existentes | mascarar no banco/view | 🟢 |
| D-04 | Listagem sem isolamento por autor (todos os perfis autorizados veem todos) | RN-07; coerente com a policy de SELECT atual de `alunos` | filtrar por `criado_por` | 🟢 |
| D-05 | `AUDITOR` vê CPF completo e a trilha, como o `GESTOR` | RF-06 cita "Gestor (e Auditor)"; auditoria exige leitura completa | `AUDITOR` mascarado | 🟡 |
| D-06 | Validação server-side reusa `isValidCpf` + checagem de unicidade | RN-04; não confiar na UI | validação só no cliente | 🟢 |
| D-07 | Menu "Alunos" visível a `VENDEDOR`, `SECRETARIA`, `AUDITOR`, `GESTOR` | RN-07 (todos veem a listagem) | menu só GESTOR | 🟡 |

## 4. Premissas

Nenhuma. O `requirements.md` chegou ao plano com **0 marcadores `[DÚVIDA]`**.

| Premissa | Origem (`requirements.md` seção) | Risco se errada |
|----------|----------------------------------|-----------------|
| — | — | — |

## 5. Delta arquitetural

| Componente | Arquivo de origem no legado | Tipo de mudança | Resumo |
|------------|------------------------------|-----------------|--------|
| `frontend-alunos` | `_reversa_sdd/code-analysis.md#frontend-alunos` | componente-novo | Página `/alunos` (listagem) + correção e histórico no detalhe do aluno |
| `cadastro-alunos-documentacao` | `_reversa_sdd/sdd/cadastro-alunos-documentacao.md` | regra-alterada | `alunos.cpf` passa a ser editável pelo `GESTOR` (com motivo e trilha) |
| `autenticacao-controle-acesso` | `_reversa_sdd/sdd/autenticacao-controle-acesso.md#RF-08` | delta-de-dados | Nova tabela `alunos_cpf_historico` com RLS GESTOR/AUDITOR |
| `frontend-shell` | `src/components/DashboardLayout.tsx` | contrato-alterado | Novo item de menu "Alunos" |

## 6. Delta no modelo de dados

- Resumo das mudanças: 1 tabela nova (`alunos_cpf_historico`, append-only); **sem alteração** em `alunos` além do valor de `cpf` já existente.
- Detalhe completo em: `_reversa_forward/005-listar-alunos-cpf-auditoria/data-delta.md`

## 7. Delta de contratos externos

Nenhum contrato externo (a mutação é um **server action** interno do Next, não um endpoint HTTP novo).

| Contrato | Tipo | Arquivo de detalhe |
|----------|------|--------------------|
| — | — | — |

## 8. Plano de migração

1. Criar a migration `supabase/migrations/20260928000001_alunos_cpf_historico.sql` (tabela + índice + trigger append-only + RLS GESTOR/AUDITOR).
2. Adicionar `maskCpf` em `src/lib/cpf.ts`.
3. Criar `src/app/actions/alunos.ts` (`corrigirCpf`, `listarHistoricoCpf`) com `authorizeGestor`.
4. Criar `src/app/alunos/page.tsx` (listagem com máscara por papel e busca).
5. Editar `src/app/alunos/[id]/page.tsx` (CPF completo para GESTOR/AUDITOR, formulário de correção com motivo e histórico).
6. Adicionar o item de menu "Alunos" em `src/components/DashboardLayout.tsx`.
7. Testes Deno dos helpers (`maskCpf`, `isValidCpf`) em `tests/alunos_cpf.test.ts`.

## 9. Riscos e mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Mascaramento depender só da UI e vazar CPF | alto | médio | Escrita só via server action com `authorizeGestor`; leitura completa só renderizada para GESTOR/AUDITOR |
| Corrida de unicidade ao gravar CPF | médio | baixo | Constraint `UNIQUE` em `alunos.cpf` + tratamento de erro na action |
| `AUDITOR` não especificado no requirements | baixo | médio | Decisão D-05 documentada (full como GESTOR) |
| Histórico adulterado | alto | baixo | Trigger append-only + RLS |

## 10. Critério de pronto

- [ ] Todas as ações do `actions.md` marcadas `[X]`
- [ ] VENDEDOR/SECRETARIA veem `ddd.****.dddd`; GESTOR/AUDITOR veem completo
- [ ] Correção exige motivo, valida CPF e grava na trilha
- [ ] `npx tsc --noEmit` sem erros e testes Deno passando
- [ ] `regression-watch.md` gerado

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-28 | Versão inicial gerada por `/reversa-plan` | reversa |
