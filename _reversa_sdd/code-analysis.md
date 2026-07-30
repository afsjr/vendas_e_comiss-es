# Análise de Código — comissionamento e venda

> Gerado pelo **Arqueólogo** em 2026-07-26
> `doc_level = completo` · Escala: 🟢 CONFIRMADO · 🟡 INFERIDO · 🔴 LACUNA
> **Atenção:** ver `_reversa_sdd/questions.md` — há divergência grave entre DDL e queries Rust (L1).

---

## Visão arquitetural

Sistema em 3 camadas com divisão de responsabilidade **híbrida**:

- **Frontend Next.js (App Router)** — UI/PWA, autenticação Supabase, leituras (intenção: via Supabase client + RLS). Hoje quase todo mockado.
- **Backend Rust (Axum)** — API de **mutações sensíveis**: criar venda, aprovar/devolver auditoria, processar fechamento mensal, gerar contrato PDF. Validado por JWT Supabase (JWKS, RS256).
- **Supabase (Postgres)** — fonte de dados, RLS por `app_role`, Storage de comprovantes/documentos/contratos.

Padrão de segurança: todo handler Rust chama `inject_rls_context` para setar `request.jwt.claims` e `SET LOCAL ROLE authenticated` antes de tocar o DB, de forma que as políticas RLS também protejam as mutações server-side.

🟢 CONFIRMADO — `middleware/rls.rs`, `middleware/auth.rs`.

---

## Módulo `vendas` (backend)

**Arquivo:** `backend/src/routes/vendas.rs`
**Rota:** `POST /api/v1/vendas` · handler `create`

### Fluxo de controle
1. Extrai campos **multipart**: `aluno_id`, `curso_id`, `valor_entrada`, `comprovante_file`.
2. Calcula `sha256_checksum` do arquivo (`Sha256::digest` → hex).
3. Verifica duplicidade: `SELECT EXISTS(... evidencias_venda WHERE sha256_checksum = $1)`. Se existe → `409 DUPLICATE_RECEIPT_HASH`.
4. Faz upload do comprovante para Supabase Storage (bucket `comprovantes`) via `reqwest` com `SUPABASE_SERVICE_KEY`.
5. Adquire conexão, injeta RLS, abre **transação**.
6. INSERT em `vendas` (status `PENDENTE_VALIDACAO`), `evidencias_venda`, `comissoes` (status `BLOQUEADA_AUDITORIA`).
7. Commit. Retorna `201` com `{id, status_venda, sha256_checksum, criado_em}`.

### Algoritmos / lógica
- **Anti-fraude por hash:** SHA-256 do comprovante como chave de unicidade (impede reuso do mesmo arquivo em vendas diferentes). 🟢
- **Storage path:** `{aluno_id}/{uuid_v4}_{nome_arquivo}` — namespace por aluno. 🟢
- **Tríade transacional:** venda + evidência + comissão criadas atomicamente; comissão nasce bloqueada. 🟢

### Erros (`VendaError` → `IntoResponse`)
`MissingField`(400) · `InvalidField`(400) · `DuplicateReceipt`(409) · `Upload`(500) · `Database`(500) · `Rls`(500) · `Multipart`(400).

🔴 **Lacuna L1 (DDL):** o INSERT usa `status` (coluna real é `status_venda`), tabela `evidencias_venda` (real é `evidencias_vendas`), e omite `criado_por` (NOT NULL) + `beneficiario_id`/`valor_comissao` em comissoes (NOT NULL). **O código não compila contra o DDL.**
🔴 **Lacuna L7:** frontend envia JSON, backend espera multipart.

---

## Módulo `auditoria` (backend)

**Arquivo:** `backend/src/routes/auditoria.rs`
**Rotas:** `POST /api/v1/auditoria/:id/aprovar` · `POST /api/v1/auditoria/:id/devolver`

### `approve`
1. Guard: `user.role == "AUDITOR"` senão `403`.
2. Injeta RLS. Busca `(status_venda, data_inicio_curso)` join `vendas`+`cursos`.
3. Valida status atual `== PENDENTE_VALIDACAO` (senão `409 INVALID_STATUS`).
4. **Regra de negócio-chave:** compara `data_inicio_curso` com hoje:
   - `data_inicio > hoje` → comissão = `AGUARDANDO_INICIO_AULAS`
   - senão → comissão = `LIBERADA_PAGAMENTO`
