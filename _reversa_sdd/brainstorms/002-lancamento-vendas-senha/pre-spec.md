# Pre-Spec, lancamento-vendas-senha

> Selo 🟡 PLANEJADO. Insumo de entrada para o próximo pipeline, não é uma spec.

## Problema
🟡 Quando uma venda acontecer, eu quero que o vendedor a registre com baixa fricção e autoria confirmada (PIN) e que auditor e direção enxerguem em tempo real evidência, status e produção (por vendedor e por curso), para conseguir pagar comissões corretamente e decidir o funil comercial com dados.

## Caminho escolhido
🟡 Tempo real no app atual (Opção A): adicionar PIN de autoria ao apontamento existente, expor status/produção em tempo real e trocar a devolução por um checklist estruturado, sem reescrever a arquitetura.

## Escopo mínimo da primeira entrega
🟡 O vendedor lança a venda no app com o PIN de autoria; o auditor aprova, reprova ou pede detalhes com checklist estruturado; o vendedor vê status e corrige; e vendedor e direção enxergam produção em tempo real por vendedor e por curso. Uma fatia, sem offline, sem canal conversacional e sem geração de boleto.

## Não-objetivos
🟡 Geração nativa de boletos.
🟡 Chat interno.
🟡 Integração com WhatsApp/bot.
🟡 Modo offline / fila local.

## Restrições ativas
🟡 Stack atual: Next.js + Supabase. Nenhuma restrição de prazo ou integração inegociável declarada.

## Critério de pronto
🟡 O vendedor lança a venda no app com PIN e abandona a folha; o auditor aprova, reprova ou pede detalhes com checklist estruturado; a direção vê produção por vendedor e por curso em tempo real. Observável e verificável por alguém de fora.

## Premissa a validar primeiro
🟡 O vendedor prefere lançar no app, com PIN, a continuar no papel (risco H1, o mais temido). Teste barato: 1–2 semanas com os vendedores lançando no apontamento atual + PIN, medindo a adesão real contra o papel.

## Riscos herdados
🟡 PIN colidir com a sessão PWA de 14 dias (`autenticacao-controle-acesso.md`, RNF-05): exige ponto de reautenticação e política de reset.
🟡 Migração/conciliação do histórico em papel e das vendas já aprovadas antes de o sistema virar fonte única (`comissoes-livro-caixa.md`).
🟡 Dados sensíveis de aluno no fluxo (LGPD, `cadastro-alunos-documentacao.md`).
🟡 Dependência de uma pessoa só na manutenção do código interno.

## Âncoras no legado
🟡 Módulos tocados: `vendas`/`apontamento-vendas-cotacoes` (PIN de autoria, baixa fricção), `auditoria-apontamentos` (checklist estruturado de devolução e loop de correção), `dashboard-gerencial-relatorios` (produção por vendedor e curso, funil, conversão, ticket médio, recomendações) e `auth-rls` (PIN por usuário, RLS por vendedor). Referências: `autenticacao-controle-acesso.md`, `comissoes-livro-caixa.md`, `decisions-gate.md`.

## Resoluções pós-ideação (confirmadas pelo usuário)
🟡 Atualizado em 2026-09-24, após o encerramento da ideação, para não se perder entre sessões.
- 🟡 **PIN substitui o login PWA.** O PIN é a credencial exigida no lançamento; não há sessão de 14 dias sem redigitar o PIN.
- 🟡 **Conciliação de histórico:** botão seletor no perfil do auditor para "lançamento sem evolução" — registra vendas antigas/já pagas como fechadas históricas, fora do fluxo de aprovação/correção, para evitar pagamento em dobro.
- 🟡 **Checklist estruturado (catálogo inicial):** `comprovante ilegível`, `valor divergente do extrato`, `CPF do aluno faltando`, `curso errado`, `sem assinatura do contrato` + campo de observação livre.
- 🟡 **Recomendações no dashboard (gatilhos):** curso com queda de conversão vs. mês anterior; vendedor abaixo da meta do mês; curso com taxa alta de devolução na auditoria; variação de ticket médio por curso fora do padrão.
- 🟡 **Metas mensais (novo, amplia o escopo original):** configuráveis pelo auditor por vendedor e por curso, variando mês a mês por sazonalidade dos produtos; se não houver alteração no mês, repete a meta anterior (carry-over automático). **Valor inicial padrão: 10 matrículas por mês por produto.**

## Dúvidas abertas
- [DÚVIDA] 🟡 Qual o volume real de vendas/mês e o número de vendedores (dimensiona capacidade e confirma se SaaS seria alternativa)?

---
Gerado por reversa-pre-spec em 2026-09-24T00:00:00-03:00
Sessão: 002-lancamento-vendas-senha
Destino sugerido: /reversa-requirements
Atualizado em 2026-09-24: resoluções pós-ideação anexadas
