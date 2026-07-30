# Perguntas e Lacunas — comissionamento e venda

> Modo autônomo · `answer_mode = file`
> Toda dúvida surgida durante a análise fica registrada aqui para o usuário responder depois.
> Escala: 🔴 LACUNA (requer validação humana) · 🟡 INFERIDO

---

## 🔴 Lacunas estruturais (backend ↔ DDL divergente)

### L1 — Divergência entre schema SQL e queries do backend
O `supabase/migrations/001_schema.sql` define o schema **canônico**, mas vários handlers Rust referenciam colunas/tabelas que **não existem** no DDL, e vice-versa:

| Handler Rust | Query usa | DDL real (`001_schema.sql`) |
|--------------|-----------|----------------------------|
| `vendas.rs:128` | `INSERT INTO vendas (... status, criado_em, atualizado_em)` | coluna chama `status_venda`, não `status` |
| `vendas.rs:138` | `INSERT INTO evidencias_venda` | tabela é `evidencias_vendas` (plural) |
| `vendas.rs:150` | `INSERT INTO comissoes (... status ...)` | coluna é `status_comissao`; falta `beneficiario_id` (NOT NULL) e `valor_comissao` (NOT NULL) |
| `auditoria.rs:130` | `UPDATE comissoes SET status_comissao = $1::status_comissao_enum` | ok, mas o cast de string pode falhar |
| `comissoes.rs:11-32` | `c.status`, `c.valor`, `c.percentual`, `v.valor_total`, `cr.percentual_comissao`, `v.vendedor_id`, tabela `usuarios` | **nenhuma** dessas colunas/tabelas existe no DDL |
| `fechamento.rs:58` | `INSERT INTO livro_caixa_lancamentos (tipo, venda_id, valor, mes_competencia, descricao, created_at)` | colunas reais: `tipo_lancamento`, `comissao_id` (não `venda_id`), `valor_credito`/`valor_debito` (não `valor`), `historico` (não `descricao`), `criado_em` (não `created_at`) |
| `contratos.rs:59-77` | `v.valor_total`, `v.forma_pagamento`, `v.vendedor_id`, `u.nome`, tabela `usuarios` | não existem no DDL |

🔴 **Pergunta:** Qual é a fonte da verdade — o DDL (`001_schema.sql`) ou o código Rust? O backend **não compila contra o schema** atual. Há uma migração mais nova não versionada? Ou o DDL está desatualizado e o Rust é o alvo?

### L2 — `models/mod.rs` vazio
`backend/src/models/mod.rs` está vazio. Os structs de domínio (`ContratoData` em contratos.rs é o único `FromRow`) estão inline nos handlers. 🔴 Havia a intenção de centralizar modelos? Confirmar.

### L3 — `backend/templates/` vazio
O diretório existe mas está vazio. Os templates de contrato são gerados em código (`generate_typst_template` em contratos.rs) usando **Typst**, não arquivos de template. 🟡 Confirmar se a pasta `templates/` é resquício ou destino futuro.

### L4 — Módulo `comissoes` sem rota em `main.rs`
`routes::comissoes` define `list`, `calcular` e `process_daily_commission_release`, mas **nenhum** está ligado no `Router` de `main.rs`. 🔴 São rotas pendentes de wire-up? Ou `process_daily_commission_release` é chamado por um job/cron externo (não encontrado no repo)?

### L5 — Divergência de porta (3000 vs 3001)
`backend/src/main.rs` escuta na porta **3000**. `frontend/.env.local.example` define `NEXT_PUBLIC_API_URL=http://localhost:3001/api`. 🔴 Há um proxy/reverso na frente do backend? Ou o `.env.example` está desatualizado?

### L6 — `telemetry.rs` referencia `sentry` crate não declarado
`backend/src/telemetry.rs` chama `sentry::init`, mas `sentry` **não está** em `Cargo.toml`. `init_sentry` e `init_telemetry` também não são chamados em `main.rs`. 🔴 Código morto ou dependência faltante?

