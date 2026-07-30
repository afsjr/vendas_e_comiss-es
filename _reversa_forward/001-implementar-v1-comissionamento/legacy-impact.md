# Legacy Impact Report: V1 do Sistema de Comissionamento e Vendas

> **Data:** 2026-07-27  
> **Feature:** `001-implementar-v1-comissionamento` (Fase 1 - Preparação)  
> **Contexto:** Greenfield (sem extração de legado `/reversa`)  
> **Âncora:** `prd.md` + specs SDD em `_reversa_sdd/sdd/`

---

## ⚠️ Nota de Contexto

Este é um **projeto greenfield**. Não existe código legado anterior para impactar. Este relatório documenta os componentes novos criados na Fase 1 e seus mapeamentos às especificações SDD. 

As seções "Preservadas" e "Modificadas" abaixo permanecem vazias, pois não há regras de negócio precedentes extraídas de código existente.

---

## Tabela de Novos Componentes (Fase 1)

| Arquivo criado | Componente (SDD) | Tipo | Justificativa | Confidência |
|---|---|---|---|---|
| `supabase/migrations/001_schema.sql` | `apontamento-vendas-cotacoes.md` → tabela `vendas`, `evidencias_vendas`, enums | componente-novo (BD) | DDL fonte canônica, constraints de negócio (imutabilidade cadastral, append-only) | 🟢 |
| `supabase/migrations/001_schema.sql` | `auditoria-apontamentos.md` → tabela `vendas_historico_status`, RLS policies | componente-novo (BD) | Triggers de rastreamento, RLS granular por operação | 🟢 |
| `supabase/migrations/001_schema.sql` | `comissoes-livro-caixa.md` → tabelas `comissoes`, `livro_caixa_lancamentos` | componente-novo (BD) | Append-only ledger, imutabilidade de lançamentos contábeis | 🟢 |
| `supabase/functions/` | `apontamento-vendas-cotacoes.md` → `vendas/index.ts` | componente-novo (Edge Function TS) | Skeleton para recebimento de apontamentos e validação SHA-256 | 🟢 |
| `supabase/functions/` | `auditoria-apontamentos.md` → `auditoria-aprovar/index.ts`, `auditoria-devolver/index.ts` | componente-novo (Edge Function TS) | Skeleton para máquina de estados de aprovação/devolução | 🟢 |
| `supabase/functions/` | `comissoes-livro-caixa.md` → `fechamento-mensal/index.ts`, `liberar-comissoes-diaria/index.ts` | componente-novo (Edge Function TS + scheduled) | Skeleton para liberação diária e fechamento mensal | 🟢 |
| `supabase/functions/` | `geracao-contrato-plano-financeiro.md` → `gerar-contrato/index.ts` | componente-novo (Edge Function TS) | Skeleton para geração de PDF em template.ts | 🟢 |
| `src/app/` | `prd.md` → interface PWA Next.js 14 App Router | componente-novo (Frontend) | 6 páginas esqueleton: login, nova venda, auditoria, carteira, dashboard, alunos | 🟢 |

---

## Seção "Preservadas"

*(Vazio - projeto greenfield, nenhuma regra de código anterior a preservar)*

---

## Seção "Modificadas"

*(Vazio - projeto greenfield, nenhuma regra de código anterior a modificar)*

---

## Observações Técnicas

1. **Enums e Tipos:** `status_venda_enum`, `status_comissao_enum` criados em PostgreSQL com valores extraídos das specs SDD.
2. **RLS Strategy:** Policies implementadas separadas por operação (SELECT, INSERT, UPDATE; DELETE bloqueado) — confirmar após testes T005.
3. **Triggers:** `trg_prevent_changes_livro_caixa` (append-only) e `trg_prevent_vendas_data_mutation` (imutabilidade cadastral) — confirmar após testes T005-T007.
4. **Storage Privado:** Documentado em `architecture-proposal.md` — buckets `comprovantes`, `documentos_alunos`, `contratos_pdf` com Signed URLs 15 min.
5. **Edge Functions:** Scaffolds com assinatura básica (`OPTIONS`, `POST`/`GET`, error handling) — lógica será implementada em Fases 2-4.
6. **PWA:** Next.js 14 App Router com Tailwind, manifest, service worker — pronto para integração de lógica.

---

## Próximas Etapas

- **Fase 2 (Testes):** Validar RLS (T005), SHA-256 (T006), máquina de estados (T007)
- **Fase 3 (Núcleo):** Implementar lógica das 6 Edge Functions (T008-T013)
- **Fase 4 (Integração):** Integrar Frontend com autenticação e chamadas às Functions (T014-T018)
- **Fase 5 (Polimento):** Observabilidade, PWA service worker, seed, E2E (T019-T022)

---

## Histórico

| Data | Ação | Responsável |
|------|------|---|
| 2026-07-27 | Criação de legacy-impact.md (Fase 1) | reversa-coding |

