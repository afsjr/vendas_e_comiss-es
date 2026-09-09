# Legacy Impact — Kanban de Pós-Venda

> Feature greenfield, sem legado pré-existente. Âncora: `prd.md` + specs SDD (`_reversa_sdd/sdd/`).
> Identificador: `003-kanban-pos-venda`
> Data: `2026-09-09`

## 1. Arquivos afetados

| Arquivo | Componente (spec SDD) | Tipo | Severidade | Justificativa |
|---------|----------------------|------|------------|---------------|
| `supabase/migrations/20260909000000_postvenda_status.sql` | `geracao-contrato-plano-financeiro.md` | componente-novo | MEDIUM | Novo enum de pós-venda + colunas de contraprova + papel FINANCEIRO |
| `supabase/migrations/20260909000001_postvenda_rls.sql` | `autenticacao-controle-acesso.md` | componente-novo | MEDIUM | RLS: FINANCEIRO passou a ler vendas/evidências/histórico/comissões |
| `supabase/functions/postvenda-mover/index.ts` | `geracao-contrato-plano-financeiro.md` | componente-novo | HIGH | Nova Edge Function — matriz de transições e travas do pós-venda |
| `supabase/functions/auditoria-aprovar/index.ts` | `auditoria-apontamentos.md` | componente-novo | HIGH | Aprovação re-ancorada em PRIMEIRA_MENSALIDADE_PAGA |
| `supabase/functions/auditoria-devolver/index.ts` | `auditoria-apontamentos.md` | componente-novo | HIGH | Devolução do Auditor re-ancorada em PRIMEIRA_MENSALIDADE_PAGA |
| `supabase/functions/liberar-comissoes-diaria/index.ts` | `comissoes-livro-caixa.md` | componente-novo | MEDIUM | Gate de liberação exige PRIMEIRA_MENSALIDADE_PAGA/APROVADA |
| `supabase/functions/_shared/types.ts` | `autenticacao-controle-acesso.md` | componente-novo | MEDIUM | StatusVenda +7 e UserRole +FINANCEIRO |
| `src/types/index.ts` | `autenticacao-controle-acesso.md` | componente-novo | LOW | AppRole +FINANCEIRO, StatusVenda novo |
| `src/app/actions/usuarios.ts` | `autenticacao-controle-acesso.md` | componente-novo | MEDIUM | Sync perfis.role → auth app_metadata (D-10) |
| `src/app/admin/usuarios/page.tsx` | `autenticacao-controle-acesso.md` | componente-novo | LOW | Opção "Financeiro" no seletor de papel |
| `src/app/postvenda/page.tsx` | `geracao-contrato-plano-financeiro.md` | componente-novo | HIGH | Kanban do pós-venda por papel (React/Dropzone) |
| `src/components/DashboardLayout.tsx` | `autenticacao-controle-acesso.md` | componente-novo | LOW | Item de navegação "Pós-Venda" |
| `src/app/auditoria/page.tsx` | `auditoria-apontamentos.md` | componente-novo | MEDIUM | Fila filtrada por PRIMEIRA_MENSALIDADE_PAGA + link do contrato |
| `tests/postvenda_state_machine.test.ts` | `geracao-contrato-plano-financeiro.md` | componente-novo | LOW | Suíte da máquina de estados (13 casos) |
| `tests/comissao_gate_postvenda.test.ts` | `comissoes-livro-caixa.md` | componente-novo | LOW | Suíte do gate de liberação (6 casos) |

## 2. Diff conceitual por componente

### `geracao-contrato-plano-financeiro.md`
O ciclo "pendente → aprovada/devolvida" ganhou um pipeline de contraprovas
(contrato assinado → boleto emitido → 1ª mensalidade paga). A especificação de
geração de contrato/plano financeiro agora tem três travas transitórias
(`contrato_storage_path`, `boleto_referencia`, `comprovante_pgto_1m_path`)
validadas server-side pela Edge Function `postvenda-mover`.

### `auditoria-apontamentos.md`
Deixou de existir a auditoria de vendas novas: a fila de auditoria passa a
operar sobre vendas em `PRIMEIRA_MENSALIDADE_PAGA` (RN-02). Devolução do Auditor
segue o mesmo ancoramento.

### `comissoes-livro-caixa.md`
A liberação rotineira de comissões condicionou o backend adicional de "1ª
mensalidade paga (ou aprovada)" — comissão não é mais liberada por venda apenas
`APROVADA` no fluxo antigo (vendas ainda em `APROVADA` continuam elegíveis).

### `autenticacao-controle-acesso.md`
Novo papel `FINANCEIRO` no RBAC (JWT `app_metadata.app_role` + CHECK de
`perfis.role`). `atualizarRole` agora sincroniza o papel para o `app_metadata`
do Auth (gap da feature 002 corrigido), necessário para as policies baseadas em
JWT enxergarem o papel.

## 3. Preservadas

Sem legado pré-existente (greenfield). Não há regras 🟢 do `domain.md` a listar.

## 4. Modificadas

Sem legado pré-existente (greenfield). Não há regras 🟢 alteradas ou removidas.