### L7 — Frontend envia JSON; backend espera Multipart
`vendas/novo/page.tsx:146-150` faz `fetch('/api/v1/vendas', { body: JSON.stringify({...}) })` com `Content-Type: application/json`. Mas `vendas.rs:26` exige `Multipart` (campo `comprovante_file`). 🔴 O envio do comprovante nunca chega ao backend como multipart. Há um middleware de proxy Next.js que converte? Ou é frontend ainda não finalizado (usa MOCK_ALUNOS/MOCK_CURSOS)?

### L8 — Frontend amplamente mockado
`dashboard`, `auditoria`, `carteira`, `alunos` (listagem e novo) usam **dados mockados** (`MOCK_ALUNOS`, `comissoesMock`, etc.) com banner "Em construção — dados mockados". 🔴 Confirmar: o frontend é protótipo visual e o backend é a implementação real? Qual é o escopo "entregue" vs "planejado"?

---

## 🟡 Inferências (não confirmadas, baseadas em padrões)

### I1 — Leituras via Supabase client (RLS), mutações via API Rust
Inferido: o frontend não tem rotas GET na API Rust. Listagens provavelmente viriam direto do Supabase via `@supabase/ssr` respeitando RLS — mas **nenhuma página implementa isso** hoje (todas mockadas). A divisão arquitetural intencionada é: Supabase para leitura, Rust para mutações sensíveis (venda, auditoria, fechamento, contrato).

### I2 — `criado_por` / `beneficiario_id` = vendedor logado
Inferido do DDL e do `AuthUser`: `criado_por` em vendas/alunos e `beneficiario_id` em comissoes referenciam `auth.users.id` (o `sub` do JWT). Mas o INSERT de vendas em `vendas.rs:127` **não passa `criado_por`** — contaria com RLS `WITH CHECK`, mas o INSERT explícito omite a coluna (que é NOT NULL).

### I3 — Timezone America/Sao_Paulo
`comissoes.rs:94` usa `FixedOffset::west_opt(3*3600)` (UTC-3). O DDL comenta "America/Sao_Paulo (UTC-3)". 🟡 Não há lógica de horário de verão (BR não usa mais desde 2019, então UTC-3 fixo é correto).

---

## Para o usuário responder (prioridade)

> **Atualização 2026-07-27 — decisão de stack tomada (ADR-001/002 em `decisions-gate.md` seção 4):**
> O projeto é um **experimento**; **TypeScript fim-a-fim** (Next.js + Supabase Edge Functions) é a stack adotada. O backend Rust permanece como registro do experimento, sem ser mantido. Fonte canônica = `001_schema.sql` + `decisions-gate.md`.

1. **L1** — ✅ **Resolvido.** DDL + Gate são a fonte da verdade. Rust divergiu e não compila contra o DDL. Resolvido por **substituição** (Edge Functions TS reimplementarão as mutações), não por saneamento do Rust.
2. **L4** — 🔄 **Reencaminhado ao `/reversa-forward`.** `list`/`calcular`/`process_daily_commission_release` serão reimplementados em TS. A liberação diária provavelmente como **Supabase scheduled function** (cron). Decisão detalhada fica para o forward.
3. **L5** — 🔄 **Reencaminhado ao `/reversa-forward`.** Edge Functions têm URL própria; `NEXT_PUBLIC_API_URL` será redefinido no forward.
4. **L6** — ✅ **Resolvido (mudo).** `telemetry.rs`/sentry pertence ao experimento Rust descartado; irrelevante em TS.
5. **L7** — ✅ **Resolvido.** Frontend `vendas/novo` será reescrito em TS para enviar multipart (ou usar Supabase Storage upload + Edge Function) no forward.
6. **L8** — ✅ **Esclarecido.** Frontend mockado é protótipo visual; integração real faz parte do forward.
7. **I2** — ✅ **Resolvido.** DEC-02 homologou **valor fixo em R$** (`valor_comissao_fixo`). O modelo percentual do Rust estava errado.
