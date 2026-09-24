# Legacy Impact: Cadastro Unificado Aluno + Venda

> Identificador: `004-cadastro-unificado-aluno-venda`
> Data: `2026-09-24`
> Política de edição do legado no momento da execução: `allowLegacyEdits: true`, `allowedPaths: ["src/app/**", "src/components/**", "src/lib/**", "supabase/**"]`
> Âncora de contexto: **greenfield** (`_reversa_sdd/` não contém `architecture.md` nem `domain.md`; ancorado em `prd.md` + specs em `_reversa_sdd/sdd/`).

## Arquivos afetados

| Arquivo afetado | Componente | Tipo | Severidade | Justificativa |
|---|---|---|---|---|
| `src/app/cadastro-unificado/page.tsx` | Frontend-Cadastro-Unificado | componente-novo | LOW | Página nova que combina cadastro de aluno e venda (RF-01..RF-09). |
| `src/components/DashboardLayout.tsx` | frontend-shell | regra-alterada | LOW | Novo item de menu "Cadastro Unificado" para GESTOR/VENDEDOR/SECRETARIA (RF-08); itens antigos preservados. |
| `src/lib/cpf.ts` | lib-format | regra-nova | LOW | Helper `maskName` para nome mascarado no alerta de duplicidade (RF-03). |
| `supabase/migrations/20260924000000_alunos_delete_owner_orphan.sql` | auth-rls | delta-de-dados | MEDIUM | Nova policy RLS `DELETE` estreita em `alunos` (compensação do aluno órfão). |

## Diff conceitual por componente

- **Frontend-Cadastro-Unificado (novo):** tela única com toggle "Incluir Venda", detecção de CPF no blur com nome mascarado e vínculo read-only, upload de comprovante (≤5MB) e orquestração cliente (INSERT aluno → upload → Edge Function `vendas`) com compensação via `DELETE` do aluno recém-criado em falha. Checklist fixo de documentos pendentes inferido por ausência em `documentos_alunos`.
- **frontend-shell:** apenas adição de um item ao array `menuItems`; nenhuma rota antiga foi removida ou renomeada.
- **lib-format:** função `maskName` adicionada sem alterar `isValidCpf`, `formatCpf` ou `formatPhone`.
- **auth-rls:** policy aditiva; `SELECT`/`INSERT` de `alunos` inalterados. Aluno com qualquer venda permanece indeletável.

## Preservadas

> Âncora greenfield: não há `_reversa_sdd/domain.md` com regras 🟢 extraídas para listar como preservadas. As invariantes de referência estão em `_reversa_sdd/decisions-gate.md` e foram respeitadas na implementação.

- 🟢 Imutabilidade da venda (`trg_prevent_vendas_data_mutation`): a feature nunca edita venda existente.
- 🟢 Livro-caixa append-only: nenhum lançamento tocado.

## Modificadas

> Âncora greenfield: sem regras 🟢 de domínio alteradas/removidas. As mudanças acima são aditivas ou restritas a `DashboardLayout`.

- `DashboardLayout.tsx`: array de menu estendido (aditivo).
- `alunos`: ganhou operação `DELETE` sob condição estreita (antes: RLS sem policy de DELETE).
