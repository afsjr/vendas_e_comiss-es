# Briefing Fase 5: Polimento + Testes E2E (Etapa Final)

**Status:** Fase 4 ✅ Frontend Integrado | Fase 5 ⏳ Polimento + E2E + Finalização  
**Meta:** Sistema pronto para produção

---

## O que Já Existe (Fases 1-4)

### ✅ Backend Completo
- DDL (`supabase/migrations/001_schema.sql`) — 8 tabelas, RLS granular, triggers
- 6 Edge Functions implementadas (vendas, auditoria-aprovar, auditoria-devolver, liberar-comissoes-diaria, fechamento-mensal, gerar-contrato)
- Scheduled function cron configurada

### ✅ Frontend Completo
- Autenticação Supabase Auth (login, sessão, hooks)
- 7 telas implementadas (auth, vendas, auditoria, carteira, dashboard, alunos)
- Integração com Edge Functions (fetch, error handling)
- Tailwind CSS + Lucide icons

### ✅ Testes
- RLS integration tests (`tests/rls_integration.test.ts`)
- SHA-256 validation tests (`tests/sha256_validation.test.ts`)
- Commission engine state machine tests (`tests/commission_engine.test.ts`)

---

## Próximas Tarefas (Fase 5: T019-T022)

### T019: Observabilidade das Edge Functions
**Arquivo:** `supabase/functions/_shared/log.ts` (novo)

**Requisitos:**
1. Logger estruturado simples que escreve na console do Deno (visível no Supabase Functions dashboard)
2. Cada Edge Function chama `logEvent()` com:
   - `level`: 'info' | 'warn' | 'error'
   - `action`: descrição da ação (ex: "venda_criada", "sha256_validado", "erro_auth")
   - `details`: { user_id, venda_id, error_code, duration_ms, etc. }
3. Exemplo de uso em `supabase/functions/vendas/index.ts`:
   ```typescript
   logEvent('info', 'venda_criada', { user_id: user.id, venda_id: venda.id })
   logEvent('error', 'duplicata_detectada', { user_id: user.id, error: 'CONFLICT' })
   ```
4. Formato JSON para facilitar parsing no Supabase Logs
5. Aplicar em **todas** as Edge Functions (vendas, auditoria-*, fechamento-mensal, liberar-comissoes-diaria, gerar-contrato)

**Dependências:** T008 (helpers)  
**Paralelismo:** Sim (junto com T020-T022)

---

### T020: PWA Service Worker (Offline)
**Arquivo:** `public/sw.js` + `public/manifest.json` + config Next.js

**Requisitos:**
1. Service Worker (`public/sw.js`) — manter scaffold simples:
   - Cache de rascunhos de apontamento (localStorage/IndexedDB)
   - Fallback offline (exibir mensagem "Você está offline")
   - NÃO implementar sincronização complexa (fora do escopo)
2. Manifest.json (já existe em T004, validar):
   - Nome: "Comissionamento e Vendas"
   - Ícones: 192x192, 512x512 (placeholder é OK)
   - Theme color: azul/corporativo
   - Start URL: `/`
3. Configuração Next.js para PWA (next.config.js):
   - Registrar Service Worker em `src/app/layout.tsx`
   - Head meta tags para PWA (viewport, theme-color, manifest)
4. Testa:
   - Abrir DevTools → Application → Service Workers (deve estar "activated")
   - Ir offline (DevTools → Network → Offline) → página não quebra

**Dependências:** T004 (PWA scaffold)  
**Paralelismo:** Sim

---

### T021: Seed de Catálogo de Cursos
**Arquivo:** `scripts/seed_cursos.sql` (reescrever compatível com DDL novo)

**Requisitos:**
1. Script SQL que insere 4 cursos base com categorias:
   ```sql
   INSERT INTO cursos (nome, categoria, valor_comissao_fixo, criado_em, atualizado_em) VALUES
   ('Técnico em Informática', 'Técnico', 150.00, NOW(), NOW()),
   ('Bacharelado em Engenharia de Software', 'Graduação', 250.00, NOW(), NOW()),
   ('Especialização em Cloud Computing', 'Pós-Graduação', 350.00, NOW(), NOW()),
   ('Python para Iniciantes', 'Cursos Livres', 50.00, NOW(), NOW());
   ```
