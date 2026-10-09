# Onboarding: como testar a Data de início do curso (feature 011)

> Identificador: `011-data-inicio-curso`
> Data: `2026-10-09`
> Objetivo: um humano testar a feature pela primeira vez do zero.

## 1. Pré-requisitos

- Node.js ≥ 18.17 e dependências instaladas (`npm install`).
- Supabase configurado (`.env.local`) e migrações aplicadas (`supabase db push`), incluindo as duas da feature 011.
- Usuário com papel `GESTOR` (para o painel) e `VENDEDOR` (para o cadastro).
- Dados de teste: ao menos uma venda com `data_inicio_curso` preenchida e, se possível, uma venda histórica com a coluna nula (antes do backfill).

## 2. Subir o ambiente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

## 3. Roteiro de verificação

### 3.1 Fallback no painel de comissões

1. Faça login como `GESTOR` e abra **Comissões** (`/comissoes`).
2. Encontre uma linha cuja `data_inicio_curso` esteja nula.
3. Confirme que a coluna "Início do curso" mostra a **data da venda** com o **selo "via data da venda"**.
4. Encontre uma linha com data de início preenchida e confirme que aparece a data real, **sem** selo.

### 3.2 Cadastro exige a data

1. Faça login como `VENDEDOR`.
2. Abra **Nova Venda** (`/vendas/novo`) e tente enviar sem a data de início → bloqueado.
3. Repita no **Cadastro Unificado** sem a data → bloqueado.

### 3.3 Guarda no banco (defesa em profundidade)

1. Tente um `INSERT` direto em `vendas` sem `data_inicio_curso` (via SQL/Studio).
2. Confirme que a constraint `vendas_data_inicio_curso_not_null` rejeita o insert.

## 4. Testes automatizados

```bash
deno test --allow-read tests/comissoes_pagamento.test.ts
```

Inclui o caso de `data_inicio_curso` nula → exibição com fallback.

## 5. Rollback

- Frontend: reverter a coluna do painel.
- Banco: `ALTER TABLE vendas DROP CONSTRAINT vendas_data_inicio_curso_not_null`; o backfill não é revertido automaticamente (é uma correção de dado).

## 6. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-10-09 | Versão inicial gerada por `/reversa-plan` | reversa |
