# Roadmap: Data de início do curso — fallback de exibição e obrigatoriedade no cadastro

> Identificador: `011-data-inicio-curso`
> Data: `2026-10-09`
> Requirements: `_reversa_forward/011-data-inicio-curso/requirements.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Resumo da abordagem

Delta pequeno e cirúrgico sobre a feature 010. No painel `/comissoes`, quando `data_inicio_curso` estiver nula, a coluna passa a exibir a **data da venda** com um selo "via data da venda"; adiciona-se um helper puro em `src/lib/comissoes-pagamento.ts` para essa regra, testável em Deno. No banco, uma migração **backfilla** os registros históricos nulos com `vendas.criado_em::date` e outra adiciona a constraint `CHECK (data_inicio_curso IS NOT NULL) NOT VALID`, que vale para inserções futuras sem invalidar o histórico. As validações de cadastro na UI (`vendas/novo`, `cadastro-unificado`) e na Edge Function `vendas` **já existem** e permanecem; nenhuma dependência nova.

## 2. Princípios aplicados

`_reversa_sdd/` não possui `.reversa/principles.md` ativo; nenhum princípio formal a validar.

| Princípio | Como a feature se relaciona | Status |
|-----------|------------------------------|--------|
| (nenhum princípio formal registrado) | — | n/a |

## 3. Decisões técnicas

| ID | Decisão | Justificativa | Alternativas descartadas | Confidência |
|----|---------|----------------|--------------------------|-------------|
| D-01 | Fallback + selo apenas no painel `/comissoes` | Escopo definido no clarify (Q4) | aplicar em auditoria/pós-venda/PDF | 🟢 |
| D-02 | Helper puro `dataInicioExibicao` em `src/lib/comissoes-pagamento.ts` | Reusa o padrão de lib pura já testada | lógica inline na página | 🟡 |
| D-03 | Constraint `CHECK (data_inicio_curso IS NOT NULL) NOT VALID` | Impede novos registros nulos sem exigir backfill para valer | `NOT NULL` (exige backfill), trigger BEFORE INSERT | 🟡 |
| D-04 | Migração de backfill com `criado_em::date` | Preenche histórico para leitura direta | manter nulos e só exibir fallback | 🟡 |
| D-05 | Manter as validações já existentes (UI + Edge Function) | Já bloqueiam envio sem data; sem mudança de código | reimplementar validação | 🟢 |
| D-06 | Fallback é só de exibição; não altera a liberação da comissão | Resposta do clarify (Q2) | usar data da venda na regra de liberação | 🟢 |

## 4. Premissas

Nenhuma premissa herdada de `[DÚVIDA]` não resolvida — as três dúvidas foram fechadas no `/reversa-clarify` de 2026-10-09.

| Premissa | Origem (`requirements.md` seção) | Risco se errada |
|----------|----------------------------------|-----------------|
| n/a | n/a | n/a |

## 5. Delta arquitetural

| Componente | Arquivo de origem no legado | Tipo de mudança | Resumo |
|------------|------------------------------|-----------------|--------|
| Painel de comissões | `src/app/comissoes/page.tsx` (feature 010) | regra-alterada | Coluna "Início do curso" exibe fallback + selo |
| Lib de comissões | `src/lib/comissoes-pagamento.ts` (feature 010) | regra-nova | Helper puro `dataInicioExibicao` |
| Banco (`vendas`) | `_reversa_sdd/data-dictionary.md#vendas` | delta-de-dados | Backfill de nulos + constraint CHECK NOT VALID |

## 6. Delta no modelo de dados

- Resumo das mudanças: sem novas colunas; backfill de `vendas.data_inicio_curso` e constraint `CHECK NOT VALID`.
- Detalhe completo em: `_reversa_forward/011-data-inicio-curso/data-delta.md`

## 7. Delta de contratos externos

| Contrato | Tipo | Arquivo de detalhe |
|----------|------|--------------------|
| n/a (sem contrato externo novo) | — | — |

## 8. Plano de migração

1. Migration `backfill_vendas_data_inicio_curso`: `UPDATE vendas SET data_inicio_curso = criado_em::date WHERE data_inicio_curso IS NULL`.
2. Migration `vendas_data_inicio_curso_check`: `ALTER TABLE vendas ADD CONSTRAINT vendas_data_inicio_curso_not_null CHECK (data_inicio_curso IS NOT NULL) NOT VALID`.
3. Frontend: helper na lib + coluna no painel (código já entra pelo `/reversa-coding`).
4. Nenhuma mudança na UI/Edge Function de cadastro (validações já existentes).

## 9. Riscos e mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Backfill alterar semântica de registros históricos | médio | baixa | Documentar a origem (data da venda) e manter o selo de fallback na leitura de nulos |
| `CHECK NOT VALID` não proteger updates | baixo | baixa | Foco é insert; avaliar validação futura da constraint após backfill |
| Sobreposição com a feature 010 (mesma tela) | baixo | média | Delta mínimo e isolado; sem regressão nas colunas existentes |

## 10. Critério de pronto

- [ ] Todas as ações do `actions.md` marcadas `[X]`
- [ ] `cross-check.md` (se executado) sem CRITICAL nem HIGH
- [ ] `regression-watch.md` gerado
- [ ] Re-extração reversa executada e sem regressão vermelha (recomendado, não obrigatório)

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-10-09 | Versão inicial gerada por `/reversa-plan` | reversa |
