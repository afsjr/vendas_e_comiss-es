# Investigation — Listagem de alunos com CPF mascarado e trilha de auditoria

> Identificador: `005-listar-alunos-cpf-auditoria`
> Data: `2026-09-28`
> Objetivo: registrar a pesquisa de fundo e as alternativas antes do plano.

## 1. Superfície atual de alunos

- Existem `src/app/alunos/novo/page.tsx` e `src/app/alunos/[id]/page.tsx`; **não** existe listagem (`src/app/alunos/page.tsx`) — confirmado por listagem de diretório.
- A página de detalhe exibe `aluno.cpf` **sem máscara** (`src/app/alunos/[id]/page.tsx:61`).
- Helpers já existentes em `src/lib/cpf.ts`: `isValidCpf`, `formatCpf`, `maskName`, `formatPhone`. Falta `maskCpf`.

## 2. Padrão de mutação administrativa

- `src/app/actions/guard.ts#authorizeGestor` valida a sessão e o papel `GESTOR` no servidor.
- `src/app/actions/usuarios.ts` é o modelo de server actions (`'use server'`) com `authorizeGestor` + `admin.auth`/`admin.from`.
- O admin client usa `SUPABASE_SERVICE_ROLE_KEY` (bypassa RLS), por isso a validação de papel é server-side.

## 3. Dados e regras

- `alunos.cpf` = `VARCHAR(11) UNIQUE` em texto claro (`_reversa_sdd/data-dictionary.md#alunos`).
- Policy atual de SELECT em `alunos` libera todos os papéis (`001_schema.sql`), o que sustenta RN-07 (sem isolamento por autor).
- `DEC-04` é sobre produção de vendas, não sobre leitura cadastral.
- Padrão append-only: `trg_prevent_changes_livro_caixa` (`001_schema.sql`).

## 4. Alternativas avaliadas

| Tema | Alternativa A | Alternativa B | Escolha | Motivo |
|------|---------------|---------------|---------|--------|
| Mutação de CPF | server action (`authorizeGestor`) | Edge Function | **server action** | padrão já usado para admin (`usuarios.ts`) |
| Trilha | tabela append-only | JSONB em `alunos` | **tabela** | imutabilidade e consulta por aluno |
| Máscara | helper de UI | view/coluna no banco | **helper** | apresentação; dado permanece texto claro |
| Visibilidade da listagem | sem isolamento | filtro por autor | **sem isolamento** | RN-07 e policy atual |

## 5. Padrões do projeto

- Server actions em `src/app/actions/*.ts` com `'use server'`.
- RLS por `app_metadata.app_role`; claims no JWT do Supabase.
- Testes Deno em `tests/*.test.ts` (assert do `deno.land/std`).

## 6. Restrições

- A migration de feature é delta; não editar `001_schema.sql`.
- Mascaramento não substitui controle de acesso: a escrita é server-side e a leitura completa só é renderizada para GESTOR/AUDITOR.
