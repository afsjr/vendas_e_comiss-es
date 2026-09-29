# Investigation — Consolidado de comissões por vendedor para pagamento

> Identificador: `008-consolidado-comissoes-vendedor`
> Data: `2026-09-29`
> Objetivo: registrar a pesquisa de fundo e as alternativas antes do plano.

## 1. Modelo de comissão hoje

- `comissoes`: `venda_id` (1:1), `valor_comissao`, `status`, `data_liberacao`, `criado_em` (`supabase/migrations/001_schema.sql`). **Não há coluna de beneficiário** — o vendedor é `vendas.criado_por`.
- `status_comissao_enum`: `AGUARDANDO_INICIO_AULAS`, `LIBERADA_PAGAMENTO`, `PAGA`, `BLOQUEADA_AUDITORIA`, `ESTORNADA`.
- `vendas.criado_por` é imutável (trigger) e o mesmo valor é usado pelas policies de `comissoes`.

## 2. Fluxo de pagamento

- `supabase/functions/fechamento-mensal/index.ts`: seleciona comissões `LIBERADA_PAGAMENTO`, grava `livro_caixa_lancamentos` (CRÉDITO) e muda para `PAGA`.
- `/carteira` (`src/app/carteira/page.tsx`): extrato individual do vendedor (PAGA e LIBERADA_PAGAMENTO). Não há visão por todos os vendedores.

## 3. RLS relevante

- `comissoes` SELECT: VENDEDOR/SECRETARIA (próprias), AUDITOR, GESTOR e **FINANCEIRO** (`20260909000001_postvenda_rls.sql`).
- `vendas` SELECT: idem, com FINANCEIRO.
- `perfis` SELECT: apenas GESTOR e AUDITOR (`20260924000001_fix_perfis_rls_appmetadata.sql`) → **lacuna** para o Financeiro ler nomes.

## 4. Alternativas avaliadas

| Tema | Alternativa A | Alternativa B | Escolha | Motivo |
|------|---------------|---------------|---------|--------|
| Leitura dos dados | client-side + RLS | Edge Function com service role | **client-side** | ambos os papéis já leem; relatório simples |
| Nome do vendedor | migration em `perfis` | server action com service role | **migration** | menor superfície e reusa RLS |
| Agregação | lib pura `src/lib/consolidado.ts` | inline na página | **lib pura** | testável em Deno |
| Export | CSV no cliente | endpoint | **cliente** | sem backend |

## 5. Padrões do projeto

- Páginas GESTOR-only já usam `useUser` + guard de rota (ex.: `/dashboard`, `/pre-auditoria`).
- Formatação `formatBRL`; testes Deno em `tests/*.test.ts`.
- Migrations delta não editam `001_schema.sql`.

## 6. Restrições

- "A pagar" deve ser exatamente `LIBERADA_PAGAMENTO` para bater com o `fechamento-mensal`.
- A tela é informativa; não disparar baixa (RN-05).
