# Actions: V1 do Sistema de Comissionamento e Vendas

> Identificador: `001-implementar-v1-comissionamento`
> Data: `2026-07-25` · **Revisado em `2026-07-27` para a stack TypeScript (ADR-001/002)**
> Roadmap: `_reversa_forward/001-implementar-v1-comissionamento/roadmap.md`

> **Nota de revisão (2026-07-27):** a versão original descrevia um scaffold Rust/Axum com testes `.rs` e todas as ações marcadas `[X]`. Como o backend Rust **não compila** contra o DDL canônico e a stack homologada é TypeScript (Edge Functions), as ações foram reescritas para TS e os status **resetados para `[ ]`** — nenhuma mutação foi implementada em TS ainda.

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de ações | 22 |
| Paralelizáveis (`[//]`) | 17 |
| Maior cadeia de dependência | 6 |

## Fase 1, Preparação

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T001 | Aplicar schema DDL `supabase/migrations/001_schema.sql` (fonte canônica): enums (`status_venda_enum`, `status_comissao_enum`), tabelas (`cursos`, `vendas`, `evidencias_vendas`, `vendas_historico_status`, `comissoes`, `livro_caixa_lancamentos`), constraints (`unique_hash_sha256`, `ON DELETE RESTRICT`), triggers append-only (`trg_prevent_changes_livro_caixa`) e de imutabilidade cadastral (`trg_prevent_vendas_data_mutation`), políticas RLS granulares por operação (`SELECT`, `INSERT`, `UPDATE`) | - | `[//]` | `supabase/migrations/001_schema.sql` | 🟢 | `[X]` |
| T002 | Configurar buckets de Storage Privado no Supabase: `comprovantes`, `documentos_alunos`, `contratos_pdf` com policies de Signed URLs (15 min expiry) e Signed Upload URLs para o frontend | - | `[//]` | `architecture-proposal.md` | 🟢 | `[X]` |
| T003 | Scaffold das Edge Functions (Deno/TS): `supabase functions new` para `vendas`, `auditoria-aprovar`, `auditoria-devolver`, `fechamento-mensal`, `gerar-contrato` e a scheduled function `liberar-comissoes-diaria`. Definir tipos TS compartilhados alinhados ao DDL (`status_venda`, `valor_comissao_fixo`, `valor_entrada`) em `_shared/types.ts` | - | `[//]` | `supabase/functions/` | 🟢 | `[X]` |
| T004 | Scaffold do projeto Next.js PWA: `create-next-app` com TypeScript + Tailwind, configurar PWA (manifest.json, service worker), instalar dependências (`@supabase/supabase-js`, `@supabase/ssr`, `lucide-react`, `react-dropzone`) | - | `[//]` | `package.json` | 🟢 | `[X]` |

## Fase 2, Testes

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T005 | Escrever testes de integração RLS (pgTAP ou `deno test`): (1) injeção de `criado_por` por VENDEDOR/SECRETARIA deve falhar, (2) SELECT isolation entre vendedores retorna 0 registros, (3) AUDITOR/GESTOR veem todas as vendas, (4) DELETE é bloqueado para todos | T001 | `[//]` | `tests/rls_integration.test.ts` | 🟢 | `[X]` |
| T006 | Escrever testes de validação SHA-256 server-side na Edge Function: (1) recálculo correto do hash via `crypto.subtle`, (2) upload duplicado retorna HTTP 409 Conflict, (3) envio concorrente é rejeitado pela constraint unique | T001, T003 | `[//]` | `tests/sha256_validation.test.ts` | 🟢 | `[X]` |
| T007 | Escrever testes da máquina de estados de comissão: (1) transição PENDENTE_VALIDACAO → APROVADA, (2) trava `data_inicio_curso > HOJE` mantém `AGUARDANDO_INICIO_AULAS`, (3) transição para `LIBERADA_PAGAMENTO` ao atingir data, (4) estorno gera `ESTORNADA` + contra-lançamento no livro-caixa | T001, T003 | `[//]` | `tests/commission_engine.test.ts` | 🟢 | `[X]` |

## Fase 3, Núcleo

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T008 | Implementar helper compartilhado das Edge Functions: bootstrap do `supabase-js` (client service role via `SERVICE_ROLE_KEY` secret), validação do JWT do usuário via `supabase.auth.getUser(token)` e leitura de `app_metadata.app_role` para RBAC server-side. Elimina a reimplementação manual de JWKS do Rust | T003 | - | `supabase/functions/_shared/client.ts` | 🟢 | `[X]` |
| T009 | Implementar Edge Function `vendas`: receber JSON (`aluno_id`, `curso_id`, `valor_entrada`, `comprovante_storage_path`), buscar bytes do Storage via service role, recalcular SHA-256 (`crypto.subtle`), validar constraint de unicidade, INSERT transacional em `vendas` + `evidencias_vendas` + `comissoes` (`valor_comissao` copiado de `cursos.valor_comissao_fixo`), retornar `201 Created` ou `409 Conflict` | T001, T002, T008 | - | `supabase/functions/vendas/index.ts` | 🟢 | `[X]` |
| T010 | Implementar Edge Functions de auditoria: `auditoria-aprovar` (transiciona venda para APROVADA; comissão para `AGUARDANDO_INICIO_AULAS` ou `LIBERADA_PAGAMENTO` conforme `data_inicio_curso`) e `auditoria-devolver` (transiciona para `DEVOLVIDA_AJUSTE` com motivo obrigatório >= 10 chars, comissão `BLOQUEADA_AUDITORIA`) | T001, T008 | `[//]` | `supabase/functions/auditoria-aprovar/index.ts`, `supabase/functions/auditoria-devolver/index.ts` | 🟢 | `[X]` |
| T011 | Implementar scheduled function `liberar-comissoes-diaria` (cron do Supabase): avalia vendas APROVADAS com `data_inicio_curso <= HOJE` e transiciona comissão para `LIBERADA_PAGAMENTO`. Agendada no fuso `America/Sao_Paulo` | T001, T008 | `[//]` | `supabase/functions/liberar-comissoes-diaria/index.ts` | 🟢 | `[X]` |
| T012 | Implementar Edge Function `fechamento-mensal`: processa comissões `LIBERADA_PAGAMENTO` do mês de competência, gera lançamentos no `livro_caixa_lancamentos` (`valor_credito`), marca comissões como `PAGA`, retorna total pago e quantidade de lançamentos | T011 | - | `supabase/functions/fechamento-mensal/index.ts` | 🟢 | `[X]` |
| T013 | Implementar Edge Function `gerar-contrato`: gerar PDF da minuta com biblioteca TS compatível com Deno (`pdf-lib`/`pdfkit` — spike prévio, ver D-06), salvar no Storage Privado (`contratos_pdf`), retornar Signed URL temporária (15 min) | T001, T002, T008 | `[//]` | `supabase/functions/gerar-contrato/index.ts`, `supabase/functions/gerar-contrato/template.ts` | 🟢 | `[X]` |

