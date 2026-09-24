# Decision, lancamento-vendas-senha

> Selo 🟡 PLANEJADO. Decisão humana registrada, sujeita a revisão.

## Problema de referência
🟡 Quando uma venda acontecer, eu quero que o vendedor a registre com baixa fricção e autoria confirmada (PIN) e que auditor e direção enxerguem em tempo real evidência, status e produção (por vendedor e por curso), para conseguir pagar comissões corretamente e decidir o funil comercial com dados.

## Placar
| Opção | Job to be done | Esforço | Risco residual | Custo no legado | Total |
|---|---|---|---|---|---|
| A, Tempo real no app atual | 5 | 3 | 4 | 3 | 15 |
| D, Não construir (processo) | 2 | 5 | 2 | 5 | 14 |
| E, Usar algo pronto (SaaS) | 3 | 4 | 3 | 3 | 13 |
| B, Captura rápida em 2 etapas | 3 | 3 | 3 | 2 | 11 |
| C, Canal conversacional | 4 | 1 | 1 | 2 | 8 |

🟡 Não houve empate. A opção "não construir" ficou próxima (14) por pontuar no teto em esforço e custo no legado, mas perde em aderência ao job to be done, que exige tempo real, autoria e visibilidade — nada disso entregue só por processo.

## Recomendação do Arbiter
🟡 Opção A (Tempo real no app atual) , concentra o apontamento e o fluxo de auditoria na mesma base, tornando o sistema a fonte única da verdade e atacando a adesão (H1) e o pagamento duplicado (H2) sem reescrever a arquitetura.

## O que se perde ao escolher ela
🟡 Abre-se mão da agilidade de plugar um SaaS pronto e assume-se manter código customizado no legado, que já carrega dívida técnica.

## Em que condição a recomendação muda
🟡 Se o teste de adesão falhar (o vendedor não abandona o papel) ou se prazo/orçamento secarem, a recomendação passa para a Opção E (SaaS pronto) ou B (captura em duas etapas).

## Decisão do usuário
🟡 Opção A (Tempo real no app atual) , decidido por adelino em 2026-09-24T00:00:00-03:00

## A validar antes de comprometer
🟡 Rodar 1–2 semanas com os vendedores lançando no apontamento atual + PIN e medir a adesão real contra o papel. Se a maioria não largar o papel, a premissa central da Opção A está falsa.

## Riscos aceitos conscientemente
🟡 PIN colidir com a sessão PWA de 14 dias (`autenticacao-controle-acesso.md`, RNF-05) e exigir política de reset/reautenticação.
🟡 Migração/conciliação do histórico em papel e das vendas já aprovadas antes de o sistema virar fonte única (`comissoes-livro-caixa.md`).
🟡 Dados sensíveis de aluno no fluxo (LGPD, `cadastro-alunos-documentacao.md`).
🟡 Dependência de uma pessoa só na manutenção do código interno.

---
Gerado por reversa-arbiter em 2026-09-24T00:00:00-03:00
Sessão: 002-lancamento-vendas-senha
