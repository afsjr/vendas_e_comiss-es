# Inventário do Projeto — comissionamento e venda

> Gerado pelo **Scout** em 2026-07-26
> Timezone operacional: America/Sao_Paulo (UTC-3)
> Escala de confiança: 🟢 CONFIRMADO (extraído do código) · 🟡 INFERIDO · 🔴 LACUNA

---

## 1. Visão geral

Sistema de **comissionamento e vendas** para equipe comercial de uma instituição de ensino. Substitui fichas de papel e WhatsApp por um fluxo digital: apontamento de vendas, cotações, comissões, auditoria, fechamento mensal, geração de contratos e relatórios gerenciais.

Arquitetura em **3 camadas**:

| Camada | Tecnologia | Pasta |
|--------|-----------|-------|
| Backend API | Rust + Axum | `backend/` |
| Frontend Web/PWA | Next.js 14 (App Router) | `frontend/` |
| Banco + Auth + Storage | Supabase (PostgreSQL) | `supabase/` |

🟢 CONFIRMADO — estrutura de pastas raiz e manifests lidos diretamente.

---

## 2. Estrutura de pastas (código do projeto)

```
backend/
├── Cargo.toml
├── src/
│   ├── main.rs                  # entry point do servidor Axum (porta 3000)
│   ├── lib.rs                   # declaração dos módulos
│   ├── telemetry.rs             # tracing/logging
│   ├── middleware/
│   │   ├── mod.rs
│   │   ├── auth.rs              # extração/validação de JWT
│   │   └── rls.rs               # sync de claims JWT → RLS do Postgres
│   ├── models/
│   │   └── mod.rs               # (vazio — modelos inline nos handlers?)
│   └── routes/
│       ├── mod.rs
│       ├── vendas.rs            # POST /api/v1/vendas
│       ├── auditoria.rs         # aprovar / devolver
│       ├── comissoes.rs         # lógica de comissão
│       ├── fechamento.rs        # processar-mensal
│       └── contratos.rs         # gerar-contrato (PDF)
├── templates/                   # (vazio — templates de contrato a definir)
└── tests/
    ├── commission_engine.rs
    ├── rls_integration.rs
    ├── sha256_validation.rs
    └── e2e/onboarding.rs

frontend/
├── package.json
├── next.config.js
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── .env.local.example
├── public/
│   ├── manifest.json            # PWA manifest
│   ├── sw.js                    # service worker
│   └── icons/
└── src/
    ├── app/                     # App Router (rotas por pasta)
    │   ├── layout.tsx           # root layout (PWA, tema escuro #1e293b)
    │   ├── page.tsx             # home
    │   ├── globals.css
    │   ├── auth/
    │   │   ├── login/page.tsx
    │   │   └── callback/route.ts
    │   ├── alunos/
    │   │   ├── page.tsx
    │   │   ├── novo/page.tsx
    │   │   └── [id]/page.tsx
    │   ├── vendas/
    │   │   └── novo/page.tsx
    │   ├── auditoria/page.tsx
    │   ├── carteira/page.tsx
    │   └── dashboard/page.tsx
    ├── components/
    │   └── providers.tsx
    ├── lib/
    │   ├── supabase.ts          # client Supabase (SSR)
    │   └── auth.ts              # helpers de auth
    └── types/
        └── index.ts

supabase/
├── migrations/
│   └── 001_schema.sql           # DDL completo (tabelas, enums, triggers, RLS)
└── setup-storage.sql            # buckets privados + políticas

scripts/
└── seed_cursos.sql              # catálogo de cursos (4 categorias)
```

🟢 CONFIRMADO — árvore gerada por `find`, excluindo `node_modules`, `.next`, etc.

---

## 3. Tecnologias e frameworks

