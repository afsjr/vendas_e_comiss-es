# Requirements: Visibilidade e baixa de pagamento de comissões

> Identificador: `010-baixa-pagamento-comissoes`
> Data: `2026-10-09`
> Pasta da extração reversa: `_reversa_sdd/`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA / DÚVIDA

## 1. Resumo executivo

Entrega ao gestor, auditor e financeiro uma visão, por vendedor, das comissões com situação (a receber ou paga) e data de referência, permitindo marcar comissões conferidas como pagas e gerar um relatório de repasse em PDF para conferência. Resolve a dor do fechamento em que não se sabe, sem consultar terceiros, o que já foi pago e o que ainda falta pagar.

## 2. Contexto a partir do legado

| Fonte | Trecho relevante | Confidência |
|-------|------------------|-------------|
| `_reversa_sdd/sdd/comissoes-livro-caixa.md#4` | Fluxo de baixa mensal: comissões `LIBERADA_PAGAMENTO` transitam para `PAGA` com lançamento no livro-caixa | 🟢 |
| `_reversa_sdd/sdd/comissoes-livro-caixa.md#G-02` | Liberação condicionada a venda `APROVADA` e `data_inicio_curso <= data_atual` | 🟢 |
| `_reversa_sdd/data-dictionary.md#status_comissao_enum` | Enum `status_comissao` com 5 estados | 🟢 |
| `_reversa_sdd/data-dictionary.md#comissoes` | Campos `valor_comissao`, `status_comissao`, `liberada_em`, `paga_em`; RLS por beneficiário | 🟢 |
| `_reversa_sdd/data-dictionary.md#livro_caixa_lancamentos` | Tipo `PAGAMENTO_COMISSAO`; tabela append-only | 🟢 |
| `_reversa_sdd/inventory.md#6-schema-de-banco-superficial` | RLS baseada em `app_metadata.app_role` e `sub` | 🟢 |
| `_reversa_sdd/personas.md#Persona-1` | Persona gestor/auditor/financeiro e sua jornada de conferência e baixa | 🟡 |
| `_reversa_sdd/sdd/painel-comissoes-por-vendedor.md#6` | Requisitos do painel por vendedor | 🟡 |
| `_reversa_sdd/sdd/baixa-pagamento-comissoes.md#6` | Requisitos da baixa transacional | 🟡 |
| `_reversa_sdd/sdd/relatorio-repasse-pdf.md#6` | Requisitos do relatório PDF | 🟡 |
| `_reversa_sdd/sdd/acesso-por-papel-comissoes.md#6` | Requisitos de autorização por papel | 🟡 |

## 3. Personas e cenários de uso

| Persona | Objetivo | Cenário-chave |
|---------|----------|---------------|
| Gestor/auditor/financeiro | Pagar a comissão correta, ao vendedor certo, sem duplicar | No fechamento, confere por vendedor o que está a receber e o que já foi pago, dá baixa e gera o relatório de repasse |
| Vendedor (a montante) | Ter a própria produção registrada | Origem do dado; não é usuário desta feature, permanece restrito à própria carteira |

## 4. Regras de negócio novas ou alteradas

1. **RN-01:** Uma comissão só pode ser baixada (paga) quando estiver em `LIBERADA_PAGAMENTO`; a baixa a transita para `PAGA`. 🟢
   - Origem no legado: `_reversa_sdd/sdd/comissoes-livro-caixa.md#4`
   - Tipo: nova (comportamento ainda não disponível na interface)
2. **RN-02:** Toda baixa gera um lançamento `PAGAMENTO_COMISSAO` (débito) no livro-caixa; o livro-caixa é append-only. 🟢
   - Origem no legado: `_reversa_sdd/data-dictionary.md#livro_caixa_lancamentos`
   - Tipo: nova
3. **RN-03:** A liberação da comissão depende da data de início do curso (`data_inicio_curso <= data atual`), condição herdada do legado. 🟢
   - Origem no legado: `_reversa_sdd/sdd/comissoes-livro-caixa.md#G-02`
   - Tipo: alterada (passa a ser exibida na conferência)
4. **RN-04:** A baixa é executada em transação atômica: ou todas as comissões selecionadas são baixadas com seus lançamentos, ou nenhuma é. 🟡
   - Origem no legado: `_reversa_sdd/data-dictionary.md#comissoes`
   - Tipo: nova
5. **RN-05:** A visão consolidada de comissões e a baixa são permitidas apenas a `GESTOR`, `AUDITOR` e `FINANCEIRO`; `VENDEDOR` permanece restrito à própria carteira. 🟢
   - Origem no legado: `_reversa_sdd/inventory.md#6-schema-de-banco-superficial`
   - Tipo: alterada (amplia a matriz de acesso para a nova visão)

