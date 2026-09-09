# Requirements: Kanban de Pós-Venda

> Identificador: `003-kanban-pos-venda`
> Data: `2026-08-12`
> Pasta da extração reversa: `_reversa_sdd/`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA / DÚVIDA

## 1. Resumo executivo

Adição de novos status operacionais na entidade de Venda e criação de uma interface em estilo Kanban para os setores de Secretaria e Financeiro. O objetivo é registrar e amarrar a passagem de bastão das tarefas de pós-venda (contrato assinado, boletos gerados e enviados), condicionando a aprovação final e pagamento de comissões à efetivação financeira da primeira mensalidade, usando travas sistêmicas contra preenchimento falso.

## 2. Contexto a partir do legado

| Fonte | Trecho relevante | Confidência |
|-------|------------------|-------------|
| `_reversa_sdd/inventory.md#2` | Sistema legado possui frontend em Next.js (App Router) e backend Axum com Supabase (Postgres). | 🟢 |
| `_reversa_sdd/inventory.md#6` | Tabela `vendas` e `vendas_historico_status` controlam ciclo de vida da venda; `comissoes` cuida do financeiro comercial. RLS presente. | 🟢 |
| `_reversa_sdd/inventory.md#9` | Módulos a alterar: `vendas` (tabela estendida), `auth/rls` (papéis Secretaria/Financeiro) e `frontend-dashboard` (novas filas). | 🟢 |

## 3. Personas e cenários de uso

| Persona | Objetivo | Cenário-chave |
|---------|----------|---------------|
| Secretaria | Validar documentação e contrato | Acessa a fila de vendas novas, confere se o aluno enviou os dados, faz upload/cola o link do contrato e passa pro Financeiro. |
| Financeiro | Emitir cobrança e validar pgto | Recebe venda validada pela Secretaria, emite boletos no banco externo e, quando aluno pagar a 1ª parcela, libera no sistema para comissionamento. |
| Vendedor | Acompanhar comissão | Consulta o status da venda para saber por que sua comissão ainda não foi liberada (se está travado no contrato ou boleto). |
| Gerência/Auditor | Aprovar comissão | Vê a venda já concluída no pós-venda, verifica e aprova o pagamento final para o Vendedor. |

## 4. Regras de negócio novas ou alteradas

1. **RN-01:** O ciclo de vida da Venda ganha novas etapas obrigatórias: *Aguardando Secretaria*, *Aguardando Financeiro* e *Aguardando Pgto 1ª Mensalidade*. 🟢
   - Tipo: alterada
2. **RN-02:** A aprovação e pagamento da comissão do Vendedor ficam **condicionados** à conclusão da etapa de confirmação de pagamento da 1ª mensalidade pelo Financeiro. 🟢
   - Tipo: nova
3. **RN-03:** A movimentação de uma etapa para a outra nas filas da Secretaria e Financeiro exige **trava sistêmica obrigatoria** (como preencher um link válido ou anexo), registrando também a responsabilidade de quem moveu (audit-log). 🟢
   - Tipo: nova

## 5. Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-01 | Fila Kanban Secretaria | Must | O perfil Secretaria deve ter uma tela listando vendas novas. Ao concluir, deve preencher o Link do Contrato para a venda ir pro Financeiro. | 🟢 |
| RF-02 | Fila Kanban Financeiro | Must | O perfil Financeiro recebe vendas da Secretaria, emite os boletos (externo) e muda o status para 'Aguardando Pagamento'. | 🟢 |
| RF-03 | Confirmação de Pgto | Must | O Financeiro deve poder alterar o status da venda para '1ª Mensalidade Paga', o que destrava a Venda para auditoria/aprovação de comissão. | 🟢 |
| RF-04 | RLS Estrito para Filas | Must | Usuários só podem enxergar as filas e alterar status se possuírem o Role (Secretaria ou Financeiro) via RLS do Supabase. | 🟢 |
| RF-05 | Histórico de Ações | Must | Cada mudança de coluna do Kanban deve gravar quem alterou e a data no `vendas_historico_status`. | 🟢 |

## 6. Requisitos Não Funcionais

| Tipo | Requisito | Evidência ou justificativa | Confidência |
|------|-----------|----------------------------|-------------|
| Segurança | Controle de Acesso (RLS) | Secretaria não pode aprovar venda (ação da Gerência). O banco deve recusar mutações cross-role. | 🟢 |
| Usabilidade | Feedback visual de travas | A interface (Next.js) não deve habilitar o botão de mover o card se a regra de trava (arquivo/link obrigatório) não for atendida. | 🟡 |

## 7. Critérios de Aceitação

```gherkin
Cenário: Secretaria processa nova venda
  Dado que o vendedor cadastrou uma Venda nova
  Quando a Secretaria acessa o Kanban e tenta mover o card para "Aguardando Financeiro" sem preencher o Link do Contrato
  Então o sistema bloqueia a ação e exibe mensagem exigindo o comprovante/link
  E quando a Secretaria preenche o link e confirma
  Então o card some da visão da Secretaria e aparece na visão do Financeiro

Cenário: Comissão travada antes do pagamento do aluno
  Dado que uma venda está com a Secretaria ou Financeiro
  Quando o Gerente tenta aprovar o pagamento da comissão desta venda
  Então o sistema avisa que a comissão só poderá ser avaliada/paga após a 1ª mensalidade ser quitada
```

## 8. Prioridade MoSCoW

| Item | MoSCoW | Justificativa |
|------|--------|---------------|
| RF-01 a RF-05 | Must | Sem essas funções, a passagem de bastão não existe e o objetivo central (trava antifraude) falha. |
| Regras RLS | Must | O legado depende da segurança a nível de banco para não corromper histórico de vendas. |
| Integração API Bancária | Won't Have | O usuário explicitou que NÃO quer geração nativa de boleto/arquivo retorno. O sistema apenas "sinaliza". |
| Chat / SMS Interno | Won't Have | Foi definido como não-objetivo na ideação. |

## 9. Esclarecimentos

> Nenhuma sessão de dúvidas registrada ainda. Rode `/reversa-clarify` quando houver `[DÚVIDA]` pendente.

## 10. Lacunas

- 🔴 [DÚVIDA] O que acontece sistemicamente se um aluno desistir na etapa de contrato da Secretaria? Existe um botão "Cancelar Venda" na fila da Secretaria, ou ela deve devolver para o vendedor?
- 🔴 [DÚVIDA] O que exatamente a Secretaria/Financeiro deverá preencher para "assumir a responsabilidade"? Apenas um campo de texto onde colam um link do Drive/Trello, ou seria o upload de um arquivo PDF para o bucket `comprovantes` do Supabase?
- 🔴 [DÚVIDA] Considerando que vamos colocar essas travas para novas vendas, o que fazemos com as vendas ativas atuais que já estão faturadas/rolando? Elas devem receber um status especial (ex: "Legado-Isento") para não trancarem a tela gerencial?

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-08-12 | Versão inicial gerada por `/reversa-requirements` | reversa |