5. Transação: `UPDATE vendas SET status='APROVADA'`, `UPDATE comissoes SET status_comissao=...`, `INSERT vendas_historico_status`.
6. Commit. Retorna `{venda_id, status_venda, status_comissao}`.

### `devolver`
1. Guard AUDITOR. Valida `motivo_devolucao.trim().len() >= 10` (senão `400 INVALID_REJECTION_REASON`).
2. Valida status `PENDENTE_VALIDACAO`.
3. Transação: `UPDATE vendas SET status='DEVOLVIDA_AJUSTE', motivo_devolucao=$1`, insert histórico.
4. Comissão permanece `BLOQUEADA_AUDITORIA` (não é tocada).

### Algoritmos / lógica
- **Máquina de estados de venda** (derivada): `PENDENTE_VALIDACAO → APROVADA | DEVOLVIDA_AJUSTE`. Aprovação libera comissão condicionalmente à data de início do curso. 🟢
- **Histórico imutável:** toda transição grava em `vendas_historico_status` com `alterado_por`. 🟢

🔴 **Lacuna L1:** `UPDATE comissoes ... WHERE venda_id` ok, mas o `valor_comissao` nunca é calculado/gravado (a coluna é NOT NULL e o INSERT inicial em vendas.rs também não a define).

---

## Módulo `comissoes` (backend)

**Arquivo:** `backend/src/routes/comissoes.rs`
**Rotas:** 🔴 **nenhuma wired em `main.rs`** (L4). Funções existem mas não são expostas.

### Funções
- `list` — agrega comissoes com join vendas/alunos/cursos em JSON. 🔴 Query refere colunas inexistentes (`c.status`, `c.valor`, `c.percentual`, `v.valor_total`...).
- `calcular` — calcula `valor_comissao = ROUND(v.valor_total * cr.percentual_comissao / 100, 2)` para vendas `APROVADA` sem comissão. 🔴 Refere `cr.percentual_comissao`, `v.vendedor_id`, `usuarios` — inexistentes no DDL (que usa `valor_comissao_fixo` em cursos).
- `process_daily_commission_release` — `UPDATE comissoes SET status='LIBERADA_PAGAMENTO' WHERE status='AGUARDANDO_INICIO_AULAS' AND data_inicio_curso <= today`. Job diário (provável cron externo).

### Algoritmos
- **Liberação por data de início:** comissão em `AGUARDANDO_INICIO_AULAS` vira `LIBERADA_PAGAMENTO` quando `data_inicio_curso <= hoje` (America/Sao_Paulo, UTC-3 fixo). 🟢 (lógica correta)
- 🟡 **Inferido (I2):** há dois modelos de cálculo conflitantes — DDL usa `valor_comissao_fixo` (valor fixo por curso), mas `calcular` usa `percentual_comissao` (percentual). **Decisão de negócio não resolvida.**

---

## Módulo `fechamento` (backend)

**Arquivo:** `backend/src/routes/fechamento.rs`
**Rota:** `POST /api/v1/fechamento/processar-mensal` · handler `processar`

### Fluxo
1. Guard: `user.role == "GESTOR"` senão `403`.
2. Body: `{ mes_competencia: "YYYY-MM" }`. Injeta RLS.
3. **CTE transacional** (única query):
   - `comissoes_a_pagar`: comissoes `LIBERADA_PAGAMENTO` e `paga_em IS NULL`.
   - `lancamentos`: `INSERT INTO livro_caixa_lancamentos` (tipo `PAGAMENTO_COMISSAO`) para cada.
   - `atualizados`: `UPDATE comissoes SET status='PAGA', paga_em=NOW()`.
   - Retorna JSON `{mes_competencia, total_comissoes_pagas, quantidade_lancamentos, status:'FECHADO_SUCESSO'}`.

### Algoritmos / lógica
- **Fechamento mensal idempotente por status:** só paga comissões `LIBERADA_PAGAMENTO` não pagas. Reprocessar o mesmo mês só afeta o que ficou pendente. 🟡 (idempotência parcial — não bloqueia reprocessamento do mesmo mês).
- **Livro-caixa append-only:** garantido por trigger `block_update_delete_livro_caixa` no DDL. 🟢

