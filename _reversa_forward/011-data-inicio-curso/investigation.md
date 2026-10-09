# Investigation: Data de início do curso — fallback de exibição e obrigatoriedade no cadastro

> Identificador: `011-data-inicio-curso`
> Data: `2026-10-09`
> Requirements: `_reversa_forward/011-data-inicio-curso/requirements.md`

## 1. Pergunta de investigação

Como exibir a data da venda quando `data_inicio_curso` estiver nula no painel de comissões e garantir que novas vendas tenham a data de início prevista, sem reescrever o fluxo de cadastro nem invalidar o histórico existente?

## 2. Estado atual do código (fontes)

| Fonte | O que revela |
|-------|--------------|
| `supabase/migrations/001_schema.sql` | `vendas.data_inicio_curso` existe e é anulável |
| `supabase/functions/vendas/index.ts:22` | Já rejeita criação sem `data_inicio_curso` (400) |
| `src/app/vendas/novo/page.tsx:45,163` | Guarda `!dataInicio` e input `required` |
| `src/app/cadastro-unificado/page.tsx:209` | Guarda `!dataInicio` antes de criar a venda |
| `src/app/comissoes/page.tsx:91,336` | Mapeia e exibe `data_inicio_curso` (coluna "Início do curso") |
| `src/lib/comissoes-pagamento.ts` | Lib pura de agregação/helpers da feature 010 |
| `tests/comissoes_pagamento.test.ts` | Padrão de testes Deno da lib |

## 3. Alternativas avaliadas

### 3.1 Guarda no banco via `NOT NULL`

- **Prós:** simples.
- **Contras:** exige backfill total antes; falha se sobrar qualquer nulo.
- **Veredito:** preterida em favor de `CHECK NOT VALID`.

### 3.2 Guarda no banco via `CHECK NOT VALID` (escolhida)

- **Prós:** protege novas inserções sem exigir backfill; não invalida o histórico.
- **Contras:** não valida linhas antigas (aceito — são backfilladas).
- **Veredito:** escolhida (D-03).

### 3.3 Trigger `BEFORE INSERT`

- **Prós:** mensagem customizável.
- **Contras:** mais código; `CHECK` já cobre o caso.
- **Veredito:** descartada.

### 3.4 Fallback no cliente vs no banco

- **Banco (view/coluna calculada):** exigiria nova view ou coluna.
- **Cliente (helper puro):** mínimo, testável, dentro de `allowedPaths`.
- **Veredito:** cliente com helper puro (D-02).

## 4. Padrões aplicáveis

- **Lib pura + testes Deno:** `src/lib/comissoes-pagamento.ts` + `tests/comissoes_pagamento.test.ts`.
- **Migração aditiva:** mesmo estilo das migrações recentes (`ADD COLUMN IF NOT EXISTS`, `NOTIFY pgrst`).

## 5. Fontes externas

- Documentação do PostgreSQL sobre `CHECK ... NOT VALID` (constraints que não varrem dados existentes).

## 6. Conclusão

Seguir com **helper puro de exibição + selo no painel**, **backfill** dos nulos e **constraint CHECK NOT VALID**. Sem contrato externo novo e sem dependência nova.

## 7. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-10-09 | Versão inicial gerada por `/reversa-plan` | reversa |
