# Briefing Fase 4: Integração Frontend + Edge Functions

**Status:** Fase 3 ✅ Backend completo | Fase 4 ⏳ Frontend + Integração (T014-T018)  
**Stack:** Next.js 14 App Router + Supabase Auth + Edge Functions já implementadas

---

## Resumo Rápido: O que Já Existe

### ✅ Backend Pronto (Fase 3)
- **T008:** `supabase/functions/_shared/client.ts` — helpers JWT, RBAC, CORS
- **T009:** `supabase/functions/vendas/index.ts` — CREATE venda com transação (vendas + evidencias + comissoes)
- **T010:** `supabase/functions/auditoria-aprovar/index.ts`, `auditoria-devolver/index.ts` — transições de status
- **T011:** `supabase/functions/liberar-comissoes-diaria/index.ts` — cron diária (14:00 UTC-3)
- **T012:** `supabase/functions/fechamento-mensal/index.ts` — processa comissões, gera livro-caixa
- **T013:** `supabase/functions/gerar-contrato/index.ts` — gera PDF + signed URL (15 min)

### ✅ Frontend Scaffold (Fase 1)
- `src/app/auth/login/page.tsx` — forma básica
- `src/app/vendas/novo/page.tsx` — esqueleton
- `src/app/auditoria/page.tsx` — esqueleton
- `src/app/carteira/page.tsx` — esqueleton
- `src/app/dashboard/page.tsx` — esqueleton
- `src/app/alunos/novo/page.tsx` — esqueleton (não existe ainda, criar em T018)
- `src/lib/supabase.ts` — client browser básico
- `package.json` — deps já instaladas (@supabase/supabase-js, @supabase/ssr, lucide-react, tailwind, etc.)

### ✅ Testes (Fase 2)
- `tests/rls_integration.test.ts` — validar RLS (já rodou)
- `tests/sha256_validation.test.ts` — validar SHA-256
- `tests/commission_engine.test.ts` — validar máquina de estados

---

## Próximas Tarefas (Fase 4: T014-T018)

### T014: Autenticação Supabase Auth no Frontend
**Arquivo:** `src/app/auth/login/page.tsx` + `src/lib/supabase.ts` (hooks)

**Requisitos:**
1. Página de login com email/senha (formulário simples, mobile-first)
2. Callback de sessão após login (redireciona para dashboard conforme role)
3. Hook `useUser()` que retorna `{ user, role, loading }` via `@supabase/ssr`
4. Proteção de rotas por perfil:
   - `VENDEDOR` → `/vendas/novo`, `/carteira`
   - `SECRETARIA` → `/vendas/novo`, `/carteira`
   - `AUDITOR` → `/auditoria`, `/dashboard`
   - `GESTOR` → `/auditoria`, `/dashboard`, `/carteira`
5. Logout funcional
6. JWT armazenado em httpOnly cookie (via `@supabase/ssr` + Server Components)

**Dependências:** T003, T001 (RLS policies)  
**Paralelismo:** Não (bloqueia T015-T018)

---

### T015: Tela de Apontamento de Venda (Mobile-First)
**Arquivo:** `src/app/vendas/novo/page.tsx`

**Requisitos:**
1. Formulário com 3 toques (mobile-first):
   - Seleção de curso (dropdown, já vem de `cursos` table via RLS)
   - Valor de entrada (number input)
   - Upload de comprovante (drag-drop via `react-dropzone`)
2. Preview da imagem após upload (mostrar miniatura)
3. Checklist de documentos do aluno (RG, CPF, Residência, Histórico) — opcional visual
4. Chamada à Edge Function `vendas`:
   - Upload comprovante ao Storage (`comprovantes/{venda_uuid}/{file_uuid}.pdf`)
   - Retorna `comprovante_storage_path`
   - POST para `/functions/v1/vendas` com payload: `{ aluno_id, curso_id, valor_entrada, data_inicio_curso, comprovante_storage_path }`
5. Feedback visual:
   - Loading spinner durante upload/processing
   - Sucesso: toast + redirecionamento para `/vendas` (lista)
   - Erro: exibir mensagem HTTP (409 = duplicata, 400 = falta campo, etc.)

**Dependências:** T009, T014 (auth)  
**Paralelismo:** Sim (junto com T016-T018)

---

### T016: Tela de Auditoria
**Arquivo:** `src/app/auditoria/page.tsx`

**Requisitos:**
1. Fila de vendas `PENDENTE_VALIDACAO` (query Supabase com RLS automática):
   - SELECT from `vendas` WHERE status = 'PENDENTE_VALIDACAO'
   - Retorna: id, aluno_id, curso_id, valor_entrada, comprovante_storage_path, criado_em, criado_por
