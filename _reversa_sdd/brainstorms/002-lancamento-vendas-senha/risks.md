# Risks, lancamento-vendas-senha

> Selo 🟡 PLANEJADO em todos os itens. Documento adversarial por design.

## Premortem
🟡 **H1 — "Vendedores abandonaram o sistema e voltaram para o papel."** causa raiz: falha de adesão; a fricção de lançamento não caiu o bastante dentro do app atual.
🟡 **H2 — "Comissão paga em dobro, de novo, agora com dashboard bonito."** causa raiz: o sistema não virou fonte única da verdade; histórico em papel e vendas antigas não foram conciliados.
🟡 **H3 — "Venda lançada no nome do colega com o PIN dele; ninguém desconfiou."** causa raiz: PIN prova autoria digitada, não identidade real.
🟡 **H4 — "Direção decidiu corte de curso com base em número errado do funil."** causa raiz: dados incompletos/duplicados no dashboard, sem conciliação.

**Manchete que mais assusta o usuário:** 🟡 H1 (adesão) seguida de H2 (fonte única). Ordem de severidade do documento segue esse ranking.

---

## Opção A, Tempo real no app atual
- **Premissa que mata:** 🟡 O vendedor prefere lançar no app, com PIN, a continuar no papel.
- **Teste barato da premissa:** 🟡 Rodar 1 a 2 semanas com os vendedores usando o apontamento atual + PIN e comparar adesão real contra o papel.
- **Custo escondido:** 🟡 O PIN colide com a sessão PWA de 14 dias (`autenticacao-controle-acesso.md`, RNF-05): exige reautenticação em ponto do fluxo, política de reset e armazenamento seguro do PIN; e o fechamento por competência (`comissoes-livro-caixa.md`) obriga a conciliar o histórico em papel antes de confiar no status.
- **Ponto sem volta:** 🟡 Quando o fechamento de comissão passar a depender só do sistema e o papel for aposentado.

## Opção B, Captura rápida em duas etapas
- **Premissa que mata:** 🟡 O vendedor volta depois para complementar o cadastro (disciplina sem trava).
- **Teste barato da premissa:** 🟡 Protótipo de "rascunho" e medir, em 1 semana, a taxa de vendas complementadas até o fim do dia.
- **Custo escondido:** 🟡 Introduz um estado intermediário em `vendas`, que reverbera na máquina de estados já homologada (`decisions-gate.md`, `status_comissao`) e na auditoria (`auditoria-apontamentos.md`); risco de registros presos em rascunho travando a comissão.
- **Ponto sem volta:** 🟡 Quando a apuração de comissão começar a contar com registros incompletos e a régua de cobrança virar dependência.

## Opção C, Entrada por canal conversacional
- **Premissa que mata:** 🟡 Custo, limite e confiabilidade da API de mensageria se sustentam no volume da escola.
- **Teste barato da premissa:** 🟡 `[sem teste barato disponível]` — exige integração real com WhatsApp Business API e aprovação do provedor.
- **Custo escondido:** 🟡 Dados PII de aluno trafegando por terceiro (`cadastro-alunos-documentacao.md`, LGPD), autenticação/identidade paralela ao login, conciliação de foto/áudio e dependência de vendor.
- **Ponto sem volta:** 🟡 Quando o canal virar a porta principal e desligá-lo implicar perda de histórico e retreino da equipe.

## Opção sempre presente, não construir
- **Premissa que mata:** 🟡 A equipe executa o combinado sem uma trava de software impondo.
- **Teste barato da premissa:** 🟡 Rodar 1 semana com folha única padronizada + conferência semanal e medir erros/atrasos.
- **Custo escondido:** 🟡 Nenhum de código; o custo é humano — o erro e o pagamento duplicado continuam possíveis e pioram com o crescimento da equipe.
- **Ponto sem volta:** 🟡 Nenhum, é reversível a qualquer momento.

## Opção sempre presente, usar algo pronto
- **Premissa que mata:** 🟡 A ferramenta de prateleira permite PIN/autoria e checklist de devolução e integra ao legado.
- **Teste barato da premissa:** 🟡 Configurar um protótipo em Forms/Pipefy em 1 dia e validar se as travas existem.
- **Custo escondido:** 🟡 Dupla fonte da verdade exige conciliação com `comissoes-livro-caixa.md`; licenças por usuário; exportação/BI; e dados de aluno em terceiro (LGPD).
- **Ponto sem volta:** 🟡 Quando os dados de venda passam a viver no SaaS e a extração/retirada vira dependência.

---

## Riscos transversais
🟡 **Dependência de uma pessoa só:** manutenção do desenvolvimento interno concentrada; se essa pessoa sair, evoluções param.
🟡 **Dados sensíveis / LGPD:** dados de aluno e comprovantes entram no fluxo (`cadastro-alunos-documentacao.md`).
🟡 **Integração com terceiro fora de controle:** aplica-se às opções C e "usar algo pronto" (mensageria/SaaS).
🟡 **Migração de dados existentes:** papel e vendas já aprovadas precisam ser conciliados antes de confiar no status (`comissoes-livro-caixa.md`).
🟡 **Fluxo de autenticação/permissão sendo tocado:** PIN + RLS por vendedor (`autenticacao-controle-acesso.md`).

## O que precisa ser respondido antes de decidir
🟡 O PIN complementa ou substitui o login PWA de 14 dias, e em que ponto exato do fluxo ele é exigido?
🟡 Qual o volume real (vendas/mês e nº de vendedores)? Isso decide se SaaS por usuário compensa.
🟡 Há veto a dependência externa e a dados de aluno em terceiros (LGPD)?
🟡 Como conciliar o histórico de papel e as vendas já aprovadas antes de o novo fluxo virar fonte única?
🟡 Quem mantém o processo e o sistema depois da entrega (mitigar dependência de uma pessoa)?

---
Gerado por reversa-challenger em 2026-09-24T00:00:00-03:00
Sessão: 002-lancamento-vendas-senha
