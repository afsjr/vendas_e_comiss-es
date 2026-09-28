# Roadmap: Repasse previsto no dashboard do gestor

> Identificador: `007-dashboard-repasse-previsto`
> Data: `2026-09-28`
> Requirements: `_reversa_forward/007-dashboard-repasse-previsto/requirements.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Resumo da abordagem

Delta **exclusivamente client-side** na página `src/app/dashboard/page.tsx`. Adiciona um helper puro `fatorRepasse(categoria)` (Técnico = 1,00; Curso Livre = 1,00; Graduação = 0,36; demais = fora) e calcula o repasse previsto por venda sobre `valor_entrada`, usando o mesmo conjunto de vendas já carregado e a constante `APROVADAS` existente. O resultado aparece em três pontos: novo KPI na visão geral, coluna "Repasse previsto" na tabela de acompanhamento e valor por curso em "Desempenho por Curso". Não há tabela, endpoint ou dependência nova.

## 2. Princípios aplicados

`.reversa/principles.md` **não existe** neste projeto. Nenhum conflito a registrar.

| Princípio | Como a feature se relaciona | Status |
|-----------|------------------------------|--------|
| n/a | Arquivo de princípios ausente | n/a |

## 3. Decisões técnicas

| ID | Decisão | Justificativa | Alternativas descartadas | Confidência |
|----|---------|----------------|--------------------------|-------------|
| D-01 | Cálculo no cliente, reaproveitando os dados já carregados | A tela já traz `vendas` e `cursos`; evita consulta/Edge Function | view/segmento no banco, Edge Function | 🟢 |
| D-02 | Fatores fixos por categoria: Técnico 1,00, Curso Livre 1,00, Graduação 0,36; Pós fora | Regra do usuário (RN-01/RN-03) | percentual variável por curso | 🟢 |
| D-03 | Base `vendas.valor_entrada` | Único valor monetário da venda na V1 (DEC-01) | valor do curso (não persistido por venda) | 🟢 |
| D-04 | Escopo = constante `APROVADAS` já existente (`APROVADA`, `AGUARDANDO_FINANCEIRO`, `AGUARDANDO_PAGAMENTO_1M`, `PRIMEIRA_MENSALIDADE_PAGA`) | Mantém coerência com o KPI "Entradas" | incluir pendentes/devolvidas | 🟢 |
| D-05 | Adicionar `categoria` ao select de `cursos` | Hoje o dashboard seleciona só `cursos(nome)` | consulta extra por curso | 🟢 |

## 4. Premissas

Nenhuma. O `requirements.md` chegou com **0 marcadores `[DÚVIDA]`**.

| Premissa | Origem (`requirements.md` seção) | Risco se errada |
|----------|----------------------------------|-----------------|
| — | — | — |

## 5. Delta arquitetural

| Componente | Arquivo de origem no legado | Tipo de mudança | Resumo |
|------------|------------------------------|-----------------|--------|
| `dashboard-gerencial-relatorios` | `src/app/dashboard/page.tsx` | regra-alterada | Novo KPI "Repasse previsto", coluna por venda e valor por curso |

## 6. Delta no modelo de dados

- Resumo das mudanças: **nenhuma**. Cálculo derivado em memória sobre `vendas.valor_entrada` + `cursos.categoria`.
- Detalhe completo em: `_reversa_forward/007-dashboard-repasse-previsto/data-delta.md`

## 7. Delta de contratos externos

Nenhum contrato externo afetado (sem endpoint, fila ou tela nova).

| Contrato | Tipo | Arquivo de detalhe |
|----------|------|--------------------|
| — | — | — |

## 8. Plano de migração

n/a (sem alteração de dados ou schema).

## 9. Riscos e mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| `categoria` ausente no select e o cálculo cair em "fora" | alto | médio | Incluir `cursos(nome, categoria)` no select e testar cenário |
| Divergência entre o total previsto e o KPI "Entradas" | baixo | baixo | Reusar a mesma constante `APROVADAS` |
| Pós-Graduação aparecendo no total | médio | baixo | Fator `null` para categorias sem regra; cenário Gherkin cobre |

## 10. Critério de pronto

- [ ] Todas as ações do `actions.md` marcadas `[X]`
- [ ] KPI, coluna por venda e valor por curso exibindo o repasse previsto
- [ ] Pós-Graduação fora do total
- [ ] `npx tsc --noEmit` sem erros
- [ ] `regression-watch.md` gerado

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-28 | Versão inicial gerada por `/reversa-plan` | reversa |
