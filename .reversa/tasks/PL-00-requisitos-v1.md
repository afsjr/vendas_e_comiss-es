# PL-00 — Consolidar requisitos executáveis da V1

## Objetivo

Criar a feature forward e seu `requirements.md`, consolidando o PRD, os oito SDDs, o gate de decisões e a arquitetura homologada como requisito executável da V1.

## Fontes obrigatórias

1. `AGENTS.md`
2. `_reversa_sdd/decisions-gate.md`
3. `_reversa_sdd/prd.md`
4. `_reversa_sdd/sdd/*.md`
5. `.reversa/architecture-proposal.md`
6. `.reversa/collaboration-ledger.md`
7. `.agents/skills/reversa-requirements/SKILL.md`

## Escopo permitido

- Criar a feature ativa dentro de `_reversa_forward/` conforme o skill `reversa-requirements`.
- Criar ou atualizar `.reversa/active-requirements.json` conforme o skill.
- Atualizar somente `.reversa/collaboration-ledger.md` com o registro de entrega.

## Requisito de contexto para a feature

"Implementar a V1 do Sistema de Comissionamento e Vendas: PWA para venda/cotação, cadastro e documentos de aluno, comprovante único, auditoria, comissão fixa liberada somente após aprovação e início das aulas, livro-caixa imutável, contratos com entrada inicial e dashboard mensal. Arquitetura homologada: Next.js/Vercel, Rust Axum/SQLx/Fly.io, Supabase Cloud/Auth/Storage, Typst e timezone America/Sao_Paulo."

## Critérios de aceite

- O requirements preserva integralmente DEC-01 a DEC-07 e a arquitetura homologada.
- Inclui critérios de aceite para RLS, hash SHA-256 único, estados de venda/comissão, livro-caixa e timezone de negócio.
- Não contém mais de três `[DÚVIDA]`; não inventa decisões de negócio.
- Nenhum código ou migration é criado.
- Registra a entrega no ledger como `pronto para revisão`.
