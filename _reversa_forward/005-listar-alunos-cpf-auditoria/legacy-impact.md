# Legacy Impact — Listagem de alunos com CPF mascarado e trilha de auditoria

> Identificador: `005-listar-alunos-cpf-auditoria`
> Data: `2026-09-28`
> Cenário: **greenfield** — sem legado pré-existente extraído de código. Âncora: `prd.md` + specs em `_reversa_sdd/sdd/`.
> Política de edição do legado: `allowLegacyEdits: true`; caminhos liberados usados: `src/app/**`, `src/components/**`, `src/lib/**`, `supabase/**`, `tests/**`.

## Arquivos afetados

| Arquivo afetado | Componente (spec SDD) | Tipo | Severidade | Justificativa |
|-----------------|-----------------------|------|------------|---------------|
| `supabase/migrations/20260928000001_alunos_cpf_historico.sql` | `autenticacao-controle-acesso` | delta-de-dados | HIGH | Nova tabela append-only `alunos_cpf_historico` com RLS GESTOR/AUDITOR |
| `src/lib/cpf.ts` | `cadastro-alunos-documentacao` | componente-novo | MEDIUM | Helper `maskCpf` (`ddd.****.dddd`) para a apresentação |
| `src/app/actions/alunos.ts` | `cadastro-alunos-documentacao` | componente-novo | HIGH | Server action `corrigirCpf` com `authorizeGestor`, validação e motivo obrigatório |
| `src/app/alunos/page.tsx` | `cadastro-alunos-documentacao` | componente-novo | MEDIUM | Listagem `/alunos` com busca e CPF mascarado por papel |
| `src/app/alunos/[id]/page.tsx` | `cadastro-alunos-documentacao` | regra-alterada | MEDIUM | Detalhe passa a exibir CPF por papel, correção e histórico |
| `src/components/DashboardLayout.tsx` | `autenticacao-controle-acesso` | componente-novo | LOW | Item de menu "Alunos" |
| `tests/alunos_cpf.test.ts` | `cadastro-alunos-documentacao` | componente-novo | LOW | Cobertura de `maskCpf`/`isValidCpf` |

## Diff conceitual por componente

- **`cadastro-alunos-documentacao`**: `alunos.cpf` passa a ser editável pelo `GESTOR`, com validação (formato + dígito verificador + unicidade) e **motivo obrigatório**; cada alteração gera registro imutável. A listagem é nova e sem isolamento por autor.
- **`autenticacao-controle-acesso`**: nova superfície de leitura restrita a GESTOR/AUDITOR para o histórico; escrita de CPF server-side via `authorizeGestor`.

## Preservadas

> Feature greenfield, sem legado pré-existente extraído de código. Nada a listar.

## Modificadas

> Sem regras 🟢 extraídas de código. O delta recai sobre as specs `_reversa_sdd/sdd/cadastro-alunos-documentacao.md` (CPF editável com trilha) e `_reversa_sdd/sdd/autenticacao-controle-acesso.md` (nova tabela/policies).
