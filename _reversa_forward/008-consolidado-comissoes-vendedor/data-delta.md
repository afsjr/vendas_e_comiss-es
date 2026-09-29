# Data Delta — Consolidado de comissões por vendedor para pagamento

> Identificador: `008-consolidado-comissoes-vendedor`
> Data: `2026-09-29`
> Base extraída: `supabase/migrations/001_schema.sql`, `20260730094501_create_perfis_rls.sql`, `20260924000001_fix_perfis_rls_appmetadata.sql`, `20260909000001_postvenda_rls.sql`

## 1. Resumo do delta

| Objeto | Tipo | Ação |
|--------|------|------|
| `perfis` (policy `Leitura gestor ou auditor`) | RLS | **alterar** para incluir `FINANCEIRO` |
| tabelas | — | nenhuma tabela nova |

Nenhuma alteração de esquema/coluna. `comissoes` e `vendas` já são legíveis por `FINANCEIRO` (policy de `20260909000001_postvenda_rls.sql`).

## 2. Por que a policy de `perfis` muda

O consolidado precisa do **nome do vendedor** (`perfis.nome`), agrupando por `vendas.criado_por`. A policy atual de SELECT de `perfis` permite apenas `GESTOR` e `AUDITOR`:

```
CREATE POLICY "Leitura gestor ou auditor" ON public.perfis
  FOR SELECT USING (auth.jwt() -> 'app_metadata' ->> 'app_role' IN ('GESTOR', 'AUDITOR'));
```

Sem incluir `FINANCEIRO`, o Financeiro veria as comissões mas não os nomes.

## 3. Migration

Arquivo: `supabase/migrations/20260929000000_perfis_financeiro_select.sql`

```
DROP POLICY IF EXISTS "Leitura gestor ou auditor" ON public.perfis;
CREATE POLICY "Leitura gestor ou auditor" ON public.perfis
  FOR SELECT USING (
    auth.jwt() -> 'app_metadata' ->> 'app_role' IN ('GESTOR', 'AUDITOR', 'FINANCEIRO')
  );
```

## 4. Leitura usada pelo consolidado

- `comissoes` (id, venda_id, valor_comissao, status, data_liberacao, criado_em) — RLS já libera GESTOR/FINANCEIRO.
- `vendas` (criado_por, alunos(nome), cursos(nome)) — RLS já libera GESTOR/FINANCEIRO.
- `perfis` (id, nome, email) — **depende da migration acima** para FINANCEIRO.

## 5. Impacto em dados existentes

Nenhum backfill. A mudança é apenas de permissão de leitura.
