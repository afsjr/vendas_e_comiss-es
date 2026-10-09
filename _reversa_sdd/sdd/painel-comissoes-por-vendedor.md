# Spec: Painel de Comissões por Vendedor

**Versão:** 1.0
**Status:** Rascunho
**Autor:** reversa-spec-sdd
**Data:** 2026-10-09
**Reviewers:** N/A

---

## 1. Resumo

🟡 Este componente entrega ao gestor, auditor e financeiro uma visão, por vendedor, das comissões com sua situação (a receber ou paga) e a data de referência que explica a liberação. Ele existe para eliminar a dúvida "essa comissão já foi paga?" durante a conferência e o fechamento.

---

## 2. Contexto e Motivação

**Problema:**
🟡 No fechamento, o gestor/auditor/financeiro não enxerga, por vendedor, quais comissões estão a receber e quais já foram pagas, nem a data de referência (venda e início do curso) que justifica a liberação. A ausência da data de início do curso no apontamento embaralha a leitura.

**Evidências:**
🟡 O usuário relata a dor diretamente; o legado já possui o enum `status_comissao` e o campo `data_liberacao` (`_reversa_sdd/sdd/comissoes-livro-caixa.md`), mas não há tela que os apresente de forma consolidada por vendedor.

**Por que agora:**
🟡 O uso da data de início do curso passou a reger a liberação (`20261007000000_backfill_data_liberacao.sql`), tornando visível a lacuna de acompanhamento do pagamento.

---

## 3. Goals (Objetivos)

- [ ] 🟡 G-01: Mostrar, por vendedor, todas as comissões do período com situação legível.
- [ ] 🟡 G-02: Exibir a data de referência (criação da venda e início do curso) em cada comissão.
- [ ] 🟡 G-03: Totalizar valores a receber e pagos por vendedor no período selecionado.

**Métricas de sucesso:**

| Métrica | Baseline atual | Target | Prazo |
|---------|---------------|--------|-------|
| Comissões do mês com situação visível por vendedor | 0% | 100% | 3 meses |
| Tempo de conferência por vendedor | não medido | < 5 min por vendedor | 3 meses |

---

## 4. Non-Goals (Fora do Escopo)

- NG-01: 🟡 Não altera a regra de liberação por data de início do curso.
- NG-02: 🟡 Não permite editar valor, curso ou vendedor de uma comissão.
- NG-03: 🟡 Não integra com banco nem gera arquivo de remessa.
- NG-04: 🟡 Não executa a baixa de pagamento (componente `baixa-pagamento-comissoes`).

---

## 5. Usuários e Personas

**Usuário primário:** 🟡 Gestor/auditor/financeiro autenticado, com visão consolidada da equipe.
**Usuário secundário:** 🟡 Nenhum nesta entrega; o vendedor vê apenas a própria carteira, fora deste componente.

**Jornada atual (sem a feature):**
1. 🟡 Percorre planilhas/folhas de papel do fechamento.
2. 🟡 Confere manualmente venda por venda.
3. 🟡 Não consegue distinguir comissão liberada de comissão paga sem consultar terceiros.

**Jornada futura (com a feature):**
1. 🟡 Seleciona o vendedor e o período.
2. 🟡 Vê a lista com situação e data de referência.
3. 🟡 Lê os totais a receber e pagos.

---

## 6. Requisitos Funcionais

### 6.1 Requisitos Principais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | O sistema deve listar as comissões de um vendedor selecionado com curso, valor, situação e data de referência. | Must | Ao selecionar um vendedor, a lista exibe uma linha por comissão com as quatro colunas preenchidas. |
| RF-02 | O sistema deve exibir a situação de cada comissão conforme o enum `status_comissao` (`BLOQUEADA_AUDITORIA`, `AGUARDANDO_INICIO_AULAS`, `LIBERADA_PAGAMENTO`, `PAGA`, `ESTORNADA`). | Must | Cada comissão mostra o rótulo correspondente ao seu status. |
| RF-03 | O sistema deve exibir a data de criação da venda e a data de início do curso de cada comissão. | Must | As duas datas aparecem na linha da comissão. |
| RF-04 | O sistema deve permitir filtrar as comissões por período (mês ou intervalo) e por situação. | Must | Ao aplicar período e situação, a lista e os totais refletem apenas o recorte. |
| RF-05 | O sistema deve totalizar, por vendedor, os valores em `LIBERADA_PAGAMENTO` (a receber) e em `PAGA` (pagos) no período. | Must | Os dois totais aparecem e coincidem com a soma das linhas exibidas. |
| RF-06 | O usuário deve poder alternar entre a visão por vendedor e a visão consolidada de todos os vendedores. | Should | A alternância troca a agregação sem perder o período selecionado. |
| RF-07 | O sistema deve destacar comissões cuja data de início do curso esteja ausente. | Should | Comissões sem data de início do curso recebem marcação visual. |

### 6.2 Fluxo Principal (Happy Path)

1. 🟡 O usuário abre o painel de comissões.
2. 🟡 O sistema carrega a lista de vendedores e o período padrão (mês atual).
3. 🟡 O usuário seleciona um vendedor e confirma o período.
4. 🟡 O sistema exibe as comissões com situação, curso, valor, data da venda e data de início do curso.
5. 🟡 O sistema exibe os totais a receber e pagos do recorte.
6. 🟡 Resultado: o usuário identifica o que já foi pago e o que ainda falta pagar para aquele vendedor.

### 6.3 Fluxos Alternativos

**Fluxo Alternativo A — Vendedor sem comissões no período:**
1. 🟡 O usuário seleciona um vendedor sem comissões no período.
2. 🟡 O sistema exibe estado vazio com a mensagem "Nenhuma comissão no período" e totais zerados.

