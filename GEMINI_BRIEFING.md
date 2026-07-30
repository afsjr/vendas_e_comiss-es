# Briefing para Gemini: Implementação V1 Comissionamento

**Data:** 2026-07-27  
**Status:** Fase 1 ✅ Completada | Fase 2-5 ⏳ Prontas para Gemini  
**Stack:** TypeScript End-to-End (Next.js 14 + Supabase Edge Functions/Deno)

---

## Contexto Rápido

Sistema de gestão de vendas e comissionamento para instituição educacional. Código legado (Rust, frontend antigo, scripts incompatíveis) foi arquivado. A implementação atual é **greenfield** em TypeScript:

- **Backend:** `supabase/functions/` (Edge Functions, Deno)
- **Frontend:** `src/` (Next.js 14 App Router, PWA)
- **Database:** `supabase/migrations/001_schema.sql` (PostgreSQL 16, RLS granular)

---

## Próximas Tarefas (Fase 2-5)

### Fase 2: Testes (T005-T007)
- T005: Testes de integração RLS (pgTAP/deno test) → `tests/rls_integration.test.ts`
- T006: Testes SHA-256 server-side → `tests/sha256_validation.test.ts`
- T007: Testes máquina de estados comissão → `tests/commission_engine.test.ts`

### Fase 3: Núcleo (T008-T013)
- T008: Helper shared das Edge Functions (`_shared/client.ts`) — JWT, RBAC
- T009: Edge Function `vendas` — criar venda, transação em SQL
- T010: Edge Functions `auditoria-aprovar` e `auditoria-devolver` — transições de status
- T011: Scheduled function `liberar-comissoes-diaria` — cron diária
- T012: Edge Function `fechamento-mensal` — processa comissões, livro-caixa
- T013: Edge Function `gerar-contrato` — gera PDF via `pdf-lib`, storage, signed URL

### Fase 4: Integração (T014-T018)
- T014: Autenticação Supabase Auth no frontend — login, proteção de rotas
- T015: Tela apontamento venda (mobile-first) — 3 toques, upload comprovante
- T016: Tela auditoria — fila de pendências, histórico, approve/reject
- T017: Carteira (comissões) + Dashboard (gerencial) — analytics
- T018: Cadastro alunos + checklist documentação — contratos

### Fase 5: Polimento (T019-T022)
- T019: Observabilidade das Edge Functions — logs estruturados
- T020: PWA service worker — cache offline, manifest
- T021: Seed catálogo cursos — 4 categorias com comissão_fixo
- T022: Testes E2E onboarding — 4 perfis, cenários principais

---

## Estrutura de Diretórios (Leia-se)

```
.
├── supabase/
│   ├── migrations/001_schema.sql (DDL canônico — não modificar)
│   ├── functions/
│   │   ├── _shared/
│   │   │   ├── types.ts (DTOs, interfaces)
│   │   │   ├── client.ts (supabase client, JWT, RBAC) ← T008
│   │   │   └── log.ts (observabilidade) ← T019
│   │   ├── vendas/index.ts ← T009
│   │   ├── auditoria-aprovar/index.ts ← T010
│   │   ├── auditoria-devolver/index.ts ← T010
│   │   ├── liberar-comissoes-diaria/index.ts ← T011
│   │   ├── fechamento-mensal/index.ts ← T012
│   │   ├── gerar-contrato/
│   │   │   ├── index.ts ← T013
│   │   │   └── template.ts
│   │   └── deno.json (cron: 0 13 * * * liberar-comissoes-diaria)
│   └── (sem tests/ aqui — scripts TypeScript rodam em Deno CLI)
├── src/
│   ├── app/
│   │   ├── auth/login/page.tsx ← T014
│   │   ├── vendas/novo/page.tsx ← T015
│   │   ├── auditoria/page.tsx ← T016
│   │   ├── carteira/page.tsx ← T017
│   │   ├── dashboard/page.tsx ← T017
│   │   ├── alunos/novo/page.tsx ← T018
│   │   ├── alunos/[id]/page.tsx ← T018
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── page.tsx (home)
│   ├── lib/
│   │   └── supabase.ts (client browser, helpers)
│   └── components/ (conforme necessário)
├── public/
│   ├── manifest.json ← T020
│   ├── sw.js ← T020
│   └── icons/
├── tests/
│   ├── rls_integration.test.ts ← T005
│   ├── sha256_validation.test.ts ← T006
│   ├── commission_engine.test.ts ← T007
│   └── e2e/onboarding.test.ts ← T022
├── scripts/
│   └── seed_cursos.sql ← T021
├── package.json (Next.js PWA)
├── tailwind.config.js
├── tsconfig.json
├── next.config.js
└── _reversa_forward/001-implementar-v1-comissionamento/
    ├── roadmap.md
    ├── actions.md (✏️ marque [X] conforme completa)
    ├── specifications.md
    ├── progress.jsonl (append-only, cada task = 1 line JSON)
    ├── legacy-impact.md
    └── regression-watch.md
```