## Fase 4, Integração

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T014 | Implementar autenticação Supabase Auth no frontend: tela de login com email/senha, callback de sessão, proteção de rotas por perfil (VENDEDOR/SECRETARIA/AUDITOR/GESTOR), hook `useUser()` com JWT via `@supabase/ssr` | T004 | - | `src/app/auth/`, `src/lib/supabase.ts` | 🟢 | `[X]` |
| T015 | Implementar tela de apontamento de venda (mobile-first 3 toques): formulário com seleção de curso, valor de entrada, upload de comprovante ao Storage com preview, checklist de documentos do aluno, chamada à Edge Function `vendas` (JSON com `comprovante_storage_path`) | T009, T014 | `[//]` | `src/app/vendas/novo/page.tsx` | 🟢 | `[X]` |
| T016 | Implementar tela de auditoria: fila de vendas `PENDENTE_VALIDACAO` (via client Supabase + RLS), viewer de comprovante ampliável (Signed URL), botões Aprovar/Devolver com campo de motivo obrigatório, histórico de status da venda; chamadas às Edge Functions `auditoria-aprovar`/`auditoria-devolver` | T010, T014 | `[//]` | `src/app/auditoria/page.tsx` | 🟢 | `[X]` |
| T017 | Implementar "Minha Carteira" (extrato de comissões por vendedor/secretaria com RLS) e Dashboard Gerencial (faturamento por curso, comissões apuradas, taxa de emissão de contratos, taxa de regularização documental, CSV/PDF export) | T012, T014 | `[//]` | `src/app/carteira/page.tsx`, `src/app/dashboard/page.tsx` | 🟢 | `[X]` |
| T018 | Implementar cadastro de alunos + checklist de documentação (RG, CPF, Comprovante de Residência, Histórico) com upload de arquivos ao Storage + geração de contrato via Edge Function `gerar-contrato` com botão "Gerar Contrato" e exibição da Signed URL | T013, T014, T015 | `[//]` | `src/app/alunos/novo/page.tsx`, `src/app/alunos/[id]/page.tsx` | 🟢 | `[X]` |

## Fase 5, Polimento

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T019 | Configurar observabilidade das Edge Functions: logs estruturados via `console` do Supabase (function logs) + tracing leve. Sentry/OpenTelemetry removidos (pertenciam ao experimento Rust descartado) | T008 | `[//]` | `supabase/functions/_shared/log.ts` | 🟢 | `[X]` |
| T020 | Implementar PWA service worker: cache de rascunhos de apontamento (localStorage/IndexedDB), manifest.json com ícones, instalação como app, fallback offline | T004 | `[//]` | `public/sw.js`, `public/manifest.json` | 🟢 | `[X]` |
| T021 | Seed do catálogo de cursos: script de inserção inicial com as 4 categorias (Técnico, Graduação, Pós-Graduação, Cursos Livres) e respectivos `valor_comissao_fixo` | T001 | `[//]` | `scripts/seed_cursos.sql` | 🟢 | `[X]` |
| T022 | Escrever e executar testes E2E onboarding: 4 perfis (VENDEDOR, SECRETARIA, AUDITOR, GESTOR) percorrendo os cenários principais do PRD — apontamento, auditoria, liberação de comissão, fechamento mensal, geração de contrato | T015, T016, T017, T018 | - | `tests/e2e/onboarding.test.ts` | 🟢 | `[X]` |

## Notas de execução

- **D-06 (PDF):** executar um spike com `pdf-lib`/`pdfkit` em runtime Deno antes de fechar T013, para validar a geração de PDF sem binário nativo na borda.
- **L5 (.env):** definir `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e, se necessário, URL base das functions no `.env.local.example`.

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-07-25 | Versão inicial gerada por `/reversa-to-do` (Rust/Axum) | reversa |
| 2026-07-27 | Revisão de stack para TypeScript (ADR-001/002): scaffold Rust → Edge Functions (Deno/TS); endpoints Axum → Edge Functions `vendas`/`auditoria-*`/`fechamento-mensal`/`gerar-contrato`; worker diário → scheduled function `liberar-comissoes-diaria`; testes `.rs` → `.test.ts`/pgTAP; T019 (Sentry/OTel) → logs do Supabase. Status resetados para `[ ]`. | reversa |
