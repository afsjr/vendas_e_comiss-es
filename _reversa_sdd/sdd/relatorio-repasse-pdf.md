# Spec: Relatório de Repasse (PDF)

**Versão:** 1.0
**Status:** Rascunho
**Autor:** reversa-spec-sdd
**Data:** 2026-10-09
**Reviewers:** N/A

---

## 1. Resumo

🟡 Este componente gera um relatório em PDF, por período e vendedor, com as comissões e seus valores, para conferência e uso no repasse bancário manual. Existe para dar ao financeiro um documento fechado do que será pago.

---

## 2. Contexto e Motivação

**Problema:**
🟡 Hoje o repasse é montado à mão, a partir de anotações, sem um documento padronizado que reúna o que foi pago no ciclo.

**Evidências:**
🟡 O usuário pediu explicitamente a geração de relatórios para repassar ao pagamento bancário; o PRD registra a decisão de o formato ser "PDF para conferência".

**Por que agora:**
🟡 Com a baixa de pagamento implementada, falta o documento que fecha o ciclo de conferência.

---

## 3. Goals (Objetivos)

- [ ] 🟡 G-01: Gerar um PDF de conferência com as comissões do período e vendedor selecionados.
- [ ] 🟡 G-02: Apresentar totais por vendedor e total geral do recorte.
- [ ] 🟡 G-03: Permitir baixar ou salvar o PDF gerado.

**Métricas de sucesso:**

| Métrica | Baseline atual | Target | Prazo |
|---------|---------------|--------|-------|
| Fechamento sem planilha manual | não | sim | 3 meses |
| Tempo de geração do PDF | não medido | < 10 s para até 500 comissões | 3 meses |

---

## 4. Non-Goals (Fora do Escopo)

- NG-01: 🟡 Não gera arquivo CNAB nem layout bancário específico.
- NG-02: 🟡 Não integra com o banco nem transmite o arquivo.
- NG-03: 🟡 Não assina digitalmente o documento.
- NG-04: 🟡 Não envia o PDF por e-mail automaticamente.

---

## 5. Usuários e Personas

**Usuário primário:** 🟡 Gestor/auditor/financeiro que prepara o repasse.
**Usuário secundário:** 🟡 Nenhum.

**Jornada atual (sem a feature):**
1. 🟡 Reúne anotações do que foi pago.
2. 🟡 Monta uma planilha manual.
3. 🟡 Envia a planilha para o pagamento.

**Jornada futura (com a feature):**
1. 🟡 Seleciona período e vendedor.
2. 🟡 Gera o PDF.
3. 🟡 Baixa o documento para conferência e repasse.

---

## 6. Requisitos Funcionais

### 6.1 Requisitos Principais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | O usuário deve poder gerar um PDF informando o período e o vendedor (ou todos). | Must | O PDF é gerado para o recorte selecionado. |
| RF-02 | O sistema deve listar no PDF as comissões com vendedor, curso, valor e data de referência. | Must | Cada comissão aparece com os quatro campos. |
| RF-03 | O sistema deve incluir os totais por vendedor e o total geral do recorte. | Must | Os totais no PDF coincidem com a soma das comissões listadas. |
| RF-04 | O usuário deve poder escolher incluir somente comissões `PAGA` ou também as `LIBERADA_PAGAMENTO`. | Must | O PDF respeita o filtro de situação escolhido. |
| RF-05 | O sistema deve identificar no PDF o período, a data de emissão e o autor. | Must | O cabeçalho do PDF contém período, data e autor. |
| RF-06 | O sistema deve permitir baixar o PDF gerado. | Should | O arquivo é baixado com nome que identifica o período. |
| RF-07 | O sistema deve permitir reemitir o PDF do mesmo recorte. | Could | Gerar novamente produz o mesmo conteúdo para os mesmos dados. |

### 6.2 Fluxo Principal (Happy Path)

1. 🟡 O usuário abre a opção "gerar relatório de repasse".
2. 🟡 O usuário escolhe o período, o vendedor (ou todos) e a situação.
3. 🟡 O sistema monta o documento com as comissões e os totais.
4. 🟡 O sistema devolve o PDF para download.
5. 🟡 O usuário confere e baixa o arquivo.
6. 🟡 Resultado: o financeiro tem o documento do repasse do período.

### 6.3 Fluxos Alternativos