---

## Diretrizes de Codificação

### 1. **Nunca modifique pré-existente**
- `supabase/migrations/001_schema.sql` — DDL canônico, fonte de verdade
- `.reversa/` — documentação reversa, apenas leitura
- `_reversa_sdd/` — decisões arquiteturais, apenas leitura

### 2. **TypeScript em tudo**
- Edge Functions: Deno + `supabase-js` 2.38.4+
- Frontend: Next.js 14 App Router, `@supabase/ssr`
- Testes: `.test.ts` (deno test para edge functions, vitest/jest para Next.js)

### 3. **Nomenclatura e Convenções**
- DTOs: `CreateVendaRequest`, `AprovVendaRequest` (PascalCase + "Request"/"Response")
- Tipos DB: alinhados ao DDL (e.g., `status_venda`, `valor_comissao_fixo`)
- Handlers Edge Function: `export default` como `Request → Promise<Response>`
- Páginas Next.js: componentes server por padrão (RSC), use `"use client"` conforme necessário

### 4. **Segurança**
- JWT parsing via `supabase.auth.getUser(token)` ou `Supabase.from(...)` com RLS automático
- **Nunca** confia em claims que vêm do frontend — sempre revalida no servidor
- Criptografia em repouso: CPF via `pgcrypto` (já configurado no DDL via trigger)
- Documentos: Storage Privado com Signed URLs (15 min expiry)

### 5. **Testes**
- RLS: teste isolação entre usuários (SELECT, INSERT, UPDATE, DELETE bloqueado)
- Validação: teste constraint violated (HTTP 409 para duplicatas SHA-256)
- Máquina de estados: teste transições corretas conforme `data_inicio_curso`
- E2E: 4 perfis (VENDEDOR, SECRETARIA, AUDITOR, GESTOR), cenários principais

---

## Ferramentas & Ambiente

### Dependências já instaladas (package.json)
```json
{
  "react": "^18.2.0",
  "next": "^14.2.3",
  "@supabase/supabase-js": "^2.38.4",
  "@supabase/ssr": "^0.0.8",
  "lucide-react": "^latest",
  "react-dropzone": "^latest",
  "zustand": "^latest",
  "tailwindcss": "^3.4.1"
}
```

### Para Edge Functions (Deno runtime)
- `supabase-js` (Edge Function import)
- `pdf-lib` ou `pdfkit` para T013 (spike prévio!)

### Testes
- `deno test` para Edge Functions (Deno CLI)
- `vitest` ou `jest` para Next.js (se houver setup)

---

## Output Esperado

### Ao completar cada tarefa:

1. **Código gerado** — arquivo `.ts`/`.tsx` no local certo
2. **Marcar em actions.md** — `[ ]` → `[X]` para a tarefa
3. **Append em progress.jsonl** — 1 linha JSON por conclusão:
   ```json
   {"timestamp": "2026-07-27T12:34:56Z", "action": "T005_complete", "status": "done", "files": ["tests/rls_integration.test.ts"]}
   ```

### Ao finalizar Fase 2, 3, 4 ou 5:
```json
{"timestamp": "...", "phase": "Fase 2", "total_tasks": 3, "completed": 3, "status": "phase_complete"}
```

---

## Como Invocar

```bash
# No terminal, use agy (gemini-cli):
agy "Implementar Fase 2 (T005-T007) conforme GEMINI_BRIEFING.md"

# Ou, para fases específicas:
agy "T009: Implementar Edge Function vendas com transação SQL"
```

Quando terminar, avalie os outputs e aplique correções se necessário via Claude.

---

## Notas Importantes

- **D-06 (PDF Spike):** Antes de T013, valide `pdf-lib`/`pdfkit` em runtime Deno
- **L5 (.env):** Defina `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY` (Edge Functions)
- **Fuso horário:** Scheduled functions usam `America/Sao_Paulo`
- **Sem git:** Este projeto é diretório simples (não é repo git), alterações são locais

---

## Referências

- **Roadmap:** `_reversa_forward/001-implementar-v1-comissionamento/roadmap.md`
- **Especificações:** `_reversa_forward/001-implementar-v1-comissionamento/specifications.md`
- **Arquitetura:** `_reversa_forward/001-implementar-v1-comissionamento/architecture-proposal.md`
- **Decisões:** `_reversa_sdd/decisions-gate.md` (ADR-001/002)
- **Status anterior:** `_reversa_forward/001-implementar-v1-comissionamento/progress.jsonl`

---

**Pronto para começar? Use `agy` no terminal com a tarefa específica ou a fase inteira.**
