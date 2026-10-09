# Ideation, Comissionamento e Vendas — Visibilidade de pagamento de comissões

> Selo 🟡 PLANEJADO em todos os itens, sujeito a validação.

## Brief original

Tenho uma equipe de vendas que hoje usa fichas/cartões de papel e registros de WhatsApp para guardar dados de clientes, pagamentos e depois usa isso como fonte para consulta para revenda e apontamento para comissão. Quero algo que tenha a função de apontar vendas, cotações, registros de comissão e relatórios diários/mensal/outros períodos de produção e comissionamento para equipe que vendeu, pois tanto o pessoal do comercial quanto secretaria vende os cursos (técnico, graduação, pós-graduação, cursos livres). É preciso ter melhor controle e que seja auditável em qualquer momento pela gestão para fins de pagamento e acompanhamento de resultados.

## Problema

🟡 No momento de apontar a comissão para pagamento, gestor, auditor e financeiro não sabem quais comissões já foram pagas e quais ainda não, porque não existe sinalização visível de **quando** a venda/curso ocorreu (referência temporal) nem de **se** a comissão já foi paga. A ausência da data de início do curso no apontamento do vendedor embaralha a distinção entre comissão liberada e comissão efetivamente paga. A dor se concentra no apontamento/liberação para pagamento, não no lançamento da venda.

🟡 **Quem sente:** gestor, auditor e financeiro (papéis administrativos que conferem e programam o pagamento). Diferente de quem lança a venda (vendedor/secretaria).

## Valor entregue

🟡 O gestor passa a enxergar, **por vendedor**, o que já foi pago e o que ainda vai ser pago; consegue **sinalizar uma comissão como paga**; e consegue **gerar o relatório de repasse para pagamento bancário** a partir do próprio sistema, sem planilha manual.

## Alternativas existentes

🟡 Soluções já avaliadas e descartadas na ideação anterior (sessão `002`), com motivo:
- **D, Não construir (só processo):** perde por não entregar tempo real, autoria e visibilidade.
- **E, Usar algo pronto (SaaS):** abre mão de manter a base única e o código customizado do legado.
- **B, Captura rápida em 2 etapas:** menos aderente ao fluxo de conferência/pagamento existente.
- **C, Canal conversacional:** não dá rastreabilidade estruturada de status de pagamento.
- **Google Forms (tentativa real anterior):** fracassou por fricção de acesso; vendedores voltaram ao papel.

## Público-alvo (bruto)

🟡 Vendedor/Comercial (5–8), Secretaria (1–2) e Gerência (1–2). Para **esta** dor, o usuário principal é o **gestor/auditor/financeiro**; o vendedor é o elo a montante (origem do dado).

## Métricas de sucesso

🟡 As três abaixo, todas desejadas:
- **Zero pagamento em duplicidade** no período, medido pelo relatório bancário.
- **100% das comissões do mês com status rastreável** por vendedor (a pagar / pago).
- **Fechamento sem planilha manual:** relatório de repasse gerado pelo próprio sistema.

## Premissas a validar

🟡 1. O vendedor abandona o papel e o apontamento no app passa a ser a fonte única — sem isso o status de pagamento nunca fica confiável (premissa central da sessão `002`).
🟡 2. Migração/conciliação do histórico em papel e das vendas já pagas antes de o app virar fonte única, para evitar pagamento em dobro.
🟡 3. Os perfis gestor/auditor/financeiro conseguem ver e sinalizar pagamento sem quebrar o isolamento de visibilidade por vendedor (RLS por papel).

## Notas

🟡 Esta ideação **estreita** a sessão `002-lancamento-vendas-senha` para a fatia de **visibilidade e baixa de pagamento** de comissões. A sessão `002` decidiu a opção A (tempo real no app atual) para o lançamento; aqui a dor é a jusante (apuração e pagamento).
🟡 **Gatilho do relato:** o não uso da **data de início do curso** pelos vendedores no apontamento. Sem essa data, a liberação da comissão (que depende do início do curso) e o pagamento ficam indistinguíveis na conferência.
🟡 **Proposta implícita a validar no próximo agente:** sinalização explícita de status por comissão (ex.: `A PAGAR` / `PAGA`) com data de referência visível, baixa manual pelo gestor/auditor/financeiro e exportação do recorte para repasse bancário.
🟡 Herdadas da sessão `002` e ainda relevantes: conciliação do histórico em papel, LGPD nos dados de aluno e dependência de uma só pessoa na manutenção do sistema.

---
Gerado por reversa-ideator em 2026-10-09T13:05:31Z
Fonte: newproject-brief.md
Sessão de ideação reaproveitada: 002-lancamento-vendas-senha
