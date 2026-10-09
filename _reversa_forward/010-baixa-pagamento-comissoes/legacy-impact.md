# Legacy Impact: Visibilidade e baixa de pagamento de comissões

> Identificador: `010-baixa-pagamento-comissoes`
> Data: `2026-10-09`
> Âncora de contexto: **greenfield** (`_reversa_sdd/prd.md` + specs em `_reversa_sdd/sdd/`). A extração de legado não produziu `architecture.md`/`domain.md`.
> Política de edição no momento da execução: `allowLegacyEdits: true`; `allowedPaths` liberou `src/app/**`, `src/middleware.ts`, `src/components/**`, `src/lib/**`, `supabase/**`, `tests/**`.

## 1. Arquivos afetados

| Arquivo afetado | Componente (spec de origem) | Tipo | Severidade | Justificativa |
|-----------------|------------------------------|------|------------|----------------|
| `supabase/migrations/20261009000001_comissoes_data_pagamento.sql` | `sdd/baixa-pagamento-comissoes.md` | componente-novo | LOW | Adiciona `comissoes.data_pagamento` (aditivo) |
| `supabase/migrations/20261009000002_registrar_pagamento_comissoes.sql` | `sdd/baixa-pagamento-comissoes.md` | componente-novo | MEDIUM | RPC transacional de baixa (SECURITY DEFINER) |
| `src/lib/comissoes-pagamento.ts` | `sdd/painel-comissoes-por-vendedor.md` | componente-novo | LOW | Agregação pura e helpers |
| `src/middleware.ts` | `sdd/acesso-por-papel-comissoes.md` | contrato-alterado | MEDIUM | Nova regra `/comissoes` no RBAC de rota |
| `src/app/actions/comissoes.ts` | `sdd/baixa-pagamento-comissoes.md` | componente-novo | MEDIUM | Server action que valida papel e chama a RPC |
| `supabase/functions/relatorio-repasse/index.ts` | `sdd/relatorio-repasse-pdf.md` | componente-novo | LOW | Geração do PDF de repasse |
| `src/app/comissoes/page.tsx` | `sdd/painel-comissoes-por-vendedor.md` | componente-novo | LOW | Painel, filtros, baixa e relatório |
| `src/components/DashboardLayout.tsx` | `sdd/acesso-por-papel-comissoes.md` | componente-alterado | LOW | Item de menu "Comissões" |
| `tests/comissoes_pagamento.test.ts` | `sdd/painel-comissoes-por-vendedor.md` | componente-novo | LOW | Testes Deno da lib (12 casos) |

## 2. Diff conceitual por componente

- **Comissões (dados):** o modelo ganha `data_pagamento` e a função `registrar_pagamento_comissoes`, que transita `LIBERADA_PAGAMENTO` → `PAGA` e insere lançamento no livro-caixa (append-only), no mesmo padrão de `processar_fechamento_mensal`. A baixa deixa de depender de loop na aplicação.
- **Acesso (RBAC):** a rota `/comissoes` passa a ser restrita a `GESTOR`, `AUDITOR` e `FINANCEIRO` no middleware; `VENDEDOR` e `SECRETARIA` não têm acesso a comissões.
- **Painel de comissões:** nova tela lê `comissoes` + `vendas` + `cursos` + `perfis`, agrega por vendedor em lib pura e oferece filtros, baixa e geração de PDF.

## 3. Preservadas

- Sem regras extraídas de `domain.md` (ausente). Nada foi removido do legado.

## 4. Modificadas

- `src/middleware.ts`: matriz `ROUTE_ROLES` ampliada (aditivo, não altera regras existentes).
- `src/components/DashboardLayout.tsx`: novo item de menu (aditivo).

## 5. Observações

- Cenário de âncora greenfield, mas o repositório contém código de app pré-existente; por isso dois arquivos são marcados como alterados, não novos.
- `livro_caixa_lancamentos` permanece append-only; a feature apenas insere.

## 6. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-10-09 | Versão inicial gerada por `/reversa-coding` | reversa |
