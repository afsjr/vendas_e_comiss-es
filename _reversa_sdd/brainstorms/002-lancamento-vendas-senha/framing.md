# Framing, lancamento-vendas-senha

> Selo 🟡 PLANEJADO em todos os itens, sujeito a validação.

## Classificação da entrada
🟡 solução disfarçada de problema , a ideia partiu de mecanismos (PIN no lançamento, dashboard de produção, fluxo do auditor) antes de nomear a dor concreta por trás deles.

## Problema
🟡 O fechamento para pagamento de comissão é feito em folhas de papel que cada vendedor anota e que só aparecem no fim do mês. Quem confere tem pouca ou nenhuma evidência objetiva forte da venda; quem programa o pagamento fica na dúvida se aquela venda já foi paga em período anterior; e o vendedor não tem um controle forte para si mesmo.

## Quem sente
🟡 O vendedor (anota no papel, sem controle próprio e sem visão de status/correção), o auditor/gerência (confere sem evidência objetiva e com risco de pagar em duplicidade) e a direção (sem visibilidade da produção diária/mensal por vendedor, por curso e do funil comercial). Distinto de quem compra (o aluno).

## Quando dói
🟡 No apontamento diário da venda (registro em papel, tardio), na conferência/apuração do fechamento mensal e no momento de programar o pagamento (dúvida retroativa "já paguei isso?"). A dor se concentra no fim do mês por ausência de informação em tempo real.

## Custo de não fazer
🟡 A incerteza e o retrabalho de fechamento continuam, mantendo risco de pagamento indevido ou duplicado e a insatisfação do vendedor sem controle. A direção segue decidindo o funil comercial no escuro. Com o crescimento da equipe, o volume de papéis e dúvidas cresce junto. [INDEFINIDO: quantificar em R$/horas, validar com usuário]

## Job to be done
🟡 Quando uma venda acontecer, eu quero que o vendedor a registre com baixa fricção e autoria confirmada (PIN) e que auditor e direção enxerguem em tempo real evidência, status e produção (por vendedor e por curso), para conseguir pagar comissões corretamente e decidir o funil comercial com dados.

## Fora de escopo declarado
🟡 [INDEFINIDO, validar com usuário]

## Âncoras no legado
🟡 Contexto `legado`. Sistemas/specs consultados em `_reversa_sdd/sdd/`:
- `apontamento-vendas-cotacoes.md`: apontamento móvel "em até 3 toques", evidência com hash SHA-256 único (1 comprovante = 1 venda). A ideia reforça a baixa fricção e adiciona o PIN de autoria.
- `auditoria-apontamentos.md`: fluxo do auditor (validar/rejeitar). A ideia adiciona "pedir mais detalhes" com **checklist estruturado** do que falta e o ciclo de correção/reenvio pelo vendedor.
- `dashboard-gerencial-relatorios.md`: painéis gerenciais. A ideia pede produção por vendedor e por curso, funil, conversão, ticket médio e área de recomendações.
- `autenticacao-controle-acesso.md`: login e-mail+senha (Argon2id/bcrypt), perfil `VENDEDOR` em PWA com sessão de 14 dias. Base para o PIN como **autoria** (não autenticação).
- `comissoes-livro-caixa.md`: registro imutável de comissões/livro-caixa com hash de integridade; base para resolver a dúvida de pagamento retroativo.

## Decisões de enquadramento
🟡 **PIN = autoria, não autenticação.** PIN curto e único digitado no ato do envio/reenvio, sinalizando quem enviou mesmo em aparelho compartilhado.
🟡 **Caminho evolutivo.** Evoluir o sistema atual (login, auditoria, hash de evidência e dashboard já existem). Mantida a decisão da sessão `001`.
🟡 **Loop de correção.** O vendedor recebe a devolução na própria carteira com o checklist do que falta, corrige e reenvia com PIN, gerando nova versão/log.

---
Gerado por reversa-framer em 2026-09-24T00:00:00-03:00
Sessão: 002-lancamento-vendas-senha