**Fluxo Alternativo A — Período sem comissões:**
1. 🟡 O recorte não retorna comissões.
2. 🟡 O sistema informa que não há dados e não gera o PDF.

**Fluxo Alternativo B — Somente vendedor específico:**
1. 🟡 O usuário escolhe um vendedor.
2. 🟡 O PDF traz apenas as comissões e totais daquele vendedor.

---

## 7. Requisitos Não-Funcionais

| ID | Requisito | Valor alvo | Observação |
|----|-----------|-----------|------------|
| RNF-01 | Performance | Geração em < 10 s para até 500 comissões | Processamento no servidor |
| RNF-02 | Segurança | Autorização por papel gestor/auditor/financeiro | PDF não expõe dados de aluno |
| RNF-03 | Legibilidade | Fonte mínima de 10 pt e colunas alinhadas | Conferência impressa |
| RNF-04 | Rastreabilidade | Cabeçalho com período, data de emissão e autor | Reconhecimento do documento |

---

## 8. Design e Interface

**Componentes afetados:** 🟡 Ação "gerar relatório" no painel de comissões e serviço de geração de PDF.

**Comportamento esperado:**
🟡 O usuário escolhe o recorte, aciona gerar e recebe o arquivo. Enquanto gera, vê um indicador; em caso de falha, vê uma mensagem de erro.

**Estados da UI:**
- Estado vazio: 🟡 recorte sem comissões, sem geração.
- Estado de carregamento: 🟡 indicador durante a geração.
- Estado de erro: 🟡 mensagem "Não foi possível gerar o relatório".
- Estado de sucesso: 🟡 link/arquivo para download.

---

## 9. Modelo de Dados

🟡 Sem novas tabelas. O relatório lê `comissoes`, `vendas`, `cursos` e `perfis`.

**Migrações necessárias:** Não.

---

## 10. Integrações e Dependências

| Dependência | Tipo | Impacto se indisponível |
|-------------|------|------------------------|
| Biblioteca de geração de PDF | Obrigatória | Geração indisponível |
| Supabase (leitura dos dados) | Obrigatória | Relatório não gerado |

---

## 11. Edge Cases e Tratamento de Erros

| Cenário | Trigger | Comportamento esperado |
|---------|---------|----------------------|
| EC-01: Período sem comissões | Recorte vazio | Não gerar PDF; informar ausência de dados |
| EC-02: Volume alto de comissões | Mais de 500 linhas | Gerar em blocos com aviso de possível demora |
| EC-03: Comissão sem data de referência | `data_inicio_curso` nula | Exibir campo vazio e nota no rodapé |
| EC-04: Falha na geração | Erro da biblioteca | Mensagem de erro e nova tentativa |
| EC-05: Período inválido | Data final antes da inicial | Bloquear a geração com aviso |

---

## 12. Segurança e Privacidade

- **Autenticação:** 🟡 Apenas usuários autenticados.
- **Autorização:** 🟡 Gestor, auditor e financeiro.
- **Dados sensíveis:** 🟡 Dados financeiros; não incluir CPF ou dados do aluno.
- **Auditoria:** 🟡 Registrar quem gerou e quando, no cabeçalho do documento.

---

## 13. Plano de Rollout

- **Estratégia:** 🟡 Habilitar a opção para os papéis administrativos.
- **Como reverter (rollback):** 🟡 Ocultar a ação de geração.
- **Monitoramento pós-deploy:** 🟡 Observar falhas de geração e tempo de resposta nas primeiras 48 h.

---

## 14. Open Questions

| # | Pergunta | Impacto | Dono | Prazo |
|---|---------|---------|------|-------|
| OQ-01 | 🟡 O PDF deve ser persistido em storage para reimpressão posterior? | Médio | adelino | 2026-10-16 |
| OQ-02 | 🟡 O relatório deve ter um layout de assinatura/conferência específico da escola? | Baixo | adelino | 2026-10-16 |

---

## 15. Decisões Tomadas (Decision Log)

| Decisão | Alternativas consideradas | Racional |
|---------|--------------------------|---------|
| 🟡 Formato PDF para conferência | CSV ou layout CNAB | Usuário pediu PDF; sem integração com banco |
| 🟡 Cálculo dos totais no servidor | Cálculo no cliente | Evita divergência e melhora rastreabilidade |

---

## Apêndice

### Referências
- 🟡 `_reversa_sdd/prd.md`
- 🟡 `_reversa_sdd/sdd/comissoes-livro-caixa.md`

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
