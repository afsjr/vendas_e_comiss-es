# PRD: Comissionamento e Vendas — Visibilidade e baixa de pagamento de comissões

> Selo 🟡 PLANEJADO. Documento gerado a partir de ideation + personas.

**Versão:** 1.0
**Data:** 2026-10-09T13:11:51Z
**Autor:** reversa-drafter
**Status:** rascunho

---

## 1. Problema

🟡 No momento de apontar a comissão para pagamento, gestor, auditor e financeiro não sabem quais comissões já foram pagas e quais ainda não, porque não existe sinalização visível de **quando** a venda/curso ocorreu (referência temporal) nem de **se** a comissão já foi paga. A ausência da data de início do curso no apontamento do vendedor embaralha a distinção entre comissão liberada e comissão efetivamente paga. A dor se concentra no apontamento/liberação para pagamento, não no lançamento da venda.

### Quem sente
🟡 O gestor, o auditor e o financeiro, no momento de conferir, liberar e programar o pagamento das comissões da equipe — tipicamente no fechamento do mês, em dúvidas pontuais ("essa comissão já foi paga?") e na montagem do repasse bancário. O vendedor é o elo a montante (origem do dado), não o usuário central desta dor.

---

## 2. Personas-alvo

🟡 Referência completa em [`personas.md`](./personas.md). Resumo:

- **Gestor / Auditor / Financeiro**: 🟡 responsável por conferir, auditar e programar o pagamento das comissões; sua dor é não ver, por vendedor, o que já foi pago e o que falta, nem a data de referência que explica a liberação.

---

## 3. Métricas de sucesso

🟡 Derivadas do `ideation.md`, todas desejadas.

| Métrica | Unidade | Alvo | Prazo |
|---|---|---|---|
| 🟡 Pagamento em duplicidade | ocorrências por período | 🟡 0 | 🟡 3 meses |
| 🟡 Comissões do mês com status rastreável por vendedor (a pagar / paga) | % do mês | 🟡 100% | 🟡 3 meses |
| 🟡 Fechamento sem planilha manual (relatório gerado pelo sistema) | sim/não | 🟡 sim | 🟡 3 meses |

---

## 4. Escopo (in)

🟡 Derivado de ideation + personas + jornada:

- 🟡 Sinalização de **status por comissão** (ex.: `A PAGAR` / `PAGA`) visível ao gestor/auditor/financeiro.
- 🟡 Exibição da **data de referência** da venda/curso que explica a liberação da comissão.
- 🟡 **Visão por vendedor** do que já foi pago e do que ainda falta pagar.
- 🟡 **Filtro por período** e por **situação** (a pagar / paga).
- 🟡 **Baixa de pagamento**: marcar comissões conferidas como pagas.
- 🟡 **Geração de relatório de repasse em PDF** para conferência (vendedor, curso, valor, data de referência).
- 🟡 **Controle de acesso por papel** (gestor, auditor, financeiro) coerente com o isolamento de visibilidade por vendedor.

---

## 5. Não-objetivos (out)

🟡 Confirmados pelo usuário:

- 🟡 Sem integração automática com banco (o pagamento acontece fora do sistema).
- 🟡 Sem geração de boleto/documento bancário nativo.
- 🟡 Sem mudar a regra de cálculo de comissão nesta entrega (só visibilidade e baixa).
- 🟡 Sem alterar o fluxo de lançamento/apontamento do vendedor.

---

## 6. Restrições

| Tipo | Descrição |
|---|---|
| 🟡 Técnica | 🟡 Manter a stack do legado (Next.js + Supabase), evoluindo o app atual — decisão herdada da sessão `002`; [VALIDAR] |
| 🟡 Prazo | 🟡 [INDEFINIDO, validar com usuário] |
| 🟡 Compliance | 🟡 LGPD: dados de aluno transitam no fluxo; evitar exposição além do necessário |
| 🟡 Orçamento | 🟡 [INDEFINIDO, validar com usuário] |

---

## 7. Dependências externas

🟡 Nenhuma integração externa obrigatória. O repasse é feito manualmente a partir do relatório PDF gerado pelo sistema.

- 🟡 Nenhuma identificada (o banco não é integrado por API nesta entrega).

---

## 8. Riscos

| Risco | Impacto | Probabilidade | Mitigação proposta |
|---|---|---|---|
| 🟡 Vendedor não informa a data de início do curso / data da venda | 🟡 alto | 🟡 alta | 🟡 Exigir a data de referência na conferência e/ou derivá-la do cadastro da venda |
| 🟡 Histórico em papel e vendas já pagas não conciliados → pagamento em dobro | 🟡 alto | 🟡 média | 🟡 Carga/baixa de conciliação histórica antes de virar fonte única |
| 🟡 Gestor/auditor/financeiro sem acesso ao recorte por vendedor (RLS) | 🟡 médio | 🟡 média | 🟡 Definir policies por papel antes de expor a visão consolidada |
| 🟡 Dependência de uma só pessoa na manutenção do sistema | 🟡 médio | 🟡 média | 🟡 Documentar o fluxo e padronizar o código |

---

## 9. Critérios de aceite (alto nível)

- 🟡 **Dado** que sou gestor/auditor/financeiro, **Quando** abro a visão de comissões, **Então** vejo, por vendedor, o que está a pagar e o que já está pago.
- 🟡 **Dado** uma comissão a pagar, **Quando** a confiro e marco como paga, **Então** o status muda para `PAGA` e ela deixa de aparecer como pendente.
- 🟡 **Dado** um período selecionado, **Quando** gero o relatório de repasse, **Então** obtenho um PDF de conferência com as comissões pagas (vendedor, curso, valor, data de referência).

---

## Pendências de cobertura

🟡 Seções que precisam de validação humana antes do próximo passo:

- 🟡 Restrição de **prazo** (seção 6).
- 🟡 Restrição de **orçamento** (seção 6).

---

Gerado por reversa-drafter em 2026-10-09T13:11:51Z
Fontes: ideation.md, personas.md
