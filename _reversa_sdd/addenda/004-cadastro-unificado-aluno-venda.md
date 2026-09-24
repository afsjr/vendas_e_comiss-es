# Adendo: Cadastro Unificado Aluno + Venda

> Identificador: 004-cadastro-unificado-aluno-venda
> Data: 2026-09-24
> Cenário: greenfield

## Vigência
Vigente desde 2026-09-24.

## Resumo da entrega
Unificar cadastro de aluno e primeiro lançamento de venda numa única tela (`/cadastro-unificado`), com toggle "Incluir Venda", detecção de CPF duplicado (blur + vínculo read-only), upload de comprovante e orquestração no frontend com compensação do aluno recém-criado em caso de falha da venda. As rotas `/alunos/novo` e `/vendas/novo` permanecem intactas. Foram concluídas **13 ações**.

## Impacto por artefato da extração

| Artefato | Seção | Tipo de impacto | Delta |
|----------|-------|-----------------|-------|
| `prd.md` | RFs de cadastro e venda | componente-novo | RF-01 a RF-09 implementados: página `/cadastro-unificado`, toggle de cadastro isolado, detecção/vínculo de CPF, upload ≤5MB e feedback de sucesso |
| `sdd/cadastro-alunos-documentacao.md` | Cadastro de aluno / documentação | componente-novo | O cadastro passa a poder ser feito junto com a venda; vínculo a aluno existente por CPF sem transferir titularidade; checklist de documentos pendentes exibido sem exigir anexo |
| `sdd/apontamento-vendas-cotacoes.md` | Apontamento de venda | componente-novo | A venda pode nascer da tela unificada reutilizando a Edge Function `vendas` (SHA-256 + comissão) sem alteração de contrato |
| `sdd/autenticacao-controle-acesso.md` | RBAC / RLS | componente-novo | Nova policy RLS `DELETE` estreita em `alunos` (`criado_por = auth.uid()` e sem venda vinculada) para viabilizar a compensação; item de menu "Cadastro Unificado" para GESTOR/VENDEDOR/SECRETARIA |

## Regras sob vigilância

- Sem watch items com peso de regressão (greenfield). Os RFs implementados estão em Observações de `_reversa_forward/004-cadastro-unificado-aluno-venda/regression-watch.md` (RF-01 a RF-09).

## Fontes
- `_reversa_forward/004-cadastro-unificado-aluno-venda/requirements.md`
- `_reversa_forward/004-cadastro-unificado-aluno-venda/legacy-impact.md`
- `_reversa_forward/004-cadastro-unificado-aluno-venda/regression-watch.md`
- `_reversa_forward/004-cadastro-unificado-aluno-venda/progress.jsonl`
- `_reversa_forward/004-cadastro-unificado-aluno-venda/actions.md`
