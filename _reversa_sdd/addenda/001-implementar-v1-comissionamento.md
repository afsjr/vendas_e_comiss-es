# Adendo de Sincronização: V1 do Sistema de Comissionamento e Vendas

> **Feature ID:** `001`  
> **Identificador:** `implementar-v1-comissionamento`  
> **Data de criação do adendo:** 2026-07-27  
> **Cenário:** Greenfield (projeto novo, sem legado precedente)

---

## Vigência

Vigente desde 2026-07-27.

---

## Resumo da Entrega

A **V1 do Sistema de Comissionamento e Vendas** (Feature 001) foi entregue com implementação completa de todas as 5 fases do roadmap (22 tarefas/ações T001-T022):

- **Objetivo:** Automatizar a gestão comercial e financeira de matrículas, substituindo fichas em papel e WhatsApp por um sistema PWA integrado, com auditoria obrigatória, comissões fixas por curso, apuração mensal e geração de minutas de contrato, garantindo imutabilidade contábil (Livro-Caixa append-only) e isolamento de dados por perfil via RLS no PostgreSQL.

- **Escopo:** O sistema suporta 4 personas (VENDEDOR, SECRETARIA, AUDITOR, GESTOR), implementa máquina de estados de comissões, valida comprovantes via SHA-256, e fornece dashboards de faturamento, comissões e analytics.

- **Ações completadas:** 22/22 (100%)
  - Fase 1 (Preparação): T001-T004 ✅ (4 ações)
  - Fase 2 (Testes): T005-T007 ✅ (3 ações)
  - Fase 3 (Núcleo Backend): T008-T013 ✅ (6 ações)
  - Fase 4 (Integração Frontend): T014-T018 ✅ (5 ações)
  - Fase 5 (Polimento): T019-T022 ✅ (4 ações)

---

## Impacto por Artefato da Extração

| Artefato da Extração | Seção | Tipo de Impacto | Delta |
|---|---|---|---|
| `_reversa_sdd/prd.md` | `§3. Requisitos Funcionais` | componente-novo | Todos os 8 RFs foram implementados e validados em testes (RLS T005, SHA-256 T006, máquina de estados T007). |
| `_reversa_sdd/sdd/autenticacao-controle-acesso.md` | `§2. Matriz RBAC` | componente-novo | 4 roles (VENDEDOR, SECRETARIA, AUDITOR, GESTOR) implementadas via `@supabase/ssr` + JWT em httpOnly cookies. RLS policies em `supabase/migrations/001_schema.sql` aplicadas automaticamente ao Supabase client. |
| `_reversa_sdd/sdd/apontamento-vendas-cotacoes.md` | `§1. Fluxo de Apontamento` | componente-novo | DDL em `supabase/migrations/001_schema.sql`: tabelas `vendas`, `evidencias_vendas` (hash SHA-256 UNIQUE), constraints de imutabilidade (`trg_prevent_vendas_data_mutation`). Edge Function `supabase/functions/vendas/index.ts` implementa POST com transação (INSERT vendas + evidencias + comissoes). |
| `_reversa_sdd/sdd/apontamento-vendas-cotacoes.md` | `§2. Validação de Comprovantes` | componente-novo | SHA-256 server-side via `crypto.subtle` em Edge Function `vendas`. Teste T006 valida unicidade (409 Conflict). Storage privado bucket `comprovantes/` com RLS segregado. Signed URLs 15 min implementadas em `supabase/functions/gerar-contrato/`. |
| `_reversa_sdd/sdd/auditoria-apontamentos.md` | `§1. Fila de Auditoria` | componente-novo | Edge Functions `auditoria-aprovar` e `auditoria-devolver` implementadas com máquina de estados (PENDENTE_VALIDACAO → APROVADA/DEVOLVIDA_AJUSTE). Histórico em tabela `vendas_historico_status`. Frontend `src/app/auditoria/page.tsx` exibe fila com viewer de comprovante ampliável (signed URL). |
| `_reversa_sdd/sdd/comissoes-livro-caixa.md` | `§1. Máquina de Estados` | componente-novo | Transições implementadas: AGUARDANDO_INICIO_AULAS (trava `data_inicio_curso`) → LIBERADA_PAGAMENTO (scheduled function `liberar-comissoes-diaria` cron 14:00 UTC-3) → PAGA (Edge Function `fechamento-mensal`). Teste T007 valida todas as transições. |
| `_reversa_sdd/sdd/comissoes-livro-caixa.md` | `§2. Livro-Caixa Append-Only` | componente-novo | Tabela `livro_caixa_lancamentos` com trigger `trg_prevent_changes_livro_caixa` (DELETE, UPDATE bloqueados). Edge Function `fechamento-mensal` insere créditos. Teste T005 valida imutabilidade. |
| `_reversa_sdd/sdd/geracao-contrato-plano-financeiro.md` | `§1. Geração de PDF` | componente-novo | Edge Function `supabase/functions/gerar-contrato/index.ts` + template HTML em `template.ts` implementados. Salva no Storage privado bucket `contratos_pdf/`. Retorna signed URL 15-min. |
| `_reversa_sdd/decisions-gate.md` | `§4. ADR-001: Stack TypeScript Fim-a-Fim` | componente-novo | Decisão ratificada: Next.js 14 App Router + Supabase Edge Functions (Deno/TS) + PostgreSQL 16. Backend Rust descartado (preservado em `_archive/experimento-rust-v0/` per ADR-001). |
| `_reversa_sdd/decisions-gate.md` | `§4. ADR-002: Edge Functions como Backend Canônico` | componente-novo | 6 Edge Functions de produção: `vendas`, `auditoria-aprovar`, `auditoria-devolver`, `liberar-comissoes-diaria`, `fechamento-mensal`, `gerar-contrato`. Helpers compartilhados em `_shared/client.ts`, `_shared/cors.ts`, `_shared/log.ts`. |

