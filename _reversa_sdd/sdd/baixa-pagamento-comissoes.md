# Spec: Baixa de Pagamento de Comissões

**Versão:** 1.0
**Status:** Rascunho
**Autor:** reversa-spec-sdd
**Data:** 2026-10-09
**Reviewers:** N/A

---

## 1. Resumo

🟡 Este componente permite que o gestor, auditor ou financeiro marque comissões conferidas como pagas, transitando-as de `LIBERADA_PAGAMENTO` para `PAGA` e registrando o lançamento de pagamento no livro-caixa em uma única transação. Existe para dar fim à dúvida sobre o que já foi pago e evitar pagamento em duplicidade.

---

## 2. Contexto e Motivação

**Problema:**
🟡 Sem uma baixa explícita, uma comissão liberada pode ser paga novamente em um fechamento seguinte, e não há registro de quando saiu do estado "a receber" para "paga".

**Evidências:**
🟡 O legado já prevê o fluxo de baixa mensal em `_reversa_sdd/sdd/comissoes-livro-caixa.md` e a função `processar_fechamento_mensal` (migração `20261008000003`) encapsula a baixa em transação atômica.

**Por que agora:**
🟡 A liberação passou a depender da data de início do curso, aumentando o volume de comissões elegíveis que precisam de baixa controlada.

---

## 3. Goals (Objetivos)

- [ ] 🟡 G-01: Marcar comissões selecionadas como pagas em uma ação única.
- [ ] 🟡 G-02: Registrar o pagamento no livro-caixa sem deixar o status e o lançamento descompassados.
- [ ] 🟡 G-03: Impedir baixa duplicada da mesma comissão.

**Métricas de sucesso:**

| Métrica | Baseline atual | Target | Prazo |
|---------|---------------|--------|-------|
| Pagamentos em duplicidade | não medido | 0 ocorrências por período | 3 meses |
| Baixas com lançamento consistente no livro-caixa | não medido | 100% das baixas | 3 meses |

---

## 4. Non-Goals (Fora do Escopo)

- NG-01: 🟡 Não integra com banco nem gera remessa.
- NG-02: 🟡 Não altera o valor de comissão calculado.
- NG-03: 🟡 Não permite pagamento parcial de uma comissão.
- NG-04: 🟡 Não executa estorno de comissão paga (fluxo do livro-caixa).

---

## 5. Usuários e Personas

**Usuário primário:** 🟡 Gestor/auditor/financeiro autenticado que efetiva o pagamento.
**Usuário secundário:** 🟡 Nenhum.

**Jornada atual (sem a feature):**
1. 🟡 Anota no papel o que pagou.
2. 🟡 Não há registro que impeça pagar de novo.
3. 🟡 O livro-caixa e o status divergem com o tempo.

**Jornada futura (com a feature):**
1. 🟡 Seleciona as comissões conferidas.
2. 🟡 Confirma a baixa.
3. 🟡 O sistema marca como pagas e registra no livro-caixa.

---

## 6. Requisitos Funcionais

### 6.1 Requisitos Principais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | O usuário deve poder selecionar uma ou mais comissões em `LIBERADA_PAGAMENTO` e solicitar a baixa. | Must | A seleção habilita a ação "marcar como pago". |
| RF-02 | O sistema deve alterar o status das comissões selecionadas para `PAGA`. | Must | Após a baixa, o status exibido é `PAGA`. |
| RF-03 | O sistema deve criar um lançamento `PAGAMENTO_COMISSAO` de débito no livro-caixa para cada comissão paga. | Must | Existe um lançamento por comissão baixada, com o valor correspondente. |
| RF-04 | O sistema deve executar a baixa em transação atômica, revertendo tudo em caso de falha. | Must | Uma falha simulada no meio não altera status nem cria lançamento parcial. |
| RF-05 | O sistema deve recusar a baixa de comissões que não estejam em `LIBERADA_PAGAMENTO`. | Must | Comissões em `PAGA` ou `ESTORNADA` não entram na baixa. |
| RF-06 | O sistema deve registrar quem executou a baixa e o instante da execução. | Should | O lançamento ou a comissão registra autor e data/hora. |
| RF-07 | O sistema deve solicitar confirmação explícita antes de efetivar a baixa. | Should | A baixa só ocorre após a confirmação do usuário. |

### 6.2 Fluxo Principal (Happy Path)

1. 🟡 O usuário seleciona comissões em `LIBERADA_PAGAMENTO` no painel.
2. 🟡 O usuário aciona "marcar como pago".
3. 🟡 O sistema exibe o total selecionado e pede confirmação.
4. 🟡 O usuário confirma.
5. 🟡 O sistema transita as comissões para `PAGA` e cria os lançamentos `PAGAMENTO_COMISSAO`.
6. 🟡 Resultado: as comissões deixam de aparecer como "a receber".

### 6.3 Fluxos Alternativos

**Fluxo Alternativo A — Seleção com comissão já paga:**
1. 🟡 O recorte inclui comissão já `PAGA`.
2. 🟡 O sistema ignora a comissão não elegível e informa quantas foram efetivamente baixadas.

