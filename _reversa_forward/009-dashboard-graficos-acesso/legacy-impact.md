# Legacy Impact: Dashboard visual — funil, volume acumulado e acesso por papel

> Identificador: `009-dashboard-graficos-acesso`
> Data: `2026-10-05`
> Feature greenfield, sem legado pré-existente. Âncora: `prd.md` + specs SDD.
> Política de edição no momento da execução: `allowLegacyEdits: true`; `allowedPaths`: `src/app/**`, `src/components/**`, `src/lib/**`, `supabase/**`, `tests/**`, `public/**`, `.gitignore`, `scripts/**`, `_reversa_bugs/**`.

## 1. Arquivos afetados

| Arquivo afetado | Componente (spec) | Tipo | Severidade | Justificativa |
|-----------------|-------------------|------|-----------|---------------|
| `src/lib/dashboard-metrics.ts` | `dashboard-gerencial-relatorios` | componente-novo | LOW | Lib pura de agregação (funil, volume, repasse, categoria, comparativo) |
| `src/components/charts/ChartFrame.tsx` | `dashboard-gerencial-relatorios` | componente-novo | LOW | Invólucro comum de gráfico com estado vazio e acessibilidade |
| `src/components/charts/FunnelChart.tsx` | `dashboard-gerencial-relatorios` | componente-novo | LOW | Gráfico de funil por etapa (SVG, sem dependência) |
| `src/components/charts/ComparisonChart.tsx` | `dashboard-gerencial-relatorios` | componente-novo | LOW | Comparativo lado a lado por vendedor (SVG) |
| `src/components/charts/CategoryChart.tsx` | `dashboard-gerencial-relatorios` | componente-novo | LOW | Distribuição das entradas por categoria (SVG) |
| `src/app/dashboard/page.tsx` | `dashboard-gerencial-relatorios` | componente-novo | MEDIUM | Página reescrita: recorte por papel, filtro de período e gráficos |
| `src/components/DashboardLayout.tsx` | `autenticacao-controle-acesso` | componente-novo | LOW | Menu "Visão Geral" liberado para todos os papéis |
| `tests/dashboard_metrics.test.ts` | `dashboard-gerencial-relatorios` | componente-novo | LOW | Testes Deno das agregações puras |

## 2. Diff conceitual por componente

- **`dashboard-gerencial-relatorios`:** o dashboard deixa de ser exclusivo do `GESTOR` e passa a ter visão por papel. Adiciona funil por etapa, volume acumulado (entradas, comissões, repasse), distribuição por categoria e comparativo lado a lado por vendedor. Toda a agregação sai da página e passa para a lib pura, testável.
- **`autenticacao-controle-acesso`:** nenhuma policy de RLS foi alterada. O recorte de `VENDEDOR` usa a RLS vigente + filtro explícito; o de `SECRETARIA` é filtro de consulta (a policy de SELECT é ampla por necessidade do pós-venda). Papéis gerais alternam próprio × geral no cliente.

## 3. Preservadas

Nenhuma regra pré-existente de `_reversa_sdd/domain.md` — projeto greenfield, sem extração de legado anterior.

## 4. Modificadas

Nenhuma. Feature greenfield; não há regra 🟢 de extração prévia para alterar/remover.

## 5. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-10-05 | Versão inicial gerada por `/reversa-coding` | reversa |