### Backend (Rust)
- **Linguagem:** Rust (edition 2021) — 17 arquivos `.rs`
- **Framework web:** Axum 0.7 (macros)
- **Runtime assíncrono:** Tokio 1 (full)
- **DB driver:** SQLx 0.7 (Postgres, runtime-tokio, chrono, json, uuid, macros)
- **HTTP client:** Reqwest 0.12 (json) — para chamadas à API/Storage do Supabase
- **Auth:** jsonwebtoken 9 (JWT)
- **Hashing de evidências:** sha2 0.10
- **Serialização:** serde 1 / serde_json 1
- **IDs/tempo:** uuid 1 (v4), chrono 0.4
- **Erros:** thiserror 1
- **Observabilidade:** tracing 0.1 + tracing-subscriber 0.3 (env-filter)
- **Middleware HTTP:** tower 0.4 + tower-http 0.5 (cors)

### Frontend (TypeScript)
- **Framework:** Next.js 14.2 (App Router, React Server Components)
- **UI:** React 18.3, Tailwind CSS 3.4, lucide-react (ícones)
- **Auth/DB client:** @supabase/ssr 0.5 + @supabase/supabase-js 2.45
- **Upload:** react-dropzone 14.3
- **Gráficos:** recharts 2.14
- **Linguagem:** TypeScript 5.6 (strict) — 10 `.tsx` + 5 `.ts`
- **Lint:** ESLint + eslint-config-next
- **PWA:** manifest.json + service worker (`public/sw.js`)

### Plataforma de dados
- **Banco:** PostgreSQL (via Supabase)
- **Auth:** Supabase Auth (JWT com `app_metadata.app_role`)
- **Storage:** Supabase Storage (buckets privados: `comprovantes`, `documentos_alunos`, `contratos_pdf`)

🟢 CONFIRMADO — versões lidas de `Cargo.toml` e `package.json`.

---

## 4. Pontos de entrada

### Backend
| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `backend/src/main.rs` | server_entry | `#[tokio::main]`, bind `0.0.0.0:3000`, monta o `Router` Axum |
| `backend/src/lib.rs` | module_root | expõe `middleware`, `models`, `routes` |

Variáveis de ambiente obrigatórias (lidas em `main.rs`, todas com `.expect`):
`DATABASE_URL`, `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `STORAGE_URL`.

### Frontend
| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `frontend/src/app/layout.tsx` | app_entry | root layout, providers, metadata PWA |
| `frontend/src/app/auth/callback/route.ts` | auth_callback | rota de callback OAuth Supabase |
| `frontend/next.config.js` | config | `serverComponentsExternalPackages: @supabase/ssr` |

Variáveis de ambiente (`.env.local.example`):
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL` (→ `http://localhost:3001/api`).

🟡 INFERIDO — `NEXT_PUBLIC_API_URL` aponta para porta **3001**, mas o backend Rust escuta na **3000**. Possível divergência de configuração (proxy/reverso ou env desatualizado). → registrada como lacuna.

---

## 5. Rotas da API (backend)

Definidas em `backend/src/main.rs` (todas `POST`, prefixo `/api/v1`):

| Método | Rota | Handler | Domínio |
|--------|------|---------|---------|
| POST | `/api/v1/vendas` | `routes::vendas::create` | apontamento de venda |
| POST | `/api/v1/auditoria/:id/aprovar` | `routes::auditoria::approve` | auditoria |
| POST | `/api/v1/auditoria/:id/devolver` | `routes::auditoria::devolver` | auditoria |
| POST | `/api/v1/fechamento/processar-mensal` | `routes::fechamento::processar` | fechamento mensal |
| POST | `/api/v1/vendas/:id/gerar-contrato` | `routes::contratos::gerar` | contrato PDF |

🟡 INFERIDO — não há rotas `GET`/`PUT`/`DELETE` declaradas no `Router`. As leituras/listagens provavelmente ocorrem **direto pelo frontend via Supabase client** (RLS), enquanto apenas as mutações sensíveis passam pela API Rust. A rota de comissões (`routes::comissoes`) está no módulo mas sem rota explícita em `main.rs` — pode ser chamada internamente por `vendas`/`fechamento`.

---

## 6. Schema de banco (superficial)

DDL canônico em `supabase/migrations/001_schema.sql`. Análise detalhada fica a cargo do **Data Master**.

