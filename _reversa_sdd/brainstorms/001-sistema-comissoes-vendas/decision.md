# Decision, sistema-comissoes-vendas

> Selo 🟡 PLANEJADO. Decisão humana registrada, sujeita a revisão.

## Problema de referência
🟡 Quando uma venda acontecer, eu quero que todo o processo seja acompanhável com registro de quem sinalizou cada etapa do pós-venda (contrato assinado, boletos gerados e enviados ao aluno) para evitar perda de informação e falhas operacionais, sem precisar que o sistema gere boletos nativamente.

## Placar
| Opção | Job to be done | Esforço | Risco residual | Custo no legado | Total |
|---|---|---|---|---|---|
| Evoluir Legado c/ Kanban (A) | 5 | 3 | 4 | 3 | 15 |
| Integração Webhook Trello (B) | 4 | 4 | 2 | 5 | 15 |
| Processo via E-mail | 2 | 5 | 1 | 5 | 13 |
| Usar BPM Pronto (SaaS) | 5 | 2 | 3 | 5 | 15 |

🟡 Houve um triplo empate no total (15 pontos) entre as opções A, B e D. O desempate baseou-se em priorizar a trava sistêmica (contra fraudes de clique sem anexo), que o SaaS entregaria cobrando caro por usuário, e o Trello não entregaria na versão free, deixando a Opção A como a mais aderente à dor raiz em longo prazo.

## Recomendação do Arbiter
🟡 Evoluir Legado com Kanban (Opção A). Centraliza o apontamento original com o fluxo de secretaria no mesmo banco, permitindo programar travas exatas contra preenchimento falso.

## O que se perde ao escolher ela
🟡 O desenvolvimento zero e a agilidade imediata. A escola assume a responsabilidade de manter código customizado para esse Kanban no lugar de plugar soluções de prateleira gratuitas.

## Em que condição a recomendação muda
🟡 Se o budget (tempo/dinheiro) para desenvolvimento interno acabar subitamente; nesse cenário, iríamos para a Integração Externa (Trello/Pipefy).

## Decisão do usuário
🟡 Opção A (Evoluir Legado com Kanban) , decidido por adelino em 2026-08-12T10:27:47-03:00

## A validar antes de comprometer
🟡 Alterar temporariamente o sistema atual adicionando um campo obrigatório para a gerência na aprovação ("Link/Arquivo") e medir se é preenchido com dados reais ou se o usuário frauda o preenchimento para se livrar do aviso.

## Riscos aceitos conscientemente
🟡 A equipe de suporte administrativo reclamar que a tela é muito rígida/burocrática.
🟡 O trabalho arquitetural extra de controle de acesso (RLS) para garantir que a secretaria não veja nem possa clicar em "Aprovar Venda" (botão da gerência).
🟡 A necessidade de migrar todas as vendas já "aprovadas" historicamente para esse novo status de funil.

---
Gerado por reversa-arbiter em 2026-08-12T10:28:00-03:00
Sessão: 001-sistema-comissoes-vendas
