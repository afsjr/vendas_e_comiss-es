# Data Delta: Data de início do curso — fallback de exibição e obrigatoriedade no cadastro

> Identificador: `011-data-inicio-curso`
> Data: `2026-10-09`
> Base extraída: `_reversa_sdd/data-dictionary.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Veredito

**Sem novas colunas ou tabelas.** Uma operação de backfill em `vendas.data_inicio_curso` e uma constraint `CHECK NOT VALID` para proteger novas inserções.

## 2. Campos alterados

| Tabela | Campo | Ação | Notas |
|--------|-------|------|-------|
| `vendas` | `data_inicio_curso` | backfill em registros nulos | Preenchido com `criado_em::date` (data da venda) |
| `vendas` | `data_inicio_curso` | constraint `CHECK (data_inicio_curso IS NOT NULL) NOT VALID` | Protege novas inserções; não varre dados existentes |

## 3. Campos adicionados

Nenhum.

## 4. Campos removidos

Nenhum.

## 5. Migrações necessárias

| Ordem | Migração | Conteúdo |
|-------|----------|----------|
| 1 | `backfill_vendas_data_inicio_curso` | `UPDATE public.vendas SET data_inicio_curso = criado_em::date WHERE data_inicio_curso IS NULL` |
| 2 | `vendas_data_inicio_curso_check` | `ALTER TABLE public.vendas ADD CONSTRAINT vendas_data_inicio_curso_not_null CHECK (data_inicio_curso IS NOT NULL) NOT VALID` + `NOTIFY pgrst` |

## 6. Impacto no legado

- A liberação da comissão continua exigindo `data_inicio_curso` real para os cálculos; o backfill apenas dá um valor válido onde faltava.
- A UI de cadastro e a Edge Function já bloqueiam ausência de data; a constraint é defesa em profundidade.
- `CHECK NOT VALID` pode ser validada no futuro com `VALIDATE CONSTRAINT` após confirmar zero nulos.

## 7. Compatibilidade

- A feature 010 (`comissoes.data_pagamento`, painel `/comissoes`) não é afetada; o painel apenas passa a exibir fallback + selo quando a data de início estiver nula.

## 8. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-10-09 | Versão inicial gerada por `/reversa-plan` | reversa |
