# Adendo: Kanban de Pós-Venda

> Identificador: 003-kanban-pos-venda
> Data: 2026-09-09
> Cenário: greenfield

## Vigência
Vigente desde 2026-09-09.

## Resumo da entrega
Escalonar o fluxo de pós-venda com travas antifraude (RN-03 a RN-06): a venda nova passa por contraprovas sequenciais entre Secretaria e Financeiro (contrato assinado → boleto emitido → 1ª mensalidade paga), com devolução, cancelamento e destravamento de comissão somente após o pagamento da 1ª mensalidade. Foram concluídas **16 ações**.

## Impacto por artefato da extração

| Artefato | Seção | Tipo de impacto | Delta |
|----------|-------|-----------------|-------|
| `prd.md` | RFs da feature de pós-venda | componente-novo | RF-01 a RF-08 implementados: fila da Secretaria, fila do Financeiro, confirmação de 1ª mensalidade, RLS estrito por papel, histórico de ações, devoluções e destravamento de comissão |
| `sdd/geracao-contrato-plano-financeiro.md` | Contrato e plano financeiro | componente-novo | Pipeline de contraprovas com 3 travas (`contrato_storage_path`, `boleto_referencia`, `comprovante_pgto_1m_path`) validadas server-side por `postvenda-mover`; kanban `/postvenda` para SECRETARIA e FINANCEIRO |
| `sdd/auditoria-apontamentos.md` | Fila de auditoria | componente-novo | Auditoria final re-ancorada em `PRIMEIRA_MENSALIDADE_PAGA` (aprovar e devolver) e fila do frontend com link do contrato |
| `sdd/comissoes-livro-caixa.md` | Liberação de comissões | componente-novo | Gate do `liberar-comissoes-diaria` exige venda em `PRIMEIRA_MENSALIDADE_PAGA` (ou `APROVADA`); cancelamento estorna a comissão |
| `sdd/autenticacao-controle-acesso.md` | RBAC / RLS | componente-novo | Papel `FINANCEIRO` (JWT `app_metadata.app_role` + CHECK de `perfis.role`); sync `perfis.role → app_metadata` em `atualizarRole` (D-10) |

## Regras sob vigilância

- Sem watch items com peso de regressão (greenfield). Os RFs implementados estão em Observações de `_reversa_forward/003-kanban-pos-venda/regression-watch.md` (RF-01 a RF-08).

## Fontes
- `_reversa_forward/003-kanban-pos-venda/requirements.md`
- `_reversa_forward/003-kanban-pos-venda/legacy-impact.md`
- `_reversa_forward/003-kanban-pos-venda/regression-watch.md`
- `_reversa_forward/003-kanban-pos-venda/progress.jsonl`
- `_reversa_forward/003-kanban-pos-venda/actions.md`