2. Viewer de comprovante ampliável:
   - Gera signed URL (15 min) da `comprovantes/{path}` via `supabase.storage.from('comprovantes').createSignedUrl()`
   - Exibe imagem em modal/drawer ampliável
3. Botões Aprovar/Devolver com ações:
   - **Aprovar:** POST `/functions/v1/auditoria-aprovar` com `{ venda_id }`
   - **Devolver:** POST `/functions/v1/auditoria-devolver` com `{ venda_id, motivo }` (motivo obrigatório >= 10 chars)
4. Histórico de status da venda:
   - Query `vendas_historico_status` WHERE venda_id = ? ORDER BY criado_em DESC
   - Exibe timeline: "2026-07-27 10:30 - PENDENTE_VALIDACAO" → "2026-07-27 10:35 - APROVADA"
5. Feedback:
   - Loading skeleton enquanto busca fila
   - Toast sucesso/erro após aprovar/devolver
   - Recarregar fila após ação

**Dependências:** T010, T014 (auth)  
**Paralelismo:** Sim

---

### T017: Carteira (Comissões) + Dashboard Gerencial
**Arquivo:** `src/app/carteira/page.tsx` + `src/app/dashboard/page.tsx`

**Carteira (VENDEDOR/SECRETARIA/GESTOR):**
1. Extrato de comissões por vendedor (RLS automática):
   - SELECT comissoes WHERE criado_por = current_user.id (via RLS)
   - Exibe: venda_id, valor_comissao, status, data_liberacao, criado_em
   - Filtro por status: AGUARDANDO_INICIO_AULAS, LIBERADA_PAGAMENTO, PAGA
2. Total por status (cards com números grandes):
   - Total LIBERADA_PAGAMENTO (saldo a receber)
   - Total PAGA (já recebido)
   - Total AGUARDANDO (em processamento)
3. Gráfico opcional: histórico mensal de comissões paga

**Dashboard Gerencial (AUDITOR/GESTOR):**
1. Cards de KPI:
   - Total de vendas (mês/trimestre)
   - Faturamento total (SUM de valor_entrada)
   - Comissões apuradas (SUM de valor_comissao WHERE status = PAGA)
   - Taxa de emissão de contratos (COUNT WHERE gerar_contrato.sucesso / COUNT vendas)
   - Taxa de regularização documental (% alunos com documentação completa)
2. Tabela: Vendas por curso (curso_id, quantidade, faturamento)
3. Gráfico: evolução mensal de vendas (bar chart)
4. Export:
   - CSV de vendas (período selecionável)
   - PDF de relatório mensal

**Dependências:** T012 (fechamento-mensal), T014 (auth)  
**Paralelismo:** Sim

---

### T018: Cadastro de Alunos + Checklist Documentação
**Arquivo:** `src/app/alunos/novo/page.tsx` + `src/app/alunos/[id]/page.tsx` (visualizar/editar)

**Novo Aluno (T018 Parte 1):**
1. Formulário:
   - Nome (text)
   - CPF (masked input, validação básica)
   - Email (email input)
   - Telefone (optional)
   - Data de nascimento (date picker)
2. Checklist de documentação (uploads):
   - RG (obrigatório) → upload para `documentos_alunos/{aluno_id}/rg/{file_uuid}.pdf`
   - CPF (obrigatório) → upload para `documentos_alunos/{aluno_id}/cpf/{file_uuid}.pdf`
   - Comprovante de Residência (obrigatório) → upload para `documentos_alunos/{aluno_id}/residencia/{file_uuid}.pdf`
   - Histórico (opcional) → upload
3. Feedback: checklist visual (✓ RG, ✗ Histórico, etc.)
4. Botão "Gerar Contrato":
   - Requer documentação completa (RG, CPF, Residência)
   - POST `/functions/v1/gerar-contrato` com `{ aluno_id }`
   - Recebe signed URL (15 min) → exibe link para download do PDF
5. Histórico de ações (audit log simples)

**Visualizar Aluno (T018 Parte 2):**
1. Cards com dados básicos (nome, CPF, email, telefone, DOB)
2. Checklist de documentação com preview:
   - Cada item: ✓ Data de upload + botão "Visualizar" (signed URL)
3. Histórico de vendas do aluno (vendas WHERE aluno_id = ?)
4. Botão "Re-gerar Contrato" se precisar

**Dependências:** T013 (gerar-contrato), T014 (auth), T015 (aluno será criado pelo vendedor ao fazer venda)  
**Paralelismo:** Sim

---

## Estrutura de Diretórios (Leia-se)

