# Legacy Impact — Consolidado de comissões por vendedor para pagamento

> Identificador: `008-consolidado-comissoes-vendedor`
> Data: `2026-09-29`
> Cenário: **greenfield** — sem legado pré-existente extraído de código. Âncora: `prd.md` + specs em `_reversa_sdd/sdd/`.
> Política de edição do legado: `allowLegacyEdits: true`; caminhos liberados usados: `src/app/**`, `src/components/**`, `src/lib/**`, `supabase/**`, `tests/**`.

## Arquivos afetados

| Arquivo afetado | Componente (spec SDD) | Tipo | Severidade | Justificativa |
|-----------------|-----------------------|------|------------|---------------|
| `supabase/migrations/20260929000000_perfis_financeiro_select.sql` | `autenticacao-controle-acesso` | delta-de-dados | MEDIUM | Policy de SELECT de `perfis` passa a incluir `FINANCEIRO` |
| `src/lib/consolidado.ts` | `comissoes-livro-caixa` | componente-novo | MEDIUM | Agregação pura por vendedor, período e CSV |
| `src/app/consolidado/page.tsx` | `dashboard-gerencial-relatorios` | componente-novo | MEDIUM | Tela de consolidado por vendedor (GESTOR/FINANCEIRO) |
| `src/components/DashboardLayout.tsx` | `autenticacao-controle-acesso` | componente-novo | LOW | Item de menu "Consolidado" |
| `tests/consolidado.test.ts` | `comissoes-livro-caixa` | componente-novo | LOW | Cobertura da agregação/CSV |

## Diff conceitual por componente

- **`comissoes-livro-caixa`**: nova visão consolidada por vendedor (`vendas.criado_por`), com "A pagar" = `LIBERADA_PAGAMENTO`, alinhada ao que o `fechamento-mensal` processa. Nenhuma alteração no ciclo de status.
- **`dashboard-gerencial-relatorios`**: nova página `/consolidado`; telas existentes intactas.
- **`autenticacao-controle-acesso`**: `FINANCEIRO` passa a ler `perfis` (nomes) — necessário porque `comissoes`/`vendas` já liberavam o papel.

## Preservadas

> Feature greenfield, sem legado pré-existente extraído de código. Nada a listar.

## Modificadas

> Sem regras 🟢 extraídas de código. O delta recai sobre as specs `_reversa_sdd/sdd/comissoes-livro-caixa.md` (visão por vendedor) e `_reversa_sdd/sdd/autenticacao-controle-acesso.md` (leitura de `perfis` pelo FINANCEIRO).
