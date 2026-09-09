# Actions: Kanban de Pós-Venda

> Identificador: `003-kanban-pos-venda`
> Data: `2026-09-09`
> Roadmap: `_reversa_forward/003-kanban-pos-venda/roadmap.md`

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de ações | 16 |
| Paralelizáveis (`[//]`) | 11 |
| Maior cadeia de dependência | 5 (T001→T002→T008→T012→T016) |

## Fase 1, Preparação

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T001 | Migration: `ALTER TYPE status_venda_enum ADD VALUE` (`AGUARDANDO_FINANCEIRO`, `AGUARDANDO_PAGAMENTO_1M`, `PRIMEIRA_MENSALIDADE_PAGA`, `CANCELADA`); `ALTER TABLE vendas ADD COLUMN contrato_storage_path`, `boleto_referencia`, `comprovante_pgto_1m_path`; DROP/recriar CHECK de `perfis.role` com `FINANCEIRO` | - | `[//]` | `supabase/migrations/20260909000000_postvenda_status.sql` | 🟢 | `[X]` |
| T002 | Migration RLS: adicionar `FINANCEIRO` nas policies SELECT de `vendas`, `evidencias_vendas`, `vendas_historico_status`, `comissoes` | T001 | - | `supabase/migrations/20260909000001_postvenda_rls.sql` | 🟢 | `[X]` |
| T003 | Tipos TS: adicionar 4 status novos em `StatusVenda` e `FINANCEIRO` em `AppRole`/`UserRole` | - | `[//]` | `src/types/index.ts`, `supabase/functions/_shared/types.ts` | 🟢 | `[X]` |
| T004 | `atualizarRole`: após upsert em `perfis.role`, sincronizar `auth.admin.updateUserById({ app_metadata: { app_role: newRole } })` | - | `[//]` | `src/app/actions/usuarios.ts` | 🟡 | `[X]` |
| T005 | Admin: adicionar opção "Financeiro" no select de papel da gestão de usuários | T003 | `[//]` | `src/app/admin/usuarios/page.tsx` | 🟢 | `[X]` |

## Fase 2, Testes

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T006 | Teste Deno: máquina de estados do pós-venda — todas as transições da matriz (`postvenda-mover`), travas (sem `contrato_storage_path`/`comprovante_pgto_1m_path`/`boleto_referencia`/`motivo` falham), cancelamento → comissão `ESTORNADA`, devolução registra motivo | T003 | `[//]` | `tests/postvenda_state_machine.test.ts` | 🟢 | `[X]` |
| T007 | Teste Deno: gate do `liberar-comissoes-diaria` — venda sem `PRIMEIRA_MENSALIDADE_PAGA` (ou `APROVADA`) não libera comissão mesmo com `data_inicio_curso` vencida | T003 | `[//]` | `tests/comissao_gate_postvenda.test.ts` | 🟡 | `[X]` |

## Fase 3, Núcleo

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T008 | Edge Function `postvenda-mover/index.ts`: matriz de transições por papel (SECRETARIA/FINANCEIRO), validação de travas server-side (paths + `boleto_referencia` + `motivo`), UPDATE de `vendas` (status + coluna contraprova), efeito colateral `comissões`→`ESTORNADA` em cancelamento, INSERT em `vendas_historico_status` com `mudado_por` do JWT | T001, T002, T006 | - | `supabase/functions/postvenda-mover/index.ts` | 🟢 | `[X]` |
| T009 | Alterar `auditoria-aprovar`: condição de partida de `PENDENTE_VALIDACAO` para `PRIMEIRA_MENSALIDADE_PAGA` | T001 | `[//]` | `supabase/functions/auditoria-aprovar/index.ts` | 🟢 | `[X]` |
| T010 | Alterar `auditoria-devolver`: condição de partida de `PENDENTE_VALIDACAO` para `PRIMEIRA_MENSALIDADE_PAGA` | T001 | `[//]` | `supabase/functions/auditoria-devolver/index.ts` | 🟢 | `[X]` |
| T011 | Alterar `liberar-comissoes-diaria`: gate da liberação por `vendas.status IN ('PRIMEIRA_MENSALIDADE_PAGA','APROVADA')` (join com vendas) | T001, T007 | `[//]` | `supabase/functions/liberar-comissoes-diaria/index.ts` | 🟡 | `[X]` |

## Fase 4, Integração

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T012 | Página `/postvenda/page.tsx`: kanban por papel (colunas SECRETARIA/FINANCEIRO/AUDITOR-GESTOR), upload via `react-dropzone` (bucket `contratos_pdf` para Secretaria, `comprovantes` para Financeiro), ação gera `POST /functions/v1/postvenda-mover`, redirect de segurança para papel não hábil | T008, T003 | - | `src/app/postvenda/page.tsx` | 🟢 | `[X]` |
| T013 | `DashboardLayout`: item de navegação "Pós-Venda" → `/postvenda` para `SECRETARIA`, `FINANCEIRO`, `GESTOR`, `AUDITOR` | T003 | `[//]` | `src/components/DashboardLayout.tsx` | 🟢 | `[X]` |
| T014 | `auditoria/page.tsx`: trocar filtro de `PENDENTE_VALIDACAO` para `PRIMEIRA_MENSALIDADE_PAGA` e exibir link do contrato quando houver | T003 | `[//]` | `src/app/auditoria/page.tsx` | 🟢 | `[X]` |

## Fase 5, Polimento

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T015 | Telemetria: usar `_shared/log.ts` nos fluxos de sucesso/erro de `postvenda-mover` (registrar ids/caminhos, nunca conteúdo de arquivo nem texto de `boleto_referencia`) | T008, T009, T010 | - | `supabase/functions/postvenda-mover/index.ts`, `supabase/functions/auditoria-aprovar/index.ts`, `supabase/functions/auditoria-devolver/index.ts` | 🟢 | `[X]` |
| T016 | Feedback visual de travas e mensagens de erro consistentes na UI do Kanban (botão desabilitado sem trava, alerta claro por erro `TRABVA_BLOQUEADA`/`INVALID_STATE`) | T012 | - | `src/app/postvenda/page.tsx` | 🟢 | `[X]` |

## Notas de execução

X 2026-09-09: T001/T002 aplicadas como novas migrations (sem editar 001_schema.sql). T008 usa storage.list() para provar existência do arquivo da trava (não confia só no campo). T015 embutida em T008/T009/T010 (telemetria via _shared/log.ts, sem conteúdo de arquivo nem texto de boleto). T012/T016 na mesma passada (feedback de travas nativa da UI). `npx tsc --noEmit` passou; Deno check das 4 Edge Functions passou; 19 testes Deno novos passaram. `npm run lint` exige setup interativo de ESLint (projeto sem .eslintrc — pré-existente), não executado; Prettier já falhava nos arquivos pré-existentes (sem regressão desta feature).

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-09 | Versão inicial gerada por `/reversa-to-do` | reversa |