2. Valores de comissão compatíveis com real-world (100-400 reais fixos por venda)
3. Enums devem estar corretos (categoria ENUM está em DDL)
4. Script deve ser idempotente (OK se rodar 2x — use INSERT OR IGNORE ou similar)
5. Executável via:
   ```bash
   psql postgresql://... < scripts/seed_cursos.sql
   ```

**Dependências:** T001 (DDL)  
**Paralelismo:** Sim

---

### T022: Testes E2E Onboarding (4 Perfis)
**Arquivo:** `tests/e2e/onboarding.test.ts` (reescrever completo)

**Requisitos:**
1. Framework de teste: `deno test` com biblioteca HTTP (ex: `--allow-net`)
2. Teste 4 fluxos paralelos:

   **Fluxo 1: VENDEDOR apontando venda**
   - Login como VENDEDOR
   - Navegar para `/vendas/novo`
   - Preencher: curso, valor_entrada, upload comprovante
   - POST `/functions/v1/vendas` → HTTP 201
   - Verificar que venda aparece em `/auditoria` para AUDITOR
   - Logout

   **Fluxo 2: SECRETARIA apontando venda (mesmo do VENDEDOR)**
   - Login como SECRETARIA
   - Mesmo fluxo que VENDEDOR (pode reutilizar)

   **Fluxo 3: AUDITOR auditando vendas**
   - Login como AUDITOR
   - Acessar `/auditoria`
   - Buscar vendas PENDENTE_VALIDACAO
   - Aprovar 1 venda → POST `/functions/v1/auditoria-aprovar`
   - Devolver 1 venda com motivo → POST `/functions/v1/auditoria-devolver`
   - Verificar que comissões estão AGUARDANDO_INICIO_AULAS / BLOQUEADA_AUDITORIA
   - Logout

   **Fluxo 4: GESTOR vendo Dashboard**
   - Login como GESTOR
   - Acessar `/dashboard`
   - Verificar KPIs (total de vendas, faturamento)
   - Acessar `/carteira` (pode ver comissões de TODOS os vendedores)
   - Export CSV de vendas
   - Logout

3. Validações:
   - Cada step retorna status 200-201 (sucesso) ou erro esperado
   - RLS funciona (VENDEDOR não vê vendas de outro VENDEDOR em `/auditoria`)
   - Status machine: PENDENTE_VALIDACAO → APROVADA/DEVOLVIDA_AJUSTE
4. Relatório final: "✓ Onboarding E2E: 4/4 fluxos OK"

**Dependências:** T015, T016, T017, T018 (todas as telas)  
**Paralelismo:** Não (rodas sequencialmente mas paralelo internamente)

---

## Estrutura de Diretórios

```
supabase/functions/
├── _shared/
│   ├── client.ts (já existe, pode adicionar log helper)
│   └── log.ts ← T019 (novo)
├── vendas/index.ts (adicionar logEvent calls)
├── auditoria-aprovar/index.ts (adicionar logEvent calls)
├── auditoria-devolver/index.ts (adicionar logEvent calls)
├── liberar-comissoes-diaria/index.ts (adicionar logEvent calls)
├── fechamento-mensal/index.ts (adicionar logEvent calls)
└── gerar-contrato/index.ts (adicionar logEvent calls)

public/
├── sw.js ← T020 (manter/melhorar)
└── manifest.json ← T020 (validar)

src/
├── app/
│   └── layout.tsx (adicionar Service Worker registration)
└── ...

scripts/
└── seed_cursos.sql ← T021 (reescrever)

tests/
├── rls_integration.test.ts (já existe)
├── sha256_validation.test.ts (já existe)
├── commission_engine.test.ts (já existe)
└── e2e/
    └── onboarding.test.ts ← T022 (novo)
```

---

## Diretrizes de Implementação

### T019: Logger Estruturado
```typescript
// supabase/functions/_shared/log.ts
export function logEvent(
  level: 'info' | 'warn' | 'error',
  action: string,
  details?: Record<string, any>
) {
  const timestamp = new Date().toISOString()
  console.log(JSON.stringify({
    timestamp,
    level,
    action,
    details
  }))
}

// Uso em vendas/index.ts:
import { logEvent } from '../_shared/log.ts'
logEvent('info', 'venda_iniciada', { user_id: user.id })
// ... operações ...
logEvent('info', 'venda_criada', { venda_id: venda.id, duration_ms: 150 })
```

