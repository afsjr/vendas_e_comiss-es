# PL-02 — Gerar plano técnico da feature V1

## Objetivo

Transformar os requisitos da feature ativa em um plano técnico de implementação, sem escrever código.

## Instruções obrigatórias

1. Ler e seguir integralmente `.agents/skills/reversa-plan/SKILL.md`.
2. Usar a feature ativa declarada em `.reversa/active-requirements.json`.
3. Usar como fontes adicionais obrigatórias:
   - `_reversa_sdd/decisions-gate.md`
   - `.reversa/architecture-proposal.md`
   - `.reversa/collaboration-ledger.md`
4. Criar somente os artefatos permitidos pelo skill na pasta da feature ativa e um registro no ledger.

## Restrições

- Não criar código de produto, migrations executáveis, credenciais ou infraestrutura.
- Não modificar `requirements.md`, SDDs ou decisões canônicas.
- Tratar a arquitetura e o timezone `America/Sao_Paulo` como homologados.
- Não executar `reversa-to-do`; essa será a PL-03 após revisão.

## Critérios de aceite

- `roadmap.md`, `investigation.md`, `data-delta.md` e `onboarding.md` existem na feature ativa.
- Interfaces externas afetadas são documentadas se houver contratos HTTP necessários.
- O roadmap explicita RLS, upload/hash, storage privado, estados financeiros, cron de liberação, observabilidade e critérios de pronto.
- Registro no ledger informa arquivos criados e verificações executadas.