**Fluxo Alternativo B — Comissão sem data de início do curso:**
1. 🟡 O sistema encontra comissão com `data_inicio_curso` nula.
2. 🟡 O sistema exibe a linha com destaque e rótulo "sem data de início".

---

## 7. Requisitos Não-Funcionais

| ID | Requisito | Valor alvo | Observação |
|----|-----------|-----------|------------|
| RNF-01 | Performance | P95 < 1,5 s para carregar até 500 comissões | Consulta paginada |
| RNF-02 | Segurança | Autenticação obrigatória e leitura restrita por papel | RLS por `app_role` |
| RNF-03 | Acessibilidade | Rótulos textuais além da cor de situação | Não depender só de cor |
| RNF-04 | Consistência | Totais iguais à soma das linhas exibidas | Conferência |

---

## 8. Design e Interface

**Componentes afetados:** 🟡 Nova tela de painel de comissões e item de menu correspondente.

**Comportamento esperado:**
🟡 A tela apresenta seletor de vendedor, filtro de período e de situação, tabela de comissões e dois cartões de total (a receber e pago). Cada linha mostra curso, valor, situação, data da venda e data de início do curso.

**Estados da UI:**
- Estado vazio: 🟡 mensagem "Nenhuma comissão no período" com totais zerados.
- Estado de carregamento: 🟡 indicador de carregamento na tabela e nos cartões.
- Estado de erro: 🟡 mensagem "Não foi possível carregar as comissões" com ação de tentar novamente.
- Estado de sucesso: 🟡 tabela e cartões preenchidos com os dados do recorte.

---

## 9. Modelo de Dados

🟡 Sem novas tabelas. Leitura das existentes:

```
comissoes {
  id: uuid
  venda_id: uuid          // vínculo com a venda
  valor_comissao: numeric
  status: status_comissao // enum do legado
  data_liberacao: timestamptz
}

vendas {
  id: uuid
  criado_por: uuid        // vendedor
  criado_em: timestamptz   // data da venda
  data_inicio_curso: date  // data de referência da liberação
}
```

**Migrações necessárias:** Não nesta entrega.

---

## 10. Integrações e Dependências

| Dependência | Tipo | Impacto se indisponível |
|-------------|------|------------------------|
| Supabase PostgREST | Obrigatória | Painel exibe estado de erro |
| Enum `status_comissao` do legado | Obrigatória | Sem ele não há rótulo de situação |

---

## 11. Edge Cases e Tratamento de Erros

| Cenário | Trigger | Comportamento esperado |
|---------|---------|----------------------|
| EC-01: Período sem comissões | Nenhuma comissão no recorte | Estado vazio e totais zerados |
| EC-02: Data de início do curso ausente | `data_inicio_curso` nula | Linha destacada com rótulo "sem data de início" |
| EC-03: Volume alto de comissões | Mais de 500 linhas | Paginação ou limite com aviso do total |
| EC-04: Falha de consulta | Erro do PostgREST | Mensagem de erro com ação de tentar novamente |
| EC-05: Vendedor sem perfil | `criado_por` sem registro em `perfis` | Exibir identificador e rótulo "vendedor sem perfil" |

---

## 12. Segurança e Privacidade

- **Autenticação:** 🟡 Apenas usuários autenticados.
- **Autorização:** 🟡 Gestor, auditor e financeiro veem o consolidado; o vendedor não é usuário deste componente.
- **Dados sensíveis:** 🟡 Dados financeiros de comissão; não expor CPF ou dados do aluno na lista.
- **Auditoria:** 🟡 Apenas leitura; sem log de alteração neste componente.

---

## 13. Plano de Rollout

- **Estratégia:** 🟡 Liberação por papel; sem flag para os perfis administrativos.
- **Como reverter (rollback):** 🟡 Ocultar o item de menu e a rota, restaurando o estado anterior.
- **Monitoramento pós-deploy:** 🟡 Observar erros de consulta e tempo de carregamento nas primeiras 48 h.

---

## 14. Open Questions

| # | Pergunta | Impacto | Dono | Prazo |
|---|---------|---------|------|-------|
| OQ-01 | 🟡 A data de referência exibida deve ser a data da venda, a data de início do curso ou ambas? | Médio | adelino | 2026-10-16 |
| OQ-02 | 🟡 O painel deve separar visão "a receber" e "pagas" em abas ou em uma única lista com filtro? | Baixo | adelino | 2026-10-16 |

---

## 15. Decisões Tomadas (Decision Log)

| Decisão | Alternativas consideradas | Racional |
|---------|--------------------------|---------|
| 🟡 Reusar o enum `status_comissao` do legado | Criar novo conjunto de rótulos | Mantém consistência com o livro-caixa |
| 🟡 Focar no gestor/auditor/financeiro | Incluir o vendedor | A dor relatada é da gestão; o vendedor tem a própria carteira |

---

## Apêndice

### Referências
- 🟡 `_reversa_sdd/sdd/comissoes-livro-caixa.md`
- 🟡 `_reversa_sdd/prd.md`

### Histórico de Revisões
| Versão | Data | Autor | Mudanças |
|--------|------|-------|---------|
| 1.0 | 2026-10-09 | reversa-spec-sdd | Criação inicial |

---

## Relatório de Avaliação (spec_scorer)

```
SCORE TOTAL: 100.0/100 — ⭐ Excelente — Pronta para implementação

Completude:    100% (peso 30%)
Testabilidade: 100% (peso 25%)
Clareza:       100% (peso 20%)
Escopo:        100% (peso 15%)
Edge Cases:    100% (peso 10%)

Gaps críticos: nenhum
Sugestões: nenhuma
```
