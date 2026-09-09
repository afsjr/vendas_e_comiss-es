# Pre-Spec, sistema-comissoes-vendas

> Selo 🟡 PLANEJADO. Insumo de entrada para o próximo pipeline, não é uma spec.

## Problema
🟡 Quando uma venda acontecer, eu quero que todo o processo seja acompanhável com registro de quem sinalizou cada etapa do pós-venda (contrato assinado, boletos gerados e enviados ao aluno) para evitar perda de informação e falhas operacionais, sem precisar que o sistema gere boletos nativamente.

## Caminho escolhido
🟡 Evoluir Legado com Kanban (Opção A). Centraliza o apontamento original com o fluxo de secretaria no mesmo banco, permitindo programar travas exatas contra preenchimento falso.

## Escopo mínimo da primeira entrega
🟡 Adição de novos status operacionais (além do pagamento de comissão) na entidade de venda e criação de uma interface de fila de trabalho/kanban onde a Secretaria e o Financeiro recebem vendas aprovadas e sinalizam a execução da etapa.

## Não-objetivos
🟡 Ter um chat interno, enviar alertas por SMS, e gerar/processar arquivo de retorno bancário.

## Restrições ativas
🟡 Nenhuma declarada.

## Critério de pronto
🟡 Uma etapa (ex: preparar contrato) só sai da fila do responsável quando a pessoa se registrar, inserir a comprovação necessária e assumir a responsabilidade (log) pela passagem de bastão no fluxo.

## Premissa a validar primeiro
🟡 Alterar temporariamente o sistema atual adicionando um campo obrigatório para a gerência ("Link/Arquivo" ao aprovar) e medir se o usuário preenche com dados reais ou se frauda a validação apenas para a tela avançar, provando se a "trava" funciona na prática.

## Riscos herdados
🟡 A equipe administrativa achar a inserção obrigatória de link/anexo muito burocrática; necessidade de configurar segurança complexa (RLS) para que Secretaria não acesse as aprovações de comissão da Gerência; e o desafio de enquadrar as vendas passadas (já faturadas) nesse novo funil sem gerar caos.

## Âncoras no legado
🟡 Módulos tocados (baseado no mapeamento do sistema): `vendas` (tabela precisará de extensão de ciclo de vida), `auth-rls` (criação de papéis segregados para Secretaria e Financeiro) e `frontend-dashboard` (novas visões de filas de trabalho focadas nas tarefas pendentes).

## Dúvidas abertas
- [DÚVIDA] 🟡 O que acontece sistemicamente se um aluno desistir na etapa de contrato da Secretaria, considerando que a comissão do Vendedor já foi aprovada pela Gerência no passo anterior?
- [DÚVIDA] 🟡 O que exatamente a Secretaria/Financeiro deverá preencher para "assumir a responsabilidade" e destravar a etapa? Apenas um checkbox e o sistema pega quem está logado, ou colar obrigatoriamente um link (ex: link do contrato do Google Drive)?

---
Gerado por reversa-pre-spec em 2026-08-12T18:50:00-03:00
Sessão: 001-sistema-comissoes-vendas
Destino sugerido: /reversa-requirements