**Fluxo Alternativo B — Falha durante a baixa:**
1. 🟡 O sistema encontra erro ao criar um lançamento.
2. 🟡 O sistema reverte toda a operação e informa que nenhuma comissão foi baixada.

---

## 7. Requisitos Não-Funcionais

| ID | Requisito | Valor alvo | Observação |
|----|-----------|-----------|------------|
| RNF-01 | Atomicidade | 100% ou nada | Transação única |
| RNF-02 | Segurança | Autorização por papel gestor/auditor/financeiro | RLS e função com privilégio restrito |
| RNF-03 | Idempotência | Baixa repetida não duplica lançamento | Verificação de status antes de gravar |
| RNF-04 | Performance | Baixa de até 200 comissões em < 3 s | Operação em bloco |

---

## 8. Design e Interface

**Componentes afetados:** 🟡 Ação de baixa acoplada ao painel de comissões.

**Comportamento esperado:**
🟡 O usuário seleciona linhas elegíveis, aciona "marcar como pago", vê um resumo com quantidade e valor total e confirma. Após a baixa, as linhas mudam para "paga" sem recarregar a página inteira.

**Estados da UI:**
- Estado vazio: 🟡 nenhuma linha selecionada, ação desabilitada.
- Estado de carregamento: 🟡 indicador durante a baixa.
- Estado de erro: 🟡 mensagem "Não foi possível concluir a baixa; nada foi alterado".
- Estado de sucesso: 🟡 confirmação com a quantidade de comissões baixadas.

---

## 9. Modelo de Dados

🟡 Sem novas tabelas. Efeitos:

```
comissoes.status: LIBERADA_PAGAMENTO -> PAGA
livro_caixa_lancamentos {
  id: uuid
  comissao_id: uuid
  tipo: 'PAGAMENTO_COMISSAO'  // débito
  valor_credito: numeric
  descricao: text
  criado_em: timestamptz
}
```

**Migrações necessárias:** 🟡 Reutiliza a função `processar_fechamento_mensal` ou equivalente transacional; nenhuma tabela nova.

---

## 10. Integrações e Dependências

| Dependência | Tipo | Impacto se indisponível |
|-------------|------|------------------------|
| Função transacional no Supabase | Obrigatória | Sem baixa parcial; operação não efetiva |
| Tabela `livro_caixa_lancamentos` | Obrigatória | Baixa abortada |

---

## 11. Edge Cases e Tratamento de Erros

| Cenário | Trigger | Comportamento esperado |
|---------|---------|----------------------|
| EC-01: Comissão já paga em outra sessão | Status muda para `PAGA` entre seleção e confirmação | Recusar a linha e informar quantas foram baixadas |
| EC-02: Falha no meio da transação | Erro ao gravar lançamento | Reverter tudo; nenhuma comissão fica baixada |
| EC-03: Seleção vazia | Nenhuma comissão marcada | Ação desabilitada |
| EC-04: Comissão estornada | Status `ESTORNADA` | Linha não elegível para baixa |
| EC-05: Valor de comissão nulo | `valor_comissao` ausente | Bloquear a baixa daquela linha com aviso |

---

## 12. Segurança e Privacidade

- **Autenticação:** 🟡 Apenas usuários autenticados.
- **Autorização:** 🟡 Somente gestor, auditor e financeiro podem dar baixa.
- **Dados sensíveis:** 🟡 Dados financeiros; escrita restrita via função com privilégio elevado.
- **Auditoria:** 🟡 Registrar autor e instante da baixa para rastreabilidade.

---

## 13. Plano de Rollout

- **Estratégia:** 🟡 Habilitar a ação para os papéis administrativos após validação em produção controlada.
- **Como reverter (rollback):** 🟡 Ocultar a ação de baixa; comissões permanecem em `LIBERADA_PAGAMENTO`.
- **Monitoramento pós-deploy:** 🟡 Observar erros de transação e lançamentos órfãos nas primeiras 48 h.

---

## 14. Open Questions

| # | Pergunta | Impacto | Dono | Prazo |
|---|---------|---------|------|-------|
| OQ-01 | 🟡 A baixa deve registrar uma data de pagamento própria distinta de `data_liberacao`? | Médio | adelino | 2026-10-16 |
| OQ-02 | 🟡 É necessário anexar comprovante bancário à baixa? | Médio | adelino | 2026-10-16 |

---

## 15. Decisões Tomadas (Decision Log)

| Decisão | Alternativas consideradas | Racional |
|---------|--------------------------|---------|
| 🟡 Baixa em transação atômica | Loop de atualizações na aplicação | Evita status e lançamento descompassados |
| 🟡 Reusar lançamento `PAGAMENTO_COMISSAO` | Criar novo tipo | Consistência com o livro-caixa |

---

## Apêndice

### Referências
- 🟡 `_reversa_sdd/sdd/comissoes-livro-caixa.md`
- 🟡 `supabase/migrations/20261008000003_processar_fechamento_mensal.sql`

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