🔴 **Lacuna L1:** o INSERT usa colunas inexistentes (`tipo`, `venda_id`, `valor`, `descricao`, `created_at`). Reais: `tipo_lancamento`, `comissao_id`, `valor_credito`/`valor_debito`, `historico`, `criado_em`.

---

## Módulo `contratos` (backend)

**Arquivo:** `backend/src/routes/contratos.rs`
**Rota:** `POST /api/v1/vendas/:id/gerar-contrato` · handler `gerar`

### Fluxo
1. Guard: `VENDEDOR` ou `SECRETARIA` senão `403`.
2. Busca `ContratoData` (join vendas+alunos+cursos+usuarios).
3. Cria dir temporário, gera template **Typst** (`generate_typst_template`).
4. `spawn_blocking` → `typst compile` CLI → PDF.
5. Lê PDF, faz upload para bucket `contratos_pdf` via `reqwest`.
6. Gera **signed URL** (expira em 3600s) e retorna.
7. Limpa dir temporário em todos os caminhos (erro/sucesso).

### Algoritmos / lógica
- **Geração de PDF via CLI externo:** depende do binário `typst` instalado no host. 🔴 Sem fallback, sem checagem de existência prévia.
- **Signed URL com fallback gracioso:** se o upload do PDF falha → `502`; se o sign falha → `200` com `status: uploaded_no_signed_url`. 🟡
- 🟡 Template hardcoded em Rust (não lê `backend/templates/`, que está vazio — L3).

🔴 **Lacuna L1:** query refere `v.valor_total`, `v.forma_pagamento`, `v.vendedor_id`, `u.nome`, `usuarios` — inexistentes no DDL.

---

## Módulo `auth-rls` (backend)

**Arquivos:** `backend/src/middleware/auth.rs`, `middleware/rls.rs`

### `AuthUser` (extractor Axum)
1. Lê header `Authorization: Bearer <token>`. Sem header → `401 MissingToken`; scheme errado → `401`.
2. `decode_header` → pega `kid`. Busca JWKS em `{SUPABASE_URL}/auth/v1/.well-known/jwks.json`.
3. Encontra JWK com `kid` correspondente, monta `DecodingKey::from_rsa_components(n, e)`.
4. `decode::<JwtClaims>` com `Algorithm::RS256`, audience `["authenticated"]`, issuer `{SUPABASE_URL}/auth/v1`.
5. Extrai `sub` (→ UUID) e `app_metadata.app_role` (default `"authenticated"`).

### `inject_rls_context`
1. Monta claims JSON `{sub, app_metadata:{app_role}}`.
2. Transação: `SET LOCAL ROLE authenticated` + `set_config('request.jwt.claims', $1, true)`.
3. Commit (as configurações são locais à sessão/transação seguinte).

### Algoritmos / lógica
- **Validação JWT online via JWKS:** busca chaves a cada request (sem cache). 🟡 — risco de latência/falha se Supabase Auth indisponível. Sem refresh de chave.
- **Defesa em profundidade:** RLS aplicada mesmo no backend service-role, pois seta `ROLE authenticated` + claims. 🟢
- 🔴 **L6:** `FromRef` é redefinido localmente (trait custom) — padrão não usual; `telemetry.rs` usa `sentry` não declarado.

---

## Módulo `frontend-shell`

**Arquivos:** `app/layout.tsx`, `app/page.tsx`, `app/auth/login/page.tsx`, `app/auth/callback/route.ts`, `components/providers.tsx`, `lib/supabase.ts`, `lib/auth.ts`, `types/index.ts`

### Estrutura
- **Root layout:** fonte Inter, `lang="pt-BR"`, tema escuro `#1e293b`, metadata PWA (`manifest.json`, apple-touch-icon). `Providers` é **pass-through** (sem context provider real).
- **Home (`/`):** verifica sessão via `supabase.auth.getUser()`; mostra CTA "Acessar" ou "Ir para Dashboard".
- **Login (`/auth/login`):** `signIn(email,password)` → `supabase.auth.signInWithPassword`. Sucesso → redirect `/dashboard`.
- **Callback (`/auth/callback`):** troca `code` por sessão (OAuth), redirect `next` (default `/dashboard`).
- **Clients Supabase:** `createBrowserClient` (SSR browser) e `createServerComponentClient` (Server Components, cookies).

