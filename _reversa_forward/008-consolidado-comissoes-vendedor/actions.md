# Actions: Consolidado de comissões por vendedor para pagamento

> Identificador: `008-consolidado-comissoes-vendedor`
> Data: `2026-09-29`
> Roadmap: `_reversa_forward/008-consolidado-comissoes-vendedor/roadmap.md`

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de ações | 6 |
| Paralelizáveis (`[//]`) | 3 |
| Maior cadeia de dependência | 3 |

## Fase 1, Preparação

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T001 | Criar a migration que inclui `FINANCEIRO` na policy de SELECT de `perfis` | - | `[//]` | `supabase/migrations/20260929000000_perfis_financeiro_select.sql` | 🟢 | `[X]` |
| T002 | Criar a lib pura `src/lib/consolidado.ts` (rótulos por status, agregação por vendedor, período, CSV) | - | `[//]` | `src/lib/consolidado.ts` | 🟢 | `[X]` |

## Fase 2, Testes

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T003 | Criar testes Deno da agregação (totais por situação, filtro por `data_liberacao`) e do CSV | T002 | - | `tests/consolidado.test.ts` | 🟢 | `[X]` |

## Fase 3, Núcleo

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T004 | Criar a página `/consolidado` (GESTOR/FINANCEIRO): busca comissões/vendas/perfis, aplica a lib, tabela por vendedor com drill-down | T002 | - | `src/app/consolidado/page.tsx` | 🟢 | `[X]` |

## Fase 4, Integração

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T005 | Adicionar o item de menu "Consolidado" para `GESTOR` e `FINANCEIRO` | - | `[//]` | `src/components/DashboardLayout.tsx` | 🟢 | `[X]` |

## Fase 5, Polimento

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T006 | Tratar loading, vazio e erro; filtro de período na UI e botão de export CSV | T004 | - | `src/app/consolidado/page.tsx` | 🟡 | `[X]` |

## Notas de execução

<!-- Reservado para /reversa-coding. -->

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-29 | Versão inicial gerada por `/reversa-to-do` | reversa |
