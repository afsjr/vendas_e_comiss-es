# Risks, sistema-comissoes-vendas

> Selo 🟡 PLANEJADO em todos os itens. Documento adversarial por design.

## Premortem
🟡 A equipe de Secretaria e Financeiro abandonou a ferramenta de fluxo em semanas porque achou que 'ficar clicando para avisar que fez' dava mais trabalho do que simplesmente gerar o contrato. (Causa raiz: Fadiga de clique / burocracia).
🟡 A integração funcionou na tecnologia, mas os boletos deixaram de ser gerados porque o financeiro esquecia de abrir a 'outra tela/aplicativo' (Trello/Pipefy) todos os dias. (Causa raiz: Descolamento de ferramentas).
🟡 As pessoas sinalizavam 'Feito' no sistema ou e-mail sem de fato ter anexado o contrato, e a escola continuou perdendo matrículas por falta de bloqueios reais. (Causa raiz: Sinalização falsa por falta de travas sistêmicas).
🟡 A escola adotou um sistema gigantesco de tickets (BPM) que engessou tanto a operação comercial original que a velocidade de vendas caiu e o custo das licenças ficou impagável. (Causa raiz: Excesso de rigor/peso da ferramenta pronta).

**Manchete que mais assusta o usuário:** 🟡 (Empate 1 e 3) As equipes abandonarem por acharem o fluxo de cliques burocrático DEMAIS (fricção), ou então fraudarem o clique de "Feito" porque o botão não tem trava nenhuma exigindo a prova do anexo (solto DEMAIS).

---

## Opção A, Evoluir o Legado com Kanban de Pós-Venda
- **Premissa que mata:** 🟡 É possível criar uma aba dentro do sistema atual que exija uma trava sistêmica forte (ex: link obrigatório do boleto) para deixar mover o status, sem que isso gere tanto atrito que a Secretaria desista de usar.
- **Teste barato da premissa:** 🟡 Alterar temporariamente o sistema atual adicionando um campo de texto obrigatório de "Link do arquivo" no fechamento e medir se a equipe realmente preenche certo ou bota "x" só pra tela passar.
- **Custo escondido:** 🟡 🟡 [inferido, sem âncora no legado] Custo de manter a lógica estrita de dados no backend. Se a etapa mudar, terá que programar novas validações duras (`check link_boleto is not null when status = enviado`) no banco de dados.
- **Ponto sem volta:** 🟡 Quando a tabela do banco de dados legado (tabela de vendas) for alterada estruturalmente para depender e engessar os passos da secretaria para fechar o ciclo.

## Opção B, Integração Externa de Fluxo (Webhook p/ Trello/Pipefy)
- **Premissa que mata:** 🟡 Ferramentas visuais externas (especialmente nas versões gratuitas) possuem recursos robustos para impedir que o funcionário arraste o card para "Feito" sem colar a evidência de forma válida.
- **Teste barato da premissa:** 🟡 🟡 [sem teste barato disponível] Exige assinar as versões premium dessas ferramentas para configurar regras avançadas de "campos obrigatórios na troca de coluna" e testar com os usuários.
- **Custo escondido:** 🟡 🟡 [inferido, sem âncora no legado] A quebra do link. Se o Vendedor edita o nome do aluno no legado porque digitou errado, o Trello não vai atualizar sozinho (pois foi só webhook de criação), gerando dois nomes diferentes para a mesma pessoa.
- **Ponto sem volta:** 🟡 O momento em que a cultura da empresa se divide: Vendedores e Auditor numa tela, e Secretaria/Financeiro em outra completamente desvinculada nativamente.

## Opção sempre presente, não construir (Solução por Processo - E-mail)
- **Premissa que mata:** 🟡 É possível a gestão auditar centenas de respostas "Feito" ou 👍 no WhatsApp/Email e cruzar com os contratos assinados na nuvem para ter certeza que não é um falso positivo.
- **Teste barato da premissa:** 🟡 Pegar as mensagens de WhatsApp/Email da semana passada inteira e pedir para o gerente verificar um a um se o contrato está na pasta do Google Drive. Ele vai desistir em poucas horas.
- **Custo escondido:** 🟡 Risco de fluxo de caixa e judicial. A falsa sensação de segurança de uma mensagem "Feito" que mascara um boleto que nunca foi enviado para o aluno (e a escola perdendo dinheiro passivamente).
- **Ponto sem volta:** 🟡 Quando o volume de vendas crescer e a quantidade de e-mails/mensagens de confirmação se tornar fisicamente impossível de ser lida por humanos.

## Opção sempre presente, usar algo pronto (BPM / Zendesk)
- **Premissa que mata:** 🟡 Uma ferramenta de processos robusta (BPM) tem como balancear travas fortes no pós-venda (Secretaria) mantendo a tela ultra-rápida e sem fricção na ponta da venda (Comercial).
- **Teste barato da premissa:** 🟡 Fazer um trial do Pipefy, montar um funil com campos obrigatórios no fim e pedir para o vendedor mais apressado lançar suas vendas diárias pelo celular usando o Pipefy.
- **Custo escondido:** 🟡 A síndrome do dado inventado. Quando um sistema terceirizado impõe um processo rígido, as pessoas digitam qualquer dado ("1234") só para o botão de avançar desbloquear.
- **Ponto sem volta:** 🟡 Assinar o contrato corporativo anual da ferramenta escolhida e abandonar o sistema legado recém-construído.

---

## Riscos transversais
🟡 **Dependência de uma pessoa só:** No modelo de esteira, se a Secretaria (ou Financeiro) depender de uma única pessoa e ela faltar, a venda trava na coluna dela e os boletos não saem.
🟡 **Mudança que exige migração de dados existentes:** Todas as vendas passadas ou atualmente "no ar" precisarão entrar retroativamente nessa nova lógica de "status de pós-venda" para que não fiquem num limbo invisível.
🟡 **Fluxo de autenticação ou permissão sendo tocado:** Pessoas da Secretaria não podem ter acesso ao botão de "Aprovar Venda/Comissão" (exclusivo da gerência/auditor). Garantir a visibilidade correta (RLS) vai dar trabalho arquitetural.

## O que precisa ser respondido antes de decidir
🟡 A escola está disposta a conviver com o fato de que "travar e exigir o anexo" vai invariavelmente causar a reclamação de que o sistema "ficou mais chato de usar"?
🟡 Vale a pena dividir a equipe em duas telas (Opção B) ou o benefício de ter a Secretaria na mesma tela do Vendedor (Opção A) compensa o esforço de codar?
🟡 O que acontece com a venda aprovada e comissionada se o aluno desistir justo na hora de assinar o contrato na etapa de Secretaria?

---
Gerado por reversa-challenger em 2026-08-12T10:11:00-03:00
Sessão: 001-sistema-comissoes-vendas
