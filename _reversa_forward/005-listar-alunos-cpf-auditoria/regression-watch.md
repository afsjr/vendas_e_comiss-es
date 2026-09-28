# Regression Watch — Listagem de alunos com CPF mascarado e trilha de auditoria

> Identificador: `005-listar-alunos-cpf-auditoria`
> Data: `2026-09-28`
> Cenário: greenfield (âncora: `prd.md` + specs em `_reversa_sdd/sdd/`). Sem regras 🟢 extraídas de código ainda.

## Watch principal

| ID | Origem (arquivo, seção) | Regra esperada após mudança | Tipo de verificação | Sinal de violação |
|----|--------------------------|------------------------------|---------------------|-------------------|
| — | — | Nenhum item com peso de regressão nesta rodada (greenfield) | — | — |

## Observações (sem peso de regressão)

RFs implementados; ganham peso quando uma futura extração `/reversa` os confirmar como 🟢.

| Item | Descrição | Onde verificar |
|------|-----------|----------------|
| RF-01 | Listagem `/alunos` com busca por nome, e-mail e CPF | `src/app/alunos/page.tsx` |
| RF-02 | CPF mascarado (`ddd.****.dddd`) para VENDEDOR/SECRETARIA; completo para GESTOR/AUDITOR | `src/lib/cpf.ts#maskCpf`, listagem e detalhe |
| RF-03 | Indicação de CPF inválido | `src/app/alunos/page.tsx` (ícone) e detalhe (badge) |
| RF-04 | Correção de CPF pelo GESTOR com validação e motivo obrigatório | `src/app/actions/alunos.ts#corrigirCpf` |
| RF-05 | Registro imutável da alteração | `alunos_cpf_historico` + trigger append-only |
| RF-06 | Consulta do histórico na página do aluno (GESTOR/AUDITOR) | `src/app/alunos/[id]/page.tsx` |
| RF-07 | Bloqueio server-side para não-GESTOR | `authorizeGestor` em `corrigirCpf` |

## Histórico de re-extrações

| Data | Extração | Resultado |
|------|----------|-----------|
| — | — | — |

## Arquivadas

| ID | Motivo | Data |
|----|--------|------|
| — | — | — |
