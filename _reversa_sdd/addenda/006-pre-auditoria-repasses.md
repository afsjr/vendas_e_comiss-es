# Adendo: Pré-auditoria de repasses de Graduação

> Identificador: 006-pre-auditoria-repasses
> Data: 2026-09-28
> Cenário: greenfield

## Vigência
Vigente desde 2026-09-28.

## Resumo da entrega
Disponibiliza ao GESTOR uma pré-auditoria automática de comissão para cursos de Graduação, a partir do upload do relatório de repasses em CSV e da conciliação dos alunos por CPF. Para cada venda de Graduação pendente de liberação, o sistema informa se a 1ª mensalidade já foi repassada (`R101` com `Mensalidade = 1` e `Valor_Repasse > 0`), marcando `APARECEU`, `NAO_APARECEU` ou `AMBIGUO`; a confirmação humana em lote move a comissão para `LIBERADA_PAGAMENTO`. Sem relatório, ou para Técnico/Pós-Graduação/Cursos Livres, permanece a validação manual em `/auditoria`. Foram concluídas **11 ações**.

## Impacto por artefato da extração

| Artefato | Seção | Tipo de impacto | Delta |
|----------|-------|-----------------|-------|
| `prd.md` | Requisitos de auditoria/comissões | componente-novo | RF-01 a RF-10 implementados: upload CSV, parser robusto, conciliação por CPF, resultado com competência da parcela 1, confirmação em lote com liberação, fallback manual, trilha imutável, acesso GESTOR e marcação de ambiguidade |
| `sdd/auditoria-apontamentos.md` | Não-objetivos (NG-03) | regra-alterada | O não-objetivo "sem conciliação automatizada" deixa de valer para Graduação com relatório CSV; a conferência manual continua como fallback em `/auditoria` |
| `sdd/comissoes-livro-caixa.md` | Liberação de comissões | regra-alterada | A comissão de Graduação pode ir a `LIBERADA_PAGAMENTO` por confirmação da pré-auditoria (parcela 1 repassada), sem alterar a estrutura de `comissoes` |
| `sdd/autenticacao-controle-acesso.md` | RBAC / RLS | componente-novo | Nova superfície exclusiva de `GESTOR`: tabelas `relatorios_repasse`/`resumo_repasse_aluno`/`conciliacoes_repasse`, bucket `relatorios_repasse` e rota `/pre-auditoria`, com validação server-side |
| `sdd/dashboard-gerencial-relatorios.md` | Painéis gerenciais | componente-novo | Nova página `/pre-auditoria` de upload e revisão em lote; telas existentes inalteradas |
| `addenda/005-auditoria-primeiro-checklist-dashboard.md` | Fluxo de comissão | regra-alterada | A liberação na 1ª mensalidade ganha uma via automática (pré-auditoria por relatório) para Graduação, mantendo a via manual vigente |

## Regras sob vigilância

Nenhum watch item com peso de regressão nesta rodada (cenário greenfield). Os itens acompanhados são observações em `_reversa_forward/006-pre-auditoria-repasses/regression-watch.md` (RF-01 a RF-10).

## Fontes
- `_reversa_forward/006-pre-auditoria-repasses/requirements.md`
- `_reversa_forward/006-pre-auditoria-repasses/legacy-impact.md`
- `_reversa_forward/006-pre-auditoria-repasses/regression-watch.md`
- `_reversa_forward/006-pre-auditoria-repasses/progress.jsonl`
- `_reversa_forward/006-pre-auditoria-repasses/actions.md`
