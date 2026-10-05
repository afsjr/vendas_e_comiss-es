# Investigation: Dashboard visual — funil, volume acumulado e acesso por papel

> Identificador: `009-dashboard-graficos-acesso`
> Data: `2026-10-05`
> Requirements: `_reversa_forward/009-dashboard-graficos-acesso/requirements.md`

## 1. Pergunta de investigação

Como adicionar gráficos visuais (funil por etapa e volume financeiro acumulado) ao dashboard, com visão por papel (vendedor restrito ao próprio; gestor e demais papéis com visão geral e lado a lado por vendedor), sem violar a política de escrita do Reversa nem introduzir risco desnecessário?

## 2. Estado atual do código (fontes)

| Fonte | O que revela |
|-------|--------------|
| `src/app/dashboard/page.tsx` | Dashboard atual é exclusivo do `GESTOR` (guarda `role !== 'GESTOR'` na linha 60); já busca `vendas`, `comissoes` e `perfis`, e calcula cards, tabela por curso e recomendações — tudo inline |
| `src/components/DashboardLayout.tsx:24` | Item "Visão Geral" (`/dashboard`) tem `roles: ['GESTOR']` |
| `src/hooks/useUser.ts:13` | Papel lido de `session.user.app_metadata.app_role`; retorna `role` |
| `src/lib/consolidado.ts` | Padrão de lib pura de agregação, testada em `tests/consolidado.test.ts` (Deno) |
| `supabase/migrations/20260909000001_postvenda_rls.sql` | Policies de `vendas`/`comissoes`: `VENDEDOR` vê só o próprio; `SECRETARIA` vê tudo; `AUDITOR`/`GESTOR`/`FINANCEIRO` veem tudo |
| `supabase/migrations/20260929000000_perfis_financeiro_select.sql` | `perfis` legível por `GESTOR`, `AUDITOR`, `FINANCEIRO` |
| `package.json` | Sem biblioteca de gráficos instalada; `package.json`/`package-lock.json` fora do `allowedPaths` |
| `_reversa_sdd/dependencies.md#Frontend` | O legado original declarava uma biblioteca de gráficos (recharts ^2.14.1) que não existe no projeto atual |
| `_reversa_sdd/sdd/dashboard-gerencial-relatorios.md#6. Requisitos Funcionais (RF-XX)` | RF-01 (KPIs), RF-05 (categoria), RF-06 (filtros), RF-10 (mini-dashboard do vendedor) — spec planejada do componente |

## 3. Alternativas avaliadas

### 3.1 Biblioteca de gráficos (recharts)

- **Prós:** rápida de montar; o legado já a previa; visual polido.
- **Contras:** exige instalar dependência e editar `package.json`/`package-lock.json`, ambos fora do `allowedPaths` do `.reversa/reversa-config.json`; liberar escrita nesses arquivos é ato exclusivo do usuário; adiciona dependência de runtime.
- **Veredito:** descartada nesta rodada.

### 3.2 Gráficos SVG próprios (escolhida)

- **Prós:** zero dependência; dentro de `allowedPaths` (`src/components/**`); controle total do visual com Tailwind; funciona no mesmo padrão de componentes já existente; testável na parte pura.
- **Contras:** mais código de desenho (coordenadas SVG, arcos de donut, escalas).
- **Escopo de desenho:** funil por etapa (barras verticais proporcionais), comparativo por vendedor (barras horizontais agrupadas lado a lado) e categorias (rosca/arcos ou barras). Cada gráfico acompanha rótulos e uma tabela/resumo textual equivalente para acessibilidade.

### 3.3 CSS puro (divs com largura percentual)

- **Prós:** muito simples.
- **Contras:** limita o funil e a rosca; pior para "lado a lado" com escala comum.
- **Veredito:** parcialmente incorporável (cards/volume), mas insuficiente para todos os gráficos.

## 4. Padrões aplicáveis

- **Lib pura + testes Deno:** replicar o padrão de `src/lib/consolidado.ts` + `tests/consolidado.test.ts`.
- **Guarda de rota por papel no cliente:** replicar o padrão de `src/app/consolidado/page.tsx:40` (array de acesso + redirect), agora invertido para "todos os papéis autenticados".
- **Recorte de dados por papel:** combinar RLS existente com filtro explícito na consulta para o caso `SECRETARIA` (RLS amplo).

## 5. Fontes externas

- Documentação do Next.js 14 (App Router) e `useMemo` para agregação no cliente: já usada no projeto.
- Padrões de acessibilidade para gráficos (rótulos textuais + alternativa tabular). Sem dependência externa.

## 6. Conclusão

Seguir com **SVG próprio + lib pura de métricas**, aplicando o recorte por papel em duas camadas e reaproveitando os padrões já existentes no projeto. Sem migração de banco e sem dependência nova.

## 7. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-10-05 | Versão inicial gerada por `/reversa-plan` | reversa |
