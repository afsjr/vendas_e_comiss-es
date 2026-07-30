# Ideation — Sistema de Comissionamento e Vendas

> Selo 🟡 PLANEJADO em todos os itens, sujeito a validação.

## Brief original

Tenho uma equipe de vendas que hoje usa fichas/cartões de papel e registros de WhatsApp para guardar dados de clientes, pagamentos e depois usa isso como fonte para consulta para revenda e apontamento para comissão. Quero algo que tenha a função de apontar vendas, cotações, registros de comissão e relatórios diários/mensal/outros períodos de produção e comissionamento para equipe que vendeu, pois tanto o pessoal do comercial quanto secretaria vende os cursos (técnico, graduação, pós-graduação, cursos livres). É preciso ter melhor controle e que seja auditável em qualquer momento pela gestão para fins de pagamento e acompanhamento de resultados.

---

## Problema

🟡 Informações de vendas e pagamentos ficam perdidas ou inacessíveis porque são registradas em papel (fichas, agendas) ou em conversas de WhatsApp. O vendedor tem dificuldade de apontar suas vendas de forma consistente; a gerência não consegue validar se uma comissão já foi paga ou está pendente; e, em casos de reembolso, não há rastreabilidade da forma de pagamento, data e valores para dirimir divergências. A dor aparece principalmente no fechamento mensal de comissões e sempre que um cliente solicita reembolso. Tanto os vendedores quanto a secretaria e a gerência sofrem com esse cenário.

**Necessidade adicional identificada:** arquivo de evidências em imagem (comprovantes, recibos) vinculado a cada apontamento para consulta posterior.

---

## Valor entregue

🟡 Com o sistema:
- O **vendedor** vai poder apontar o que vendeu rapidamente, sem se preocupar em esquecer, e poderá consultar seu histórico a qualquer momento.
- A **gerência** vai poder apurar vendas e produtividade de forma autônoma, sem depender de solicitação ao vendedor, eliminando desconfianças sobre comissões já pagas ou não.
- O **vendedor e a gerência** vão ter rastreabilidade completa de valores pagos para entender o fluxo de caixa e processar reembolsos com comprovação.

---

## Alternativas existentes

🟡 Tentativa anterior com formulários Google (que geram planilhas):
- **Por que não bastou:** os vendedores esqueciam de apontar pela dificuldade de acesso (muitos passos, URL para encontrar) e pela falta de hábito; o resultado foi o retorno ao papel.
- **Lição:** a nova solução precisa ter acesso simples e direto, preferencialmente pelo celular, com baixíssima fricção no apontamento.

Nenhum CRM, ERP ou app de comissões foi tentado até o momento.

---

## Público-alvo (bruto)

🟡 Três perfis de usuário com necessidades distintas:

| Perfil | Quantidade | Dispositivo | Necessidade principal |
|---|---|---|---|
| Vendedor / Comercial | 5–8 | Celular e computador | Apontar vendas rapidamente, consultar histórico e comissões |
| Secretaria | 1–2 | Computador (posto fixo) | Registrar vendas e evidências de pagamento |
| Gerência | 1–2 | Computador / celular | Dashboard de metas, produção, projeção de tendência e auditoria |

A gerência não precisa de visão em tempo real — D-1 (até o dia anterior) é suficiente — mas quer acompanhar: meta diária, projeção de tendência geral e por produto, faturamento estimado × realizado.

---

## Métricas de sucesso

🟡 Indicadores para avaliação em 3 meses:
- **100% dos apontamentos de venda feitos no sistema** — zero registros novos em papel ou WhatsApp.
- **Fechamento de comissão imediato:** logo após o apontamento confirmado, o valor de comissão já está disponível para pagamento, sem processo manual adicional de cálculo.

---

## Premissas a validar

🟡 Premissas críticas que, se estiverem erradas, afetam diretamente a arquitetura:

1. **Uma venda = um curso + uma pessoa:** cada apontamento registra exatamente um curso vendido para um único aluno. Vendas "aninhadas" (pacotes, matrículas múltiplas na mesma operação) não são suportadas nesta versão.
2. **Evidência obrigatória:** todo apontamento de venda e/ou reembolso deve ter comprovante em imagem (foto, print, PDF) vinculado antes de ser considerado válido.
3. **Imutabilidade total (livro caixa):** nenhum registro pode ser apagado ou editado retroativamente. O sistema funciona como um livro caixa — entradas e saídas são sempre novos lançamentos; erros são corrigidos por estorno/contra-lançamento, nunca por exclusão ou rasura.

---

## Notas

🟡 Pontos adicionais capturados no brainstorm que influenciam as specs:

- **Controle Estrito de Visibilidade / Privacidade:** Vendedores e secretaria enxergam **exclusivamente a sua própria produção, comissões e projeções individuais**. Apenas o perfil Gerência/Diretoria tem visão consolidada global de toda a equipe e dos totais da escola.
- **Carimbo Digital de Auditoria (Timestamp):** Toda evidência em imagem (foto/print) recebe carimbo automático com data, hora e usuário para auditoria indiscutível.
- **Status de Auditoria da Venda:** Venda entra como `🟡 Pendente de Validação` e passa a `🟢 Aprovada` ou `🔴 Divergente` após conferência gerencial do comprovante.
- **Funil de Cotações:** Registro rápido de Cotação com conversão em Venda em 1 clique anexando a imagem do comprovante.

---
Gerado por reversa-ideator em 2026-07-23T13:25:00-03:00 (Atualizado com inspirações de mercado e regra de privacidade)
Fonte: newproject-brief.md

