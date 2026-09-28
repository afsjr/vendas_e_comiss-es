# Legacy Impact — Pré-auditoria de repasses de Graduação

> Identificador: `006-pre-auditoria-repasses`
> Data: `2026-09-28`
> Cenário: **greenfield** — sem legado pré-existente extraído de código. Âncora: `prd.md` + specs em `_reversa_sdd/sdd/`.
> Política de edição do legado no momento da execução: `allowLegacyEdits: true`; caminhos liberados: `src/app/**`, `src/components/**`, `src/lib/**`, `supabase/**`, `tests/**`.

## Arquivos afetados

| Arquivo afetado | Componente (spec SDD) | Tipo | Severidade | Justificativa |
|-----------------|-----------------------|------|------------|---------------|
| `supabase/migrations/20260928000000_pre_auditoria_repasses.sql` | `comissoes-livro-caixa` / `autenticacao-controle-acesso` | componente-novo | HIGH | Novas tabelas e RLS exclusiva de GESTOR para a pré-auditoria |
| `supabase/functions/_shared/repasse_parser.ts` | `auditoria-apontamentos` | componente-novo | MEDIUM | Parser CSV puro (Latin-1, cabeçalho repetido, valores pt-BR) |
| `supabase/functions/pre-auditoria-repasses/index.ts` | `auditoria-apontamentos` / `comissoes-livro-caixa` | componente-novo | HIGH | Importação/conciliação e liberação de comissão de Graduação |
| `src/app/pre-auditoria/page.tsx` | `dashboard-gerencial-relatorios` | componente-novo | MEDIUM | Tela GESTOR de upload e revisão em lote |
| `src/components/DashboardLayout.tsx` | `autenticacao-controle-acesso` | componente-novo | LOW | Item de menu restrito a GESTOR |
| `tests/pre_auditoria_repasses.test.ts` | `auditoria-apontamentos` | componente-novo | LOW | Cobertura do parser e das regras de conciliação |

## Diff conceitual por componente

- **`auditoria-apontamentos`**: o não-objetivo NG-03 ("sem conciliação automatizada") deixa de valer **apenas para Graduação com relatório CSV**. O fluxo manual de `/auditoria` permanece como fallback (sem alteração de código).
- **`comissoes-livro-caixa`**: a comissão de Graduação pode transitar para `LIBERADA_PAGAMENTO` por confirmação humana da pré-auditoria (parcela 1 da mensalidade repassada). Nenhuma alteração estrutural em `comissoes`.
- **`autenticacao-controle-acesso`**: nova superfície restrita a `GESTOR` (rota, tabelas, bucket), com validação server-side.
- **`dashboard-gerencial-relatorios`**: nova página de conferência, sem alterar telas existentes.

## Preservadas

> Feature greenfield, sem legado pré-existente extraído de código. Nada a listar.

## Modificadas

> Feature greenfield, sem regras 🟢 extraídas de código. As mudanças de regra (NG-03 e liberação por pré-auditoria) recaem sobre **specs** (`_reversa_sdd/sdd/`), não sobre código anterior.