```
src/
├── app/
│   ├── auth/
│   │   └── login/page.tsx ← T014 (REESCREVER com login real)
│   │   └── callback/route.ts (opcional: OAuth callback)
│   ├── vendas/
│   │   └── novo/page.tsx ← T015 (REESCREVER com 3-toque + upload)
│   │   └── page.tsx (opcional: listar vendas do usuário)
│   ├── auditoria/
│   │   └── page.tsx ← T016 (REESCREVER com fila + histórico)
│   ├── carteira/
│   │   └── page.tsx ← T017 (REESCREVER com extrato de comissões)
│   ├── dashboard/
│   │   └── page.tsx ← T017 (REESCREVER com KPIs + gráficos)
│   ├── alunos/
│   │   ├── novo/page.tsx ← T018 (CRIAR formulário + checklist)
│   │   ├── [id]/page.tsx ← T018 (CRIAR visualizar/editar)
│   │   └── page.tsx (opcional: listar alunos)
│   ├── layout.tsx (manter, ajustar provider/auth se necessário)
│   ├── globals.css (manter)
│   └── page.tsx (home — manter ou ajustar nav)
├── lib/
│   ├── supabase.ts ← T014 (REESCREVER com hooks useUser, useAuth)
│   └── helpers.ts (criar conforme necessário para formatação, etc.)
└── components/
    └── (conforme necessário: buttons, cards, modals, etc.)

package.json (deps já instaladas, OK)
```

---

## Diretrizes de Implementação

### 1. **Autenticação & Sessão (T014 primeira)**
```typescript
// src/lib/supabase.ts deve exportar:
export function createClient() { /* browser client */ }
export function useUser() { /* hook que retorna { user, role, loading } */ }
export async function signIn(email, password) { }
export async function signOut() { }
export async function getUser() { }
```

### 2. **Upload de Arquivos**
```typescript
// Usar @supabase/supabase-js:
const { data, error } = await supabase.storage
  .from("comprovantes")
  .upload(`${venda_uuid}/${file_uuid}.pdf`, file)
```

### 3. **Chamadas às Edge Functions**
```typescript
// Via fetch ou @supabase/supabase-js:
const response = await fetch('/functions/v1/vendas', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify(payload)
})
```

### 4. **RLS Automática**
- Queries do Supabase (`supabase.from('vendas').select()`) aplicam RLS automaticamente
- Não precisa mandar `WHERE user_id = ...` no frontend — o banco faz

### 5. **UI/UX Mobile-First**
- Usar Tailwind CSS (já configurado)
- Componentes acessíveis (buttons, inputs, selects)
- Loading spinners durante requisições
- Toasts para feedback (use biblioteca simples ou fazer DIY)
- Drawer/Modal para imagens ampliadas

### 6. **Tratamento de Erros**
```typescript
if (response.status === 409) { // Duplicata
  toast.error('Comprovante duplicado')
} else if (response.status === 401) { // Unauthorized
  redirect('/auth/login')
} else if (response.status === 400) { // Bad request
  toast.error('Faltam campos obrigatórios')
}
```

---

## Notas Importantes

1. **JWT em httpOnly cookies:** Use `@supabase/ssr` para handling correto (servidor + browser)
2. **Signed URLs:** Sempre gerar no servidor (Edge Function ou API Next.js) com `createSignedUrl()`
3. **RLS policies:** Já estão em `supabase/migrations/001_schema.sql` — frontend não precisa fazer nada especial
4. **Fuso horário:** `America/Sao_Paulo` para datas de aula e cron (já configurado no backend)
5. **Offline:** Service Worker scaffold existe, deixar para polishing (T020)

---

## Output Esperado

Ao completar Fase 4:
1. **Marcar em actions.md:** T014-T018 como `[X]`
2. **Append em progress.jsonl:**
   ```json
   {"timestamp": "...", "action": "T014_complete", "status": "done", "files": [...]}
   {"timestamp": "...", "action": "T015_complete", "status": "done", "files": [...]}
   ...
   {"timestamp": "...", "phase": "Fase 4", "total_tasks": 5, "completed": 5, "status": "phase_complete"}
   ```

---

## Como Invocar

```bash
# Terminal
agy "Implementar Fase 4 (T014-T018) conforme GEMINI_FASE4_BRIEFING.md"

# Ou começar por T014 (bloqueia os outros):
agy "T014: Implementar autenticação Supabase Auth no Next.js conforme GEMINI_FASE4_BRIEFING.md"
```

---

## Referências Rápidas

- **DDL:** `supabase/migrations/001_schema.sql`
- **Edge Functions:** `supabase/functions/*/index.ts` (já implementadas)
- **Supabase JS Docs:** https://supabase.com/docs/reference/javascript
- **Next.js 14 Docs:** https://nextjs.org/docs
- **Tailwind CSS:** https://tailwindcss.com
- **@supabase/ssr:** https://github.com/supabase/auth-js

---

**Pronto para Fase 4! 🚀**
