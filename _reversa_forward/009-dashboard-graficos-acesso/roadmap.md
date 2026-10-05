# Roadmap: Dashboard visual — funil por etapa, volume acumulado e acesso por papel

> Identificador: `009-dashboard-graficos-acesso`
> Data: `2026-10-05`
> Requirements: `_reversa_forward/009-dashboard-graficos-acesso/requirements.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Resumo da abordagem

Refatorar a página `src/app/dashboard/page.tsx` para uma visão orientada a papel, extraindo toda a agregação para uma biblioteca pura (`src/lib/dashboard-metrics.ts`) — mesmo padrão já usado por `src/lib/consolidado.ts`. Sobre essa base, renderizar gráficos **sem nova dependência**, com componentes SVG próprios em `src/components/charts/` (funil por etapa, comparativo lado a lado por vendedor e distribuição por categoria de curso). O controle de acesso é feito em duas camadas: as consultas ao Supabase já são limitadas por `SECRETARIA`/`VENDEDOR`/`GESTOR`/`AUDITOR`/`FINANCEIRO` via RLS, e a tela aplica o filtro explícito `criado_por = auth.uid()` para papéis de lançamento, além de alternância "próprio × geral" para os papéis com visão geral. Nenhuma mudança de schema: as policies atuais já liberam a leitura necessária.

## 2. Princípios aplicados

`_reversa_sdd/` não possui `.reversa/principles.md` ativo, então não há princípio formal a validar nesta feature. Recomenda-se rodar `/reversa-principles` se o time quiser formalizar (ex.: "sem dependência nova sem necessidade").

| Princípio | Como a feature se relaciona | Status |
|-----------|------------------------------|--------|
| (nenhum princípio formal registrado) | — | n/a |

## 3. Decisões técnicas

| ID | Decisão | Justificativa | Alternativas descartadas | Confidência |
|----|---------|----------------|--------------------------|-------------|
| D-01 | Gráficos em SVG próprio, sem biblioteca nova | `package.json`/`package-lock.json` estão fora do `allowedPaths` do Reversa; manter zero-dependência respeita a política e evita risco de supply-chain | recharts (exigiria liberar `package.json` no `reversa-config.json`), chart.js, d3 | 🟢 |
| D-02 | Extrair agregação para `src/lib/dashboard-metrics.ts` puro | Permite testar em Deno como `tests/consolidado.test.ts` e reaproveitar no gestor e no vendedor | manter cálculo inline na página | 🟢 |
| D-03 | Recorte por papel aplicado em duas camadas: RLS (já existente) + filtro explícito `.eq('criado_por', user.id)` para `VENDEDOR`/`SECRETARIA` | RLS já isola `VENDEDOR`; `SECRETARIA` tem leitura global por necessidade do pós-venda, então o dashboard restringe por consulta | criar Edge Function com escopo server-side (custo maior), endurecer RLS de `SECRETARIA` (quebraria o pós-venda) | 🟡 |
| D-04 | Papéis com visão geral (`GESTOR`, `AUDITOR`, `FINANCEIRO`) alternam "meu recorte" × "geral"; `VENDEDOR`/`SECRETARIA` só veem o próprio | Atende à resposta do `/reversa-clarify` | gestor sempre global ignorando recorte próprio | 🟡 |
| D-05 | Período padrão de abertura = mês corrente, com filtro (mês atual, mês anterior, intervalo) | Leitura gerencial imediata e comparável; mantém paridade com `consolidado` | ano corrente, histórico total | 🟡 |
| D-06 | Menu "Visão Geral" (`/dashboard`) passa a aparecer para todos os papéis | Requirements RF-01: todos acessam | manter restrito ao gestor | 🟢 |

## 4. Premissas

Nenhuma premissa herdada de `[DÚVIDA]` não resolvida — todas as dúvidas foram fechadas no `/reversa-clarify` de 2026-10-05.

| Premissa | Origem (`requirements.md` seção) | Risco se errada |
|----------|----------------------------------|-----------------|
| n/a | n/a | n/a |

## 5. Delta arquitetural

| Componente | Arquivo de origem no legado | Tipo de mudança | Resumo |
|------------|------------------------------|-----------------|--------|
| `dashboard-gerencial-relatorios` | `_reversa_sdd/sdd/dashboard-gerencial-relatorios.md#8. Design e Interface (UI States & Layout)` | componente-alterado | Ganha funil por etapa, comparativo lado a lado por vendedor e distribuição por categoria, com recorte por papel |
| `frontend-shell` (menu) | `_reversa_sdd/addenda/005-auditoria-primeiro-checklist-dashboard.md#Fontes` (`src/components/DashboardLayout.tsx`) | contrato-alterado | Item "Visão Geral" liberado para todos os papéis |
| `autenticacao-controle-acesso` | `_reversa_sdd/sdd/autenticacao-controle-acesso.md#11.1 Matriz de Acesso RBAC (Role-Based Access Control)` | regra-alterada | Recorte de leitura do dashboard definido por papel; nenhuma mudança de policy |

## 6. Delta no modelo de dados

- Resumo: **sem mudança de schema.** As policies de `vendas` e `comissoes` já liberam `SELECT` para `GESTOR`, `AUDITOR` e `FINANCEIRO`, e `perfis` já é legível por esses três (`supabase/migrations/20260909000001_postvenda_rls.sql`, `supabase/migrations/20260929000000_perfis_financeiro_select.sql`).
- Detalhe completo em: `_reversa_forward/009-dashboard-graficos-acesso/data-delta.md`

## 7. Delta de contratos externos

| Contrato | Tipo | Arquivo de detalhe |
|----------|------|--------------------|
| n/a | — | Esta feature não cria nem altera APIs, filas ou endpoints |

## 8. Plano de migração

1. Nenhuma migração de banco é necessária.
2. Deploy normal do frontend (build Next.js).
3. Feature é retrocompatível: o `/dashboard` continua funcionando para o gestor durante o rollout.

## 9. Riscos e mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Isolamento de `SECRETARIA` no dashboard ser apenas por filtro de consulta (RLS é amplo) | alto | média | Teste automatizado do recorte + comentário explícito no código; reavaliar Edge Function com escopo server-side se virar requisito de segurança rígido |
| `SECRETARIA`/`AUDITOR`/`FINANCEIRO` não lançam vendas e o "meu recorte" ficar vazio | baixo | alta | Estado vazio explicativo ("você não possui lançamentos próprios") na alternância |
| Performance da agregação client-side em janelas longas | médio | média | Consultas já filtram colunas; `useMemo` na agregação; opcionalmente limitar período no `select` |
| Gráficos SVG não acessíveis | médio | média | `aria-label`/`role` nos gráficos e tabela textual alternativa dos mesmos dados |
| Regressão no dashboard atual do gestor | médio | média | Preservar os cards e a tabela por curso atuais; charts são aditivos; `regression-watch.md` no coding |

## 10. Critério de pronto

- [ ] Todas as ações do `actions.md` marcadas `[X]`
- [ ] Testes Deno de `dashboard-metrics.ts` verdes (funil, volume, repasse, categoria, comparativo, filtro de período)
- [ ] `/dashboard` renderiza para os 5 papéis sem redirecionamento indevido
- [ ] Vendedor vê apenas o próprio recorte; papéis gerais alternam próprio × geral
- [ ] `regression-watch.md` gerado
- [ ] Re-extração reversa executada e sem regressão vermelha (recomendado, não obrigatório)

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-10-05 | Versão inicial gerada por `/reversa-plan` | reversa |