**Tabelas:** `cursos`, `alunos`, `vendas`, `evidencias_vendas`, `vendas_historico_status`, `comissoes`, `livro_caixa_lancamentos`, `documentos_alunos`.

**Enums:** `status_venda_enum` (PENDENTE_VALIDACAO, DEVOLVIDA_AJUSTE, APROVADA, CANCELADA_ESTORNADA), `status_comissao_enum` (BLOQUEADA_AUDITORIA, AGUARDANDO_INICIO_AULAS, LIBERADA_PAGAMENTO, PAGA, ESTORNADA).

**Triggers de imutabilidade:**
- `block_vendas_data_mutation` — proíbe alterar `aluno_id`, `curso_id`, `valor_entrada`, `criado_por` após criação.
- `block_update_delete_livro_caixa` — `livro_caixa_lancamentos` é **append-only** (UPDATE/DELETE proibidos).

**RLS ativa** em `vendas`, `comissoes`, `alunos` — políticas baseadas em `app_metadata.app_role` (VENDEDOR, SECRETARIA, AUDITOR, GESTOR) e `sub` (próprio usuário).

**Buckets de Storage** (`supabase/setup-storage.sql`): `comprovantes` (5 MB), `documentos_alunos` (10 MB), `contratos_pdf` (10 MB) — todos privados.

🟢 CONFIRMADO.

---

## 7. Cobertura de testes

| Arquivo | Escopo |
|---------|--------|
| `backend/tests/commission_engine.rs` | motor de cálculo de comissão |
| `backend/tests/rls_integration.rs` | Row Level Security |
| `backend/tests/sha256_validation.rs` | validação de checksum de evidências |
| `backend/tests/e2e/onboarding.rs` | fluxo de cadastro end-to-end |

- **Framework:** testes nativos do Rust (`#[test]`, `cargo test`). 4 arquivos de teste.
- **Frontend:** nenhum arquivo `*.test.*`/`*.spec.*` encontrado. 🔴 LACUNA — sem testes de UI/unit no frontend.

---

## 8. CI/CD e Docker

🟢 CONFIRMADO — **ausentes**. Não há `.github/workflows/`, `Jenkinsfile`, `.gitlab-ci.yml`, `Dockerfile` nem `docker-compose.yml`. O deploy/build é manual (`cargo build` / `next build`).

---

## 9. Módulos identificados

Para a Fase 2 (Arqueólogo), os módulos a escavar:

1. **vendas** — apontamento de venda + evidências (SHA-256) + histórico de status
2. **auditoria** — aprovação/devolução de vendas pendentes
3. **comissoes** — cálculo e ciclo de vida da comissão
4. **fechamento** — processamento mensal (liberação de pagamentos + livro caixa)
5. **contratos** — geração de minuta/contrato PDF
6. **auth/rls** — middleware de JWT, sync de claims, papéis (RBAC)
7. **frontend-shell** — App Router, providers, PWA, auth callback
8. **frontend-alunos** — cadastro/documentação de alunos
9. **frontend-dashboard** — dashboard gerencial + carteira + relatórios

---

## 10. Lacunas e observações (🔴 LACUNA)

| # | Lacuna | Onde |
|---|--------|------|
| L1 | `models/mod.rs` está **vazio** — onde estão os structs de domínio? Inline nos handlers? | `backend/src/models/mod.rs` |
| L2 | `backend/templates/` está **vazio** — templates de contrato ainda não existem | `backend/templates/` |
| L3 | `NEXT_PUBLIC_API_URL` aponta para porta **3001** mas o backend ouve na **3000** | `frontend/.env.local.example` |
| L4 | Módulo `routes::comissoes` existe mas **não tem rota** declarada em `main.rs` | `backend/src/main.rs` |
| L5 | Sem testes no frontend | `frontend/` |
| L6 | Sem CI/CD nem Dockerfile | raiz |

Estas lacunas serão repassadas ao Detetive/Arqueólogo e registradas em `_reversa_sdd/questions.md` (answer_mode = file).
