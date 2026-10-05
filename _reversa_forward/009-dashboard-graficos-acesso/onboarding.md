# Onboarding: como testar o Dashboard visual (feature 009)

> Identificador: `009-dashboard-graficos-acesso`
> Data: `2026-10-05`
> Objetivo: um humano testar a feature pela primeira vez do zero.

## 1. Pré-requisitos

- Node.js ≥ 18.17 e dependências instaladas (`npm install`).
- Projeto Supabase configurado (`.env.local` com `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
- Ao menos 5 usuários no Supabase, um por papel: `GESTOR`, `VENDEDOR`, `SECRETARIA`, `AUDITOR`, `FINANCEIRO`.
- Dados de teste: algumas vendas em etapas variadas e ao menos duas comissões de vendedores diferentes.

## 2. Subir o ambiente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

## 3. Roteiro de verificação

### 3.1 Gestor (visão geral + lado a lado)

1. Faça login como `GESTOR`.
2. Abra **Visão Geral** (`/dashboard`).
3. Confirme: funil por etapa, cards de volume (entradas, comissões, repasse) e comparativo **lado a lado** por vendedor.
4. Selecione um vendedor e confirme que os gráficos passam a refletir só as vendas dele.
5. Volte para "geral" e confirme que os totais consolidam todos.

### 3.2 Vendedor (apenas o próprio)

1. Faça login como `VENDEDOR`.
2. Abra **Visão Geral** (`/dashboard`) — não deve redirecionar ao login.
3. Confirme que o funil e os volumes consideram apenas as vendas dele.
4. Confirme que a lista/comparativo de outros vendedores **não** aparece.

### 3.3 Secretaria (apenas o próprio, via filtro de consulta)

1. Faça login como `SECRETARIA`.
2. Abra o dashboard e confirme o recorte restrito aos lançamentos dela.
3. No DevTools → Network, inspecione a query enviada ao Supabase e confirme o filtro `criado_por`.

### 3.4 Auditor e Financeiro (próprio × geral)

1. Faça login como `AUDITOR` e depois como `FINANCEIRO`.
2. Confirme a visão geral consolidada e a possibilidade de alternar para "meu recorte".
3. Se o papel não lançou vendas, confirme a mensagem de estado vazio.

### 3.5 Filtro de período

1. Em qualquer papel, alterne entre **mês atual**, **mês anterior** e **intervalo personalizado**.
2. Confirme que gráficos e cards recalculam sem recarregar a página inteira.

### 3.6 Acessibilidade e estados

1. Confirme rótulos textuais/legenda nos gráficos (não depender só de cor).
2. Simule ausência de dados no período e confirme a mensagem neutra.
3. Simule erro de consulta (ex.: rede offline) e confirme o aviso com opção de tentar novamente.

## 4. Testes automatizados

```bash
deno test --allow-read tests/dashboard_metrics.test.ts
```

Cobrem: agrupamento do funil, volume acumulado, repasse por categoria, distribuição por categoria, comparativo por vendedor e filtro de período.

## 5. Rollback

Feature aditiva e sem migração. Reverter o frontend (dashboard/menu) restaura o comportamento anterior sem impacto em dados.

## 6. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-10-05 | Versão inicial gerada por `/reversa-plan` | reversa |