### T020: Service Worker Simples
```javascript
// public/sw.js
self.addEventListener('install', (event) => {
  console.log('Service Worker installed')
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated')
})

self.addEventListener('fetch', (event) => {
  // Passthrough simples (não fazer cache sofisticado)
  event.respondWith(fetch(event.request))
})
```

Registrar em `src/app/layout.tsx`:
```typescript
'use client'
useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
  }
}, [])
```

### T021: SQL Seed Simples
```sql
-- scripts/seed_cursos.sql
BEGIN;
DELETE FROM cursos; -- ou INSERT OR IGNORE
INSERT INTO cursos (nome, categoria, valor_comissao_fixo, criado_em, atualizado_em) VALUES
('Técnico em Informática', 'Técnico', 150.00, NOW(), NOW()),
('Bacharelado em Engenharia', 'Graduação', 250.00, NOW(), NOW()),
('Pós-Graduação Cloud', 'Pós-Graduação', 350.00, NOW(), NOW()),
('Python Iniciantes', 'Cursos Livres', 50.00, NOW(), NOW());
COMMIT;
```

### T022: E2E com Deno Test
```typescript
// tests/e2e/onboarding.test.ts
import { assertEquals } from "https://deno.land/std@0.210.0/assert/mod.ts"

Deno.test("E2E Onboarding: VENDEDOR apontando venda", async () => {
  // 1. Login
  const loginRes = await fetch('https://..../auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'vendedor@...', password: '...' })
  })
  const { token } = await loginRes.json()
  
  // 2. Apontar venda
  const vendaRes = await fetch('https://...supabase.co/functions/v1/vendas', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ aluno_id: '...', curso_id: '...', ... })
  })
  
  assertEquals(vendaRes.status, 201)
})
```

---

## Output Esperado

Ao completar Fase 5:
1. **Marcar em actions.md:** T019-T022 como `[X]`
2. **Append em progress.jsonl:**
   ```json
   {"timestamp": "...", "action": "T019_complete", "status": "done", "files": ["supabase/functions/_shared/log.ts", ...]}
   {"timestamp": "...", "action": "T020_complete", "status": "done", "files": ["public/sw.js", "src/app/layout.tsx"]}
   {"timestamp": "...", "action": "T021_complete", "status": "done", "files": ["scripts/seed_cursos.sql"]}
   {"timestamp": "...", "action": "T022_complete", "status": "done", "files": ["tests/e2e/onboarding.test.ts"]}
   {"timestamp": "...", "phase": "Fase 5", "total_tasks": 4, "completed": 4, "status": "phase_complete"}
   ```

3. **Pós-conclusão (manual):**
   - Rodar `/reversa-sync` para convergir `_reversa_sdd/addenda/`
   - Re-extrair `/reversa` após conclusão para validar greenfield → production

---

## Como Invocar

```bash
# Terminal
agy "Implementar Fase 5 (T019-T022) conforme GEMINI_FASE5_BRIEFING.md"

# Ou por task:
agy "T019: Implementar observabilidade estruturada em todas as Edge Functions"
```

---

## Referências Finais

- **Supabase Functions:** https://supabase.com/docs/guides/functions
- **Next.js PWA:** https://nextjs.org/docs/app/building-your-application/optimizing/pwa
- **Deno Test:** https://docs.deno.com/runtime/manual/basics/testing
- **Service Worker API:** https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API

---

## ✅ Checklist Final

Após Fase 5:
- [ ] Todas as tarefas T001-T022 marcadas como `[X]` em actions.md
- [ ] progress.jsonl completo com todas as fases
- [ ] Testes rodam (deno test, rls, sha256, commission, e2e)
- [ ] Service Worker ativado (DevTools → Application)
- [ ] Seed de cursos inserido (4 cursos)
- [ ] Logs estruturados em todas as Edge Functions
- [ ] E2E onboarding passa (4/4 perfis OK)

**Sistema pronto para `/reversa-sync` e deploy! 🚀**

---

**Última fase — bora finalizar! 🏁**