---

## Regras sob Vigilância

| ID | Referência | Observação |
|---|---|---|
| OBS-001 | `_reversa_forward/001-implementar-v1-comissionamento/regression-watch.md#OBS-001` | Vendas imutáveis após INSERT — validado em T005 ✅ |
| OBS-002 | `_reversa_forward/001-implementar-v1-comissionamento/regression-watch.md#OBS-002` | Livro-caixa append-only — validado em T005 ✅ |
| OBS-003 | `_reversa_forward/001-implementar-v1-comissionamento/regression-watch.md#OBS-003` | SHA-256 UNIQUE — validado em T006 ✅ |
| OBS-004 | `_reversa_forward/001-implementar-v1-comissionamento/regression-watch.md#OBS-004` | RLS granular por operação — validado em T005 ✅ |
| OBS-005 | `_reversa_forward/001-implementar-v1-comissionamento/regression-watch.md#OBS-005` | Transição AGUARDANDO → LIBERADA por data — validado em T007 ✅ |
| OBS-006 | `_reversa_forward/001-implementar-v1-comissionamento/regression-watch.md#OBS-006` | PDF em Storage privado — implementado em T013 ✅ |
| OBS-007 | `_reversa_forward/001-implementar-v1-comissionamento/regression-watch.md#OBS-007` | SHA-256 server-side Deno — implementado em T009 ✅ |

---

## Fontes

- `_reversa_forward/001-implementar-v1-comissionamento/legacy-impact.md`
- `_reversa_forward/001-implementar-v1-comissionamento/regression-watch.md`
- `_reversa_forward/001-implementar-v1-comissionamento/requirements.md`
- `_reversa_forward/001-implementar-v1-comissionamento/progress.jsonl`
- `_reversa_sdd/prd.md`
- `_reversa_sdd/sdd/autenticacao-controle-acesso.md`
- `_reversa_sdd/sdd/apontamento-vendas-cotacoes.md`
- `_reversa_sdd/sdd/auditoria-apontamentos.md`
- `_reversa_sdd/sdd/comissoes-livro-caixa.md`
- `_reversa_sdd/sdd/geracao-contrato-plano-financeiro.md`
- `_reversa_sdd/decisions-gate.md`

---

**Este adendo foi gerado automaticamente pelo `/reversa-sync` em 2026-07-27. Mantém a extração legível até a próxima re-extração via `/reversa`.**
