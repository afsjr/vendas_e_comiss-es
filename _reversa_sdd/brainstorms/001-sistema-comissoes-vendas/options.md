# Options, sistema-comissoes-vendas

> Selo 🟡 PLANEJADO em todos os itens. Nenhuma opção foi escolhida ainda.

## Problema de referência
🟡 Quando uma venda acontecer, eu quero que todo o processo seja acompanhável com registro de quem sinalizou cada etapa do pós-venda (contrato assinado, boletos gerados e enviados ao aluno) para evitar perda de informação e falhas operacionais, sem precisar que o sistema gere boletos nativamente.

## Restrições ativas
🟡 O sistema NÃO precisa gerar contratos ou boletos; o objetivo é apenas sinalização de fluxo (passagem de bastão) e registro de responsabilidade (quem sinalizou que foi feito).

---

## Opção A, Evoluir o Legado com Kanban de Pós-Venda
- **Em uma frase:** 🟡 Criar uma nova tela estilo "Kanban" ou "Checklist" dentro do sistema atual, onde a venda aprovada pela gerência vira um card que a Secretaria e o Financeiro apenas sinalizam e movem para a próxima fase.
- **Como resolve o problema:** 🟡 A venda ganha novos status de fluxo de trabalho ("Aguardando Contrato", "Contrato Assinado", "Boletos Enviados"). A secretaria clica para confirmar o contrato, e a "bola" passa para o financeiro. O banco de dados registra automaticamente o nome de quem clicou e a data/hora, servindo de auditoria. Eles podem colar um link de acesso ao sistema do boleto num campo de observação.
- **Esforço:** 🟡 Baixo a Médio. É basicamente gerenciar estado de algo que já existe no banco e criar telas simples de "lista de tarefas" para Secretaria e Financeiro.
- **Impacto no legado:** 🟡 Baixo. Mantém o foco do sistema original (apontar venda), apenas esticando o ciclo de vida da venda até a etapa financeira sem aumentar a complexidade arquitetural ou criar novas integrações bancárias pesadas.
- **Reversibilidade:** 🟡 Fácil. Se as pessoas não usarem a tela de pós-venda, o fluxo de comissões continua operando normalmente.
- **O que precisa ser verdade para funcionar:** 🟡 O banco de dados atual deve ser minimamente adaptado para suportar log de histórico de auditoria (para saber quem sinalizou cada etapa e quando).

## Opção B, Integração Externa de Fluxo (Webhook p/ Trello/Pipefy)
- **Em uma frase:** 🟡 O sistema atual de comissões dispara um alerta invisível no momento em que a venda é "Aprovada", criando automaticamente uma tarefa/card em uma ferramenta gratuita externa de gestão visual (ex: Trello).
- **Como resolve o problema:** 🟡 A Secretaria e o Financeiro nem entram no sistema legado; eles usam apenas o Trello para mover os cards de "Para Fazer" para "Feito", validando os checklists. A responsabilidade (quem moveu) fica gravada nativamente lá pelo Trello.
- **Esforço:** 🟡 Muito Baixo em código. Requer apenas programar o envio de um "sinal" (webhook) na venda do legado, e parametrizar o painel visual no Trello/Make/Zapier.
- **Impacto no legado:** 🟡 Quase zero. Apenas um evento de saída da informação.
- **Reversibilidade:** 🟡 Muito Fácil. Basta desligar o webhook e deletar o board de tarefas.
- **O que precisa ser verdade para funcionar:** 🟡 A equipe de pós-venda concorda em usar uma segunda aba/software (Trello) só para controlar essas tarefas, separado do sistema de comissões.

---

## Opção sempre presente, não construir (Solução por Processo)
- **Em uma frase:** 🟡 Usar o disparo de e-mails internos padronizados, onde cada setor responde "Ok, feito" copiando o próximo da fila, atuando como documento de passagem de bastão.
- **Como resolve o problema:** 🟡 O histórico de quem fez o que fica salvo na thread do e-mail daquele aluno, permitindo buscas futuras, sem tocar em nenhum código.
- **Esforço:** 🟡 Zero desenvolvimento. Requer apenas criação de um SOP (Regra de Operação Padrão).
- **Impacto no legado:** 🟡 Nenhum.
- **Reversibilidade:** 🟡 Imediata.
- **O que precisa ser verdade para funcionar:** 🟡 Resiliência da equipe contra o cansaço de mandar e-mails manuais o dia inteiro e risco do pedido ficar "perdido" numa caixa de entrada se alguém faltar.

## Opção sempre presente, usar algo pronto
- **Em uma frase:** 🟡 Contratar um sistema robusto de controle de fluxo de processos (BPM), como o Zendesk, Pipefy completo ou Jira, e mudar toda a operação da escola para lá.
- **Como resolve o problema:** 🟡 Essas ferramentas já controlam SLAs (tempos máximos de espera), responsáveis de cada card, e enviam avisos nativamente para o aluno/equipe.
- **Esforço:** 🟡 Alto na parametrização e treinamento. Baixo em desenvolvimento de software próprio.
- **Impacto no legado:** 🟡 Total. Um BPM forte geralmente absorve inclusive o apontamento do vendedor, tornando a solução caseira (legado) redundante e obsoleta.
- **Reversibilidade:** 🟡 Difícil. Migrar processos inteiros (lock-in) para uma ferramenta comercial é caro para desfazer.
- **O que precisa ser verdade para funcionar:** 🟡 A direção da escola deve aprovar mensalidades recorrentes por número de licenças (em reais caros ou dólar) para a vida toda.

---
Gerado por reversa-explorer em 2026-08-12T08:48:00-03:00
Sessão: 001-sistema-comissoes-vendas
Nenhuma recomendação emitida por design. Convergência é papel de /reversa-arbiter.
