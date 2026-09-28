# Onboarding — Listagem de alunos com CPF mascarado e trilha de auditoria

> Identificador: `005-listar-alunos-cpf-auditoria`
> Data: `2026-09-28`
> Para: pessoa que vai testar a feature pela primeira vez.

## 1. Pré-requisitos

- App rodando (`npm run dev`) e a migration `20260928000001_alunos_cpf_historico.sql` aplicada.
- Usuários de teste com papéis distintos: `VENDEDOR`, `SECRETARIA`, `AUDITOR`, `GESTOR` (ver `scripts/seed_test_users.ts`).
- Pelo menos um aluno cadastrado, de preferência com um CPF inválido para o teste de correção.

## 2. Passo a passo

1. Entre como **VENDEDOR**, acesse **Alunos** (`/alunos`) e confirme:
   - a lista mostra **todos** os alunos;
   - o CPF aparece como `123.****.8900`;
   - não há ação de editar CPF.
2. Repita com **SECRETARIA** (mesmo comportamento de máscara).
3. Entre como **GESTOR**: confirme CPF **completo** e a ação de **corrigir CPF**.
4. Abra um aluno com CPF inválido e tente salvar:
   - sem **motivo** → bloqueado;
   - com CPF inválido → bloqueado;
   - com CPF de outro aluno → bloqueado (unicidade);
   - com CPF válido + motivo → salvo.
5. Confirme que a alteração aparece no **histórico de CPF** na página do aluno (valor anterior, novo, motivo, autor, data/hora).
6. Entre como **AUDITOR**: confirme que vê CPF completo e o histórico.
7. Tente, via requisição direta à server action, corrigir CPF como VENDEDOR → deve retornar acesso negado.

## 3. Verificação técnica

- `npx tsc --noEmit` sem erros.
- `deno test tests/alunos_cpf.test.ts` (helpers `maskCpf`/`isValidCpf`).

## 4. O que observar

| Sinal | Significado |
|-------|-------------|
| VENDEDOR/SECRETARIA vendo CPF completo | Bug de mascaramento |
| Correção sem gravar no histórico | Bug de trilha |
| UPDATE/DELETE no histórico funcionando | Trigger append-only quebrado |
| VENDEDOR conseguindo corrigir | Falha no guard server-side |
