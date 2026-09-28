# Requirements: Repasse previsto no dashboard do gestor

> Identificador: `007-dashboard-repasse-previsto`
> Data: `2026-09-28`
> Pasta da extração reversa: `_reversa_sdd/`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA / DÚVIDA

## 1. Resumo executivo

Incluir no dashboard do GESTOR o **valor de repasse previsto** das vendas, calculado por categoria de curso: **integral (100%)** para **Técnico** e **Curso Livre**, e **36%** para **Graduação**. A métrica ajuda o gestor a enxergar, antes da conciliação do relatório, quanto o polo deve receber por venda, com total agregado na visão geral.

## 2. Contexto a partir do legado

| Fonte | Trecho relevante | Confidência |
|-------|------------------|-------------|
| `src/app/dashboard/page.tsx` | Dashboard do GESTOR com KPIs (`Entradas`, `Comissões`, `Pendentes`, `Aprovadas`), tabela de acompanhamento e "Desempenho por Curso" (ticket médio, aprovação, devolução). | 🟢 |
| `_reversa_sdd/addenda/005-auditoria-primeiro-checklist-dashboard.md` | O dashboard ganhou "desempenho por curso" e recomendações. | 🟢 |
| `_reversa_sdd/data-dictionary.md#cursos` | `cursos.categoria` ∈ `Técnico`, `Graduação`, `Pós-Graduação`, `Cursos Livres`. | 🟢 |
| `_reversa_sdd/decisions-gate.md#DEC-01` | Na V1, o sistema registra apenas a **entrada inicial** (`vendas.valor_entrada`); não há gestão de parcelas/recebíveis. | 🟢 |
| `_reversa_sdd/addenda/006-pre-auditoria-repasses.md` | Conceito de repasse ao polo; no relatório real o percentual observado foi 30% e 36% (Graduação). | 🟢 |
| `document (3).csv` (exemplo analisado na 006) | Coluna `% Repasse Provisao_Fixo` com 30/36 e `Valor_Repasse` por mensalidade. | 🟡 |

## 3. Personas e cenários de uso

| Persona | Objetivo | Cenário-chave |
|---------|----------|---------------|
| Roberto Gestor | Estimar o repasse devido ao polo antes da conciliação | Abre a Visão Geral e vê o KPI "Repasse previsto" e o valor por curso/venda |
| Roberto Gestor | Comparar repasse previsto com o repasse efetivamente repassado | Confronta o previsto com o resultado da pré-auditoria |

## 4. Regras de negócio novas ou alteradas

1. **RN-01:** O **repasse previsto** de uma venda é o valor base multiplicado por um fator de categoria: **Técnico = 100%**, **Curso Livre = 100%**, **Graduação = 36%**. 🟢
   - Origem no legado: `_reversa_sdd/data-dictionary.md#cursos`
   - Tipo: nova
2. **RN-02:** O valor base considerado é `vendas.valor_entrada` (único valor monetário da venda na V1). 🟢
   - Origem no legado: `_reversa_sdd/decisions-gate.md#DEC-01`
   - Tipo: nova
3. **RN-03:** Cursos de **Pós-Graduação** não têm fator definido nesta rodada e ficam **fora do cálculo** (não somam no total previsto). 🟢
   - Tipo: nova
4. **RN-04:** A métrica é **informativa** e não altera nenhum status de venda ou comissão. 🟢
   - Tipo: nova
5. **RN-05:** Entram no cálculo apenas as vendas em estado **aprovado/válido**, mesmo critério do "faturamento" atual: `APROVADA`, `AGUARDANDO_FINANCEIRO`, `AGUARDANDO_PAGAMENTO_1M`, `PRIMEIRA_MENSALIDADE_PAGA`. 🟢
   - Origem no legado: `src/app/dashboard/page.tsx` (constante `APROVADAS`)
   - Tipo: nova
6. **RN-06:** A métrica aparece em três lugares: **KPI "Repasse previsto"** na visão geral, **coluna por venda** na tabela de acompanhamento e **linha/valor por curso** em "Desempenho por Curso". 🟢
   - Tipo: nova

