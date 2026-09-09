# Investigation: Kanban de Pós-Venda

> Identificador: `003-kanban-pos-venda`
> Data: `2026-09-09`
> Objetivo: registrar a pesquisa de fundo e as alternativas avaliadas que sustentam o `roadmap.md`.

## 1. Fonte viva do sistema (código real, não os specs 🟡 da fase de planejamento)

A extração `_reversa_sdd/` foi gerada antes das decisões ADR-001/ADR-002 (ver `_reversa_sdd/addenda/001-implementar-v1-comissionamento.md`). O state-of-the-art atual foi verificado direto no código:

- **Backend = Supabase Edge Functions (Deno/TS)**: `vendas`, `auditoria-aprovar`, `auditoria-devolver`, `liberar-comissoes-diaria`, `fechamento-mensal`, `gerar-contrato`. Backend Rust está em `_archive/experimento-rust-v0/` (descartado).
- **Frontend = Next.js 14 App Router na raiz** (`src/app/`), não em `frontend/`.
- **DDL = `supabase/migrations/001_schema.sql`** + migrations de perfis `20260730094500_*`.

Arquivos lidos (verdades de base):
| Arquivo | O que confirma |
|---------|----------------|
| `supabase/migrations/001_schema.sql` | `status_venda_enum` com 3 valores; nenhuma policy UPDATE em `vendas` (mutações só por função com service role); RLS por `app_metadata.app_role` |
| `supabase/migrations/20260730094500_create_perfis_table.sql` | Tabela `perfis` com CHECK de 4 roles; trigger `handle_new_user` grava VENDEDOR default |
| `supabase/functions/auditoria-aprovar/index.ts` | Padrão de mutação: checa role no JWT → lê venda → valida estado (`PENDENTE_VALIDACAO`) → atualiza venda+comissão → grava histórico |
| `supabase/functions/_shared/client.ts` | `getServiceRoleClient()` + `getUserAndRole(req)` (lê `app_metadata.app_role`) |
| `supabase/setup-storage.sql` | Buckets privados; `comprovantes` insert por path `sub/`; `contratos_pdf` insert VENDEDOR/SECRETARIA |
| `src/hooks/useUser.ts` | Role do frontend vem de `session.user.app_metadata.app_role` |
| `src/app/auditoria/page.tsx` | Fila atual consulta `status = PENDENTE_VALIDACAO` via Supabase client (RLS) |
| `src/components/DashboardLayout.tsx` | Menu lateral filtra itens por role |
| `src/app/actions/usuarios.ts` | `atualizarRole` só atualiza `perfis.role` — **não** sincroniza `app_metadata` (gap) |

## 2. Alternativas avaliadas

### 2.1 Onde por a fila? Edge Function dedicada vs SQL direto pelo cliente
- **Avaliado:** como as listagens de vendas hoje usam o Supabase client direto (RLS), poderíamos permitir UPDATE direto na coluna `status` via policy nova.
- **Rejeitado:** quebraria a trava RN-03 (o cliente poderia setar `status` sem upload), o histórico e o audit-log de responsável. O padrão existente (mutações sensíveis só via Edge Function com service role) é o correto. **Adotado:** `postvenda-mover`.

### 2.2 Papel FINANCEIRO vs reaproveitar AUDITOR
- **Avaliado:** auditor poderia operar as filas financeiras.
- **Rejeitado:** conflito de atribuição — o Auditor aprova a comissão; se ele também operar a fila, pode confirmar o próprio pagamento (segregação antifraude falha). O RNF Segurança ("o banco deve recusar mutações cross-role") exige papel distinto. **Adotado:** `FINANCEIRO`.

### 2.3 Trava: link colado vs upload obrigatório (resolvido no clarify)
- O cliente escolheu **upload de arquivo (PDF/imagem)** como trava. O bucket `compropantes` já aceita png/jpeg/webp/pdf e o `contratos_pdf` aceita `application/pdf`; `react-dropzone` já é dependência no `package.json`.

### 2.4 Estado da venda: novos valores vs estado derivado
- **Avaliado:** derivar filas de pós-venda por join/histórico sem tocar o enum.
- **Rejeitado:** o enum é o único modelo de status já usado em todas as listagens e RLS; derivar tabelas paralelas aumentaria complexidade sem ganho. **Adotado:** extensão do enum (`ALTER TYPE ADD VALUE`), que não quebra os valores existentes.

## 3. Padrões aplicáveis

- **Estado por enum + histórico append-only** — já implementado (`vendas_historico_status`), mantido.
- **Máquina de estados explícita em Edge Function** — replicar o estilo declarativo de `auditoria-aprovar`.
- **Trava server-side + UI desabilitada** — RN-03 (enforcement no banco/função) + NFR Usabilidade (botão desabilitado). O padrão de validação de motivo (≥10 chars em `auditoria-devolver`) é referência para as travas de cancelamento/devolução.

## 4. Gaps/lacunas descobertos (não eram requisitos)

1. **Sync `perfis.role` → `app_metadata.app_role` ausente** (herdado da feature 002). Sem isso o papel FINANCEIRO não teria efeito real em RLS/useUser. Vira D-10 no roadmap.
2. **`src/middleware.ts` é esqueleto** (bloqueio de `/admin` comentado). Não bloqueia laziamente rotas por role; para o `/postvenda`, a proteção deve ser feita na página (ex: mesmo padrão da auditoria, redirect p/ login se sem role) e na Edge Function.
3. **Listagens do Financeiro** precisam de colunas de contexto na view (nome aluno/curso) via `.select('*, alunos(nome), cursos(nome)')` como na auditoria — o RLS de `vendas` precisa incluir `FINANCEIRO` senão a query retorna vazio.

## 5. Fontes externas

Nenhuma dependência externa nova. API bancária é **Won't Have** (requirements.md §8) — o campo `boleto_referencia` apenas registra a referência emitida externamente.

## 6. Conclusão

A abordagem adotada reutiliza integralmente a infraestrutura existente (Edge Functions + RLS + histórico + storage) e adiciona o mínimo novo: 1 Edge Function de transições, 4 valores de enum, 3 colunas de contraprova, papel FINANCEIRO e 1 página Kanban.