## 5. Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-01 | O sistema deve listar as comissões de um vendedor com curso, valor, situação e data de referência | Must | Selecionar um vendedor exibe uma linha por comissão com os quatro campos | 🟡 |
| RF-02 | O sistema deve exibir a situação de cada comissão conforme o enum `status_comissao` | Must | Cada comissão mostra o rótulo do seu status | 🟢 |
| RF-03 | O sistema deve exibir a data da venda e a data de início do curso de cada comissão | Must | As duas datas aparecem na linha da comissão | 🟡 |
| RF-04 | O sistema deve filtrar as comissões por período e por situação | Must | O recorte aplicado reflete na lista e nos totais | 🟡 |
| RF-05 | O sistema deve totalizar, por vendedor, os valores a receber e pagos no período | Must | Os totais coincidem com a soma das linhas exibidas | 🟡 |
| RF-06 | O usuário deve poder marcar comissões em `LIBERADA_PAGAMENTO` como pagas | Must | Após a baixa, o status exibido é `PAGA` | 🟢 |
| RF-07 | O sistema deve criar um lançamento `PAGAMENTO_COMISSAO` no livro-caixa para cada comissão baixada | Must | Existe um lançamento por comissão baixada com o valor correspondente | 🟢 |
| RF-08 | O sistema deve recusar a baixa de comissões que não estejam em `LIBERADA_PAGAMENTO` | Must | Comissões em `PAGA` ou `ESTORNADA` não entram na baixa | 🟢 |
| RF-09 | O sistema deve gerar um relatório de repasse em PDF por período e vendedor, com totais | Must | O PDF é gerado com as comissões e totais do recorte | 🟡 |
| RF-10 | O sistema deve permitir baixar o relatório de repasse gerado | Should | O arquivo é baixado com nome que identifica o período | 🟡 |
| RF-11 | O sistema deve restringir a visão consolidada e a baixa a gestor, auditor e financeiro | Must | Papel não autorizado recebe acesso negado | 🟢 |
| RF-12 | O sistema deve destacar comissões sem data de início do curso | Should | Comissões sem data recebem marcação visual | 🟡 |

## 6. Requisitos Não Funcionais

| Tipo | Requisito | Evidência ou justificativa | Confidência |
|------|-----------|----------------------------|-------------|
| Desempenho | Carregar até 500 comissões em P95 < 1,5 s e baixar até 200 em < 3 s | Volume estimado do fechamento | 🟡 |
| Consistência | Baixa atômica e idempotente: repetir a baixa não duplica lançamento | Evita pagamento em duplicidade | 🟢 |
| Segurança | Autenticação obrigatória e autorização por papel na rota e no banco | Defesa em profundidade | 🟢 |
| Privacidade | Não expor CPF nem dados do aluno no painel e no relatório | LGPD | 🟡 |
| Observabilidade | Registrar quem deu a baixa, quando, e negativas por papel | Auditoria | 🟡 |
| Acessibilidade | Situação indicada por texto além da cor | Conferência em tela e impressa | 🟡 |

## 7. Critérios de Aceitação

```gherkin
Cenário: Conferir o que já foi pago por vendedor
  Dado que sou gestor autenticado
  Quando seleciono um vendedor e o período do mês
  Então vejo a lista de comissões com situação e data de referência
  E vejo os totais a receber e pagos do recorte

Cenário: Dar baixa em comissões conferidas
  Dado que selecionei comissões em LIBERADA_PAGAMENTO
  Quando confirmo a baixa
  Então as comissões passam para PAGA
  E cada uma gera um lançamento PAGAMENTO_COMISSAO no livro-caixa

Cenário: Gerar relatório de repasse
  Dado que escolhi período e vendedor
  Quando gero o relatório
  Então recebo um PDF com as comissões e os totais do recorte

Cenário negativo: Baixa sem elegibilidade
  Dado que selecionei uma comissão já PAGA
  Quando tento dar baixa
  Então a comissão é recusada e nenhum lançamento é criado para ela

Cenário negativo: Acesso indevido
  Dado que sou vendedor
  Quando tento abrir a visão consolidada
  Então sou redirecionado com aviso de acesso negado

Cenário negativo: Falha durante a baixa
  Dado que a gravação de um lançamento falha
  Quando confirmo a baixa
  Então nenhuma comissão é alterada
  E recebo uma mensagem de erro com ação de tentar novamente
```

## 8. Prioridade MoSCoW

| Item | MoSCoW | Justificativa |
|------|--------|---------------|
| RF-01 a RF-08, RF-09, RF-11 | Must | Sem visão, baixa e acesso correto a dor central não é resolvida |
| RF-10, RF-12 | Should | Melhoram a conferência, mas o núcleo funciona sem eles |
| RNF de desempenho | Should | Relevante no fechamento, ajustável depois |
| RNF de segurança e consistência | Must | Envolvem dinheiro e prevenção de pagamento em duplicidade |

## 9. Esclarecimentos

> Nenhuma sessão de dúvidas registrada ainda. Rode `/reversa-clarify` quando houver `[DÚVIDA]` pendente.

## 10. Lacunas

- 🔴 [DÚVIDA] Divergência de nomenclatura entre `_reversa_sdd/data-dictionary.md#comissoes` (`liberada_em`/`paga_em`, `tipo_lancamento`/`historico`) e o schema atual em uso (`data_liberacao`, `status`, `tipo`/`descricao`): qual é o canônico?
- 🔴 [DÚVIDA] A baixa deve registrar uma data de pagamento própria (equivalente a `paga_em`) distinta de `data_liberacao` e permitir anexar comprovante bancário?
- 🔴 [DÚVIDA] O papel `SECRETARIA` deve ter alguma visão de comissões ou permanece apenas em vendas/pós-venda?

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-10-09 | Versão inicial gerada por `/reversa-requirements` | reversa |