### Lógica
- **Auth helpers:** `signIn`, `signOut`, `getUser`, `getProfile` (lê `app_metadata.app_role`).
- 🟡 **Inferido:** guardas de rota são **client-side** via `getProfile()` + `router.push` (ex.: dashboard exige GESTOR, auditoria exige AUDITOR, carteira exige VENDEDOR/SECRETARIA). Sem middleware Next.js de proteção server-side.

---

## Módulo `frontend-alunos`

**Arquivos:** `app/alunos/page.tsx`, `app/alunos/novo/page.tsx`

### Listagem (`/alunos`)
Tabela com busca por nome. Dados `MOCK_ALUNOS` (5 registros). Mostra pendência de documentos (`{pendentes}/{total} pendentes`). 🔴 Mockado (L8).

### Cadastro (`/alunos/novo`)
- Form: nome, CPF, RG, email, telefone + 4 documentos (RG, CPF, comprovante residência, histórico).
- **Validação de CPF client-side** (`isValidCPF`): algoritmo completo de dígitos verificadores (fatores [10..2] e [11..2], mod 11, regra do 10→0). 🟢 Implementação correta.
- Upload de docs (file input) com estado "Pendente/Entregue".
- `handleSalvar`: 🔴 **mock** (`setTimeout`, `console.log`, não persiste).
- `handleGerarContrato`: 🔴 **mock** (URL `contratos.example.com`).

---

## Módulo `frontend-dashboard`

**Arquivos:** `app/dashboard/page.tsx`, `app/auditoria/page.tsx`, `app/carteira/page.tsx`

### Dashboard (`/dashboard`) — GESTOR
- Guarda client-side: `role === 'GESTOR'` senão redirect `/`.
- 4 KPIs (faturamento, comissões apuradas, taxa contratos, regularização documental).
- Faturamento por curso (barras CSS) + vendas recentes.
- 🔴 Tudo mockado, banner "Em construção".

### Auditoria (`/auditoria`) — AUDITOR
- Tabs "Pendentes"/"Resolvidas" + busca.
- Ações: `handleAprovar` (`POST /api/v1/auditoria/:id/aprovar`), `handleDevolver` (modal com motivo, validação `>= 10` chars, `POST .../devolver`).
- 🟡 **Integração real** com a API Rust (única página além de vendas/novo que chama o backend), mas lista é mockada — não reflete pós-ação.

### Carteira (`/carteira`) — VENDEDOR/SECRETARIA
- 4 cards agregados (total, liberadas, pendentes, pagas) + tabela de comissões.
- 🔴 Tudo mockado.

---

## Resumo de entidades (dicionário resumido)

> Dicionário completo em `_reversa_sdd/data-dictionary.md`.

**Tabelas (DDL canônico):** `cursos`, `alunos`, `vendas`, `evidencias_vendas`, `vendas_historico_status`, `comissoes`, `livro_caixa_lancamentos`, `documentos_alunos`.

**Enums:** `status_venda_enum` (4 valores), `status_comissao_enum` (5 valores), `categoria` (4 valores), `tipo_documento` (4 valores), `tipo_lancamento` (2 valores).

**Papéis RBAC:** VENDEDOR, SECRETARIA, AUDITOR, GESTOR.

---

## Matriz de confiança por módulo

| Módulo | 🟢 | 🟡 | 🔴 |
|--------|----|----|----|
| vendas | 3 | 0 | 2 (L1, L7) |
| auditoria | 3 | 0 | 1 (L1) |
| comissoes | 1 | 1 (I2) | 2 (L1, L4) |
| fechamento | 1 | 1 | 1 (L1) |
| contratos | 0 | 2 | 2 (L1, L3) |
| auth-rls | 2 | 1 | 1 (L6) |
| frontend-shell | 2 | 1 | 0 |
| frontend-alunos | 1 | 0 | 2 (L7, L8) |
| frontend-dashboard | 0 | 1 | 3 (L8×3) |
