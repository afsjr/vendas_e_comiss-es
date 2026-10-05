# Adendo: Dashboard visual — funil por etapa, volume acumulado e acesso por papel

> Identificador: 009-dashboard-graficos-acesso
> Data: 2026-10-05
> Cenário: greenfield

## Vigência
Vigente desde 2026-10-05.

## Resumo da entrega
O dashboard (`/dashboard`) deixou de ser exclusivo do `GESTOR` e passa a ter visão por papel. Ganha gráfico de funil por etapa do processo (quantidade e valor), volume financeiro acumulado no período (entradas, comissões não estornadas e repasse previsto), distribuição das entradas por categoria de curso e comparativo **lado a lado** por vendedor. `VENDEDOR` e `SECRETARIA` veem apenas os próprios lançamentos; `GESTOR`, `AUDITOR` e `FINANCEIRO` veem o próprio recorte e a visão geral consolidada. Os gráficos são desenhados em SVG próprio, sem dependência nova, e a agregação foi extraída para uma lib pura testável. Foram concluídas **10 ações**.

## Impacto por artefato da extração

| Artefato | Seção | Tipo de impacto | Delta |
|----------|-------|-----------------|-------|
| `_reversa_sdd/prd.md` | Requisitos de dashboard/relatórios | componente-novo | RF-01 a RF-09 implementados: funil por etapa, volume acumulado, filtro de período, acesso por papel, comparativo lado a lado por vendedor, distribuição por categoria e estados de tela |
| `_reversa_sdd/sdd/dashboard-gerencial-relatorios.md` | 6. Requisitos Funcionais (RF-XX) | componente-novo | O dashboard ganha funil, volume, categoria e comparativo; a agregação sai da tela e vira lib pura em `src/lib/dashboard-metrics.ts` |
| `_reversa_sdd/sdd/autenticacao-controle-acesso.md` | 11.1 Matriz de Acesso RBAC (Role-Based Access Control) | componente-novo | Item de menu "Visão Geral" liberado para todos os papéis; nenhuma policy de RLS alterada. Recorte de `SECRETARIA` é filtro de consulta (RLS amplo por necessidade do pós-venda) |
| `_reversa_sdd/addenda/005-auditoria-primeiro-checklist-dashboard.md` | Painéis gerenciais | componente-novo | O dashboard por curso e recomendações foi reformulado em gráficos e cards; nenhum comportamento anterior foi removido |

## Regras sob vigilância

Watch items desta entrega em `_reversa_forward/009-dashboard-graficos-acesso/regression-watch.md`: `W001`, `W002`, `W003`, `W004`, `W005`, `W006`, `W007` (observações sem peso de regressão, greenfield).

## Fontes
- `_reversa_forward/009-dashboard-graficos-acesso/requirements.md`
- `_reversa_forward/009-dashboard-graficos-acesso/roadmap.md`
- `_reversa_forward/009-dashboard-graficos-acesso/legacy-impact.md`
- `_reversa_forward/009-dashboard-graficos-acesso/regression-watch.md`
- `_reversa_forward/009-dashboard-graficos-acesso/progress.jsonl`
- `_reversa_forward/009-dashboard-graficos-acesso/actions.md`
