# Options, lancamento-vendas-senha

> Selo 🟡 PLANEJADO em todos os itens. Nenhuma opção foi escolhida ainda.

## Problema de referência
🟡 Quando uma venda acontecer, eu quero que o vendedor a registre com baixa fricção e autoria confirmada (PIN) e que auditor e direção enxerguem em tempo real evidência, status e produção (por vendedor e por curso), para conseguir pagar comissões corretamente e decidir o funil comercial com dados.

## Restrições ativas
🟡 Nenhuma declarada. Premissas observadas do legado: stack Next.js + Supabase já em uso; decisão prévia da sessão `001` de **evoluir o legado**; contexto de escola de pequeno/médio porte (verificar orçamento e tolerância a dependência externa).

---

## Opção A, Tempo real no app atual
- **Em uma frase:** 🟡 Adicionar o PIN de autoria ao apontamento existente, expor status/produção em tempo real ao vendedor e à direção e trocar a devolução por um checklist estruturado, tudo dentro do app atual.
- **Como resolve o problema:** 🟡 Elimina o papel e o fechamento tardio (status em tempo real), dá prova de autoria (PIN + log de versões), resolve a dúvida de pagamento retroativo (histórico por status no próprio sistema) e entrega funil/produção por vendedor e curso no dashboard já existente.
- **Esforço:** 🟡 médio , reusa login, hash de evidência, auditoria e dashboard; adiciona PIN, checklist e novas visões.
- **Impacto no legado:** 🟡 Altera `vendas`/`apontamento-vendas-cotacoes`, `auditoria-apontamentos`, `dashboard-gerencial-relatorios` e `auth-rls` (PIN por usuário). Sem reescrita de arquitetura.
- **Reversibilidade:** 🟡 fácil , mudanças aditivas sobre módulos que já existem.
- **O que precisa ser verdade para funcionar:** 🟡 Que o vendedor consiga lançar no app com fricção baixa o bastante para abandonar o papel.

## Opção B, Captura rápida em duas etapas
- **Em uma frase:** 🟡 Separar o lançamento em "registro rápido" (valor + foto em poucos toques) e um "complemento posterior" do restante dos dados, para reduzir a fricção no momento da venda.
- **Como resolve o problema:** 🟡 Ataca a baixa adesão do vendedor ao app (causa do papel) tornando o ato de lançar quase instantâneo; o enriquecimento e a correção acontecem depois, guiados por pendências.
- **Esforço:** 🟡 médio , exige modelar estado de "rascunho/incompleto" e a régua de cobrança de complemento.
- **Impacto no legado:** 🟡 Adiciona estado intermediário na máquina de estados da venda e novas telas de captura/complemento; mexe no fluxo de apontamento atual.
- **Reversibilidade:** 🟡 média , mexe no núcleo do fluxo de venda, mas é contido.
- **O que precisa ser verdade para funcionar:** 🟡 Que o vendedor aceite voltar depois para completar (disciplina) e que a régua de pendências cobre isso.

## Opção C, Entrada por canal conversacional
- **Em uma frase:** 🟡 O vendedor lança a venda conversando em um canal tipo WhatsApp/bot estruturado; o registro nasce no sistema e a auditoria/dashboard acontecem normalmente.
- **Como resolve o problema:** 🟡 Zero fricção de app no aparelho (usa o que o vendedor já tem aberto), captura evidência no próprio chat e alimenta produção/funil em tempo real.
- **Esforço:** 🟡 alto , exige integração com API de mensageria, fluxo conversacional, tratamento de foto/áudio e conciliação de identidade/PIN no canal.
- **Impacto no legado:** 🟡 Cria uma nova porta de entrada que grava nas mesmas entidades; requer autenticação/identidade paralela ao login atual.
- **Reversibilidade:** 🟡 média , a porta é aditiva, mas caso o canal vire o principal, removê-la depois é caro.
- **O que precisa ser verdade para funcionar:** 🟡 Que o custo/limite da API de mensageria e a confiabilidade do fluxo conversacional se sustentem no volume da escola.

---

## Opção sempre presente, não construir
- **Em uma frase:** 🟡 Padronizar uma folha única de fechamento, atribuir um código por venda e instituir conferência/semanal com evidência (foto do comprovante) em pasta compartilhada.
- **Como resolve o problema:** 🟡 Reduz o caos do papel sem software: evidência passa a existir, o código evita pagamento duplicado e a produção passa a ter uma rotina de leitura.
- **Esforço:** 🟡 baixo , combinado de processo e planilha; sem desenvolvimento.
- **Impacto no legado:** 🟡 Nenhum no código. Depende de disciplina da equipe.
- **Reversibilidade:** 🟡 fácil , é processo.
- **O que precisa ser verdade para funcionar:** 🟡 Que as pessoas executem o combinado sem software impondo a trava.

## Opção sempre presente, usar algo pronto
- **Em uma frase:** 🟡 Usar ferramentas de prateleira para captura e funil (ex.: Google Forms/AppSheet, Pipefy, Trello, Kommo ou CRM com app de campo tipo Pipedrive/HubSpot) e BI (ex.: Looker Studio/Metabase) para o dashboard, mantendo o legado para comissão.
- **Como resolve o problema:** 🟡 Entrega captura mobile e painel de funil rapidamente sem desenvolvimento próprio, resolvendo "simplicidade" e "visibilidade" com configuração.
- **Esforço:** 🟡 baixo a médio , configuração e integração pontual em vez de código.
- **Impacto no legado:** 🟡 Pode duplicar a fonte da verdade se não integrar com o legado; exige ponte de dados para não recriar o problema de "venda em dois lugares".
- **Reversibilidade:** 🟡 média , trocar de SaaS depois envolve migração de dados.
- **O que precisa ser verdade para funcionar:** 🟡 Que a ferramenta escolhida permita o PIN/autoria e o checklist de devolução e se integre ao legado. 🟡 [verificar se existe solução pronta neste domínio com essas travas]

---
Gerado por reversa-explorer em 2026-09-24T00:00:00-03:00
Sessão: 002-lancamento-vendas-senha
Nenhuma recomendação emitida por design. Convergência é papel de /reversa-arbiter.
