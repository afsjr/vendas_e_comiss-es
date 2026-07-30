# Dependências — comissionamento e venda

> Gerado pelo **Scout** em 2026-07-26
> Fonte: `backend/Cargo.toml` e `frontend/package.json`

---

## Backend — Rust (`backend/Cargo.toml`)

Pacote: `comissionamento-api` v0.1.0 · edition 2021

| Dependência | Versão | Features | Função |
|-------------|--------|----------|--------|
| axum | 0.7 | macros | Framework web (Router, handlers, extração) |
| tokio | 1 | full | Runtime assíncrono |
| sqlx | 0.7 | postgres, runtime-tokio, chrono, json, uuid, macros | Driver PostgreSQL (queries compile-time) |
| reqwest | 0.12 | json | Cliente HTTP (Supabase Storage/Auth API) |
| thiserror | 1 | — | Enums de erro ergonômicos |
| serde | 1 | derive | Serialização/derialização |
| serde_json | 1 | — | JSON handling |
| sha2 | 0.10 | — | SHA-256 de evidências |
| uuid | 1 | v4 | Identificadores UUID |
| chrono | 0.4 | serde | Datas/timestamps |
| jsonwebtoken | 9 | — | Criação/validação de JWT |
| tracing | 0.1 | — | Logging estruturado |
| tracing-subscriber | 0.3 | env-filter | Configuração de logging |
| tower-http | 0.5 | cors | Middleware HTTP (CORS) |
| tower | 0.4 | — | Utilidades de middleware |

**Gerenciador de pacotes:** Cargo (crates.io). Sem `Cargo.lock` versionado observado.

🟡 INFERIDO — ausência de seção `[dev-dependencies]`; os testes em `backend/tests/` usam as deps principais (tokio, sqlx).

---

## Frontend — Node (`frontend/package.json`)

Pacote: `comissionamento-vendas-frontend` v0.1.0 · privado

### Dependencies (runtime)

| Dependência | Versão | Função |
|-------------|--------|--------|
| next | ^14.2.15 | Framework React (App Router, SSR/SSG) |
| react | ^18.3.1 | UI runtime |
| react-dom | ^18.3.1 | Renderizador React |
| @supabase/supabase-js | ^2.45.6 | Client Supabase (DB, auth, storage) |
| @supabase/ssr | ^0.5.2 | Adaptador Supabase para SSR (cookies) |
| lucide-react | ^0.449.0 | Ícones SVG |
| react-dropzone | ^14.3.5 | Upload de arquivos (drag&drop) |
| recharts | ^2.14.1 | Gráficos (dashboard) |

### devDependencies

| Dependência | Versão | Função |
|-------------|--------|--------|
| typescript | ^5.6.3 | Compilador TS (strict) |
| @types/node | ^20.17.6 | Tipos Node |
| @types/react | ^18.3.12 | Tipos React |
| @types/react-dom | ^18.3.1 | Tipos ReactDOM |
| tailwindcss | ^3.4.14 | CSS utilitário |
| postcss | ^8.4.47 | Processador CSS |
| autoprefixer | ^10.4.20 | Prefixos CSS |
| eslint | ^8.57.0 | Linter |
| eslint-config-next | ^14.2.15 | Regras ESLint do Next |

### Scripts

| Script | Comando |
|--------|---------|
| dev | `next dev` |
| build | `next build` |
| start | `next start` |
| lint | `next lint` |

**Gerenciador de pacotes:** npm (presença de `package.json`; ausência de `pnpm-lock.yaml`/`yarn.lock` sugere npm). 🔴 LACUNA — não há `package-lock.json` versionado observado para confirmar.

---

## Dependências críticas (risco)

- **sqlx** com macros em compile-time: exige `DATABASE_URL` acessível em `cargo build` (ou `sqlx prepare` offline). Risco de build quebrado sem DB.
- **Supabase** é dependência de plataforma (não só biblioteca): auth, DB e storage são serviços externos.
- Sem `Cargo.lock`/`package-lock.json` versionados → reprodutibilidade de build 🔴 LACUNA.