## 5. Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-01 | Exibir KPI "Repasse previsto" (total) na Visão Geral | Must | O card soma o repasse previsto das vendas consideradas e o apresenta em R$ | 🟢 |
| RF-02 | Calcular o repasse previsto por categoria | Must | Técnico/Livre = valor base × 1,00; Graduação = valor base × 0,36 | 🟢 |
| RF-03 | Exibir o repasse previsto por venda | Must | A tabela de acompanhamento mostra a coluna "Repasse previsto" por lançamento | 🟢 |
| RF-04 | Exibir o repasse previsto por curso | Must | A tabela "Desempenho por Curso" soma o repasse previsto por curso | 🟢 |
| RF-05 | Sinalizar o critério adotado | Should | A tela deixa claro o percentual aplicado por categoria (100% / 36%) | 🟡 |

## 6. Requisitos Não Funcionais

| Tipo | Requisito | Evidência ou justificativa | Confidência |
|------|-----------|----------------------------|-------------|
| Precisão | Cálculo monetário em ponto flutuante com arredondamento a 2 casas na exibição | Padrão do dashboard (`formatBRL`) | 🟢 |
| Desempenho | Cálculo no cliente sobre a lista já carregada, sem consulta extra | `dashboard/page.tsx` já carrega vendas e cursos | 🟢 |
| Consistência | Reusar o mesmo conjunto de vendas dos demais KPIs | Evita divergência de números na tela | 🟡 |

## 7. Critérios de Aceitação

```gherkin
Cenário: Repasse previsto por categoria
  Dado uma venda de Graduação com entrada de R$ 1.000,00
  E uma venda de Curso Livre com entrada de R$ 200,00
  Quando o dashboard calcula o repasse previsto
  Então a venda de Graduação soma R$ 360,00
  E a venda de Curso Livre soma R$ 200,00

Cenário: Total agregado
  Dado que existem vendas elegíveis de categorias diferentes
  Quando o gestor abre a Visão Geral
  Então o card "Repasse previsto" mostra a soma de todas as vendas consideradas

Cenário: Pós-Graduação fora do cálculo
  Dado uma venda de Pós-Graduação
  Quando o cálculo roda
  Então ela não contribui para o repasse previsto

Cenário: Sem vendas elegíveis
  Dado que não há vendas de Técnico, Curso Livre ou Graduação
  Quando o dashboard carrega
  Então o repasse previsto é exibido como R$ 0,00

Cenário: Somente vendas válidas entram no total
  Dado uma venda pendente de validação e uma venda aprovada
  Quando o dashboard calcula o repasse previsto
  Então apenas a venda aprovada contribui para o total
```

## 8. Prioridade MoSCoW

| Item | MoSCoW | Justificativa |
|------|--------|---------------|
| RF-01 KPI total | Must | Objetivo central pedido |
| RF-02 Fator por categoria | Must | Sem ele o valor fica errado |
| RF-03 Por venda | Must | Decisão do usuário: exibir também por venda |
| RF-04 Por curso | Must | Decisão do usuário: exibir também por curso |
| RF-05 Sinalizar critério | Should | Transparência do cálculo |

## 9. Esclarecimentos

### Sessão 2026-09-28

- **Q:** Qual a base do repasse previsto?
  **R:** `vendas.valor_entrada` (único valor da V1); Técnico/Livre = 100% e Graduação = 36%.
- **Q:** Quais vendas entram no total?
  **R:** Apenas vendas aprovadas/válidas (`APROVADA`, `AGUARDANDO_FINANCEIRO`, `AGUARDANDO_PAGAMENTO_1M`, `PRIMEIRA_MENSALIDADE_PAGA`), mesmo critério do faturamento atual.
- **Q:** Onde o repasse previsto aparece?
  **R:** KPI total na visão geral + coluna por venda + valor por curso.
- **Q:** Como tratar Pós-Graduação?
  **R:** Omitida do total (sem percentual definido).

## 10. Lacunas

> Nenhuma lacuna em aberto. Todos os pontos foram resolvidos na sessão de esclarecimento.

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-28 | Versão inicial gerada por `/reversa-requirements` | reversa |
| 2026-09-28 | Sessão de esclarecimentos: base `valor_entrada`, escopo de vendas válidas, exibição em KPI/venda/curso e Pós fora do total | reversa-clarify |
