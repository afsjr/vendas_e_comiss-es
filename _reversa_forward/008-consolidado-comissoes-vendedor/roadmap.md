# Roadmap: Consolidado de comissões por vendedor para pagamento

> Identificador: `008-consolidado-comissoes-vendedor`
> Data: `2026-09-29`
> Requirements: `_reversa_forward/008-consolidado-comissoes-vendedor/requirements.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Resumo da abordagem

Página client-side `/consolidado` (restrita a `GESTOR` e `FINANCEIRO`) que lê `comissoes` + `vendas` (`criado_por`, curso, aluno) + `perfis` e agrupa por vendedor. Uma camada de lógica pura (`src/lib/consolidado.ts`) calcula os totais por situação (A pagar/Previsto/Pago/Estornada) e monta o CSV. A RLS de `comissoes`/`vendas` já libera `FINANCEIRO`; falta apenas estender a policy de SELECT de `perfis` ao papel `FINANCEIRO` (nova migration). A baixa continua no `fechamento-mensal`; a tela só informa.

## 2. Princípios aplicados

`.reversa/principles.md` **não existe**. Nenhum conflito a registrar.

| Princípio | Como a feature se relaciona | Status |
|-----------|------------------------------|--------|
| n/a | Arquivo de princípios ausente | n/a |

## 3. Decisões técnicas

| ID | Decisão | Justificativa | Alternativas descartadas | Confidência |
|----|---------|----------------|--------------------------|-------------|
| D-01 | Agregação em função pura `src/lib/consolidado.ts`, reutilizada pela página e pelos testes | Testabilidade e clareza sem duplicar regra | lógica inline na page | 🟢 |
| D-02 | Leitura client-side via Supabase (RLS), sem Edge Function | Dados já legíveis por GESTOR/FINANCEIRO; feature é relatório | Edge Function com service role | 🟢 |
| D-03 | Nova migration só para incluir `FINANCEIRO` no SELECT de `perfis` | `comissoes`/`vendas` já incluem FINANCEIRO; `perfis` não (nome do vendedor faltaria) | server action com service role | 🟢 |
| D-04 | Vendedor = `vendas.criado_por`, nome via `perfis` | RN-01; `comissoes` não tem beneficiário | adicionar coluna `beneficiario_id` | 🟢 |
| D-05 | Filtrar por `comissoes.data_liberacao` | RN-04 (ciclo mensal) | `criado_em` | 🟢 |
| D-06 | Export CSV gerado no cliente | RN/RF-05; sem backend | endpoint de export | 🟢 |
| D-07 | Baixa permanece no `fechamento-mensal` | RN-05 | botão de baixa na tela | 🟢 |

## 4. Premissas

Nenhuma. O `requirements.md` chegou com **0 marcadores `[DÚVIDA]`**.

| Premissa | Origem (`requirements.md` seção) | Risco se errada |
|----------|----------------------------------|-----------------|
| — | — | — |

## 5. Delta arquitetural

| Componente | Arquivo de origem no legado | Tipo de mudança | Resumo |
|------------|------------------------------|-----------------|--------|
| `comissoes-livro-caixa` | `_reversa_sdd/sdd/comissoes-livro-caixa.md` | componente-novo | Visão consolidada por vendedor |
| `dashboard-gerencial-relatorios` | `src/app/dashboard/page.tsx` | componente-novo | Nova página `/consolidado` |
| `autenticacao-controle-acesso` | `supabase/migrations/20260909000001_postvenda_rls.sql` | delta-de-dados | Policy de SELECT de `perfis` passa a incluir `FINANCEIRO` |
| `frontend-shell` | `src/components/DashboardLayout.tsx` | contrato-alterado | Item de menu "Consolidado" |

## 6. Delta no modelo de dados

- Resumo das mudanças: **nenhuma tabela nova**; apenas a policy `Leitura gestor ou auditor` de `perfis` passa a incluir `FINANCEIRO`.
- Detalhe completo em: `_reversa_forward/008-consolidado-comissoes-vendedor/data-delta.md`

## 7. Delta de contratos externos

Nenhum contrato externo afetado (sem endpoint novo).

| Contrato | Tipo | Arquivo de detalhe |
|----------|------|--------------------|
| — | — | — |

## 8. Plano de migração

1. Criar a migration `supabase/migrations/20260929000000_perfis_financeiro_select.sql` (recria a policy de SELECT de `perfis` incluindo `FINANCEIRO`).
2. Criar `src/lib/consolidado.ts` (rótulos, agregação por vendedor, CSV).
3. Criar a página `src/app/consolidado/page.tsx` (filtro de período, tabela, drill-down, export).
4. Adicionar o item de menu "Consolidado" para `GESTOR` e `FINANCEIRO`.
5. Testes Deno da agregação/CSV em `tests/consolidado.test.ts`.

## 9. Riscos e mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| FINANCEIRO sem nome do vendedor (RLS de `perfis`) | alto | alto | Migration D-03 |
| Total da tela divergir do `fechamento-mensal` | alto | médio | Usar exatamente `LIBERADA_PAGAMENTO` como "A pagar" e validar no onboarding |
| Volume/lentidão na agregação client-side | baixo | baixo | Base do protótipo; agregar em memória |
| Vendedor acessar dados de outros por URL | alto | baixo | Guard de rota + RLS (VENDEDOR não lê todas as comissões) |

## 10. Critério de pronto

- [ ] Todas as ações do `actions.md` marcadas `[X]`
- [ ] Consolidado exibe "A pagar/Previsto/Pago/Estornada" por vendedor
- [ ] FINANCEIRO enxerga os nomes e os totais
- [ ] Export CSV funcionando
- [ ] `npx tsc --noEmit` sem erros e testes Deno passando
- [ ] `regression-watch.md` gerado

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-29 | Versão inicial gerada por `/reversa-plan` | reversa |
