# Roadmap: Kanban de Pós-Venda

> Identificador: `003-kanban-pos-venda`
> Data: `2026-09-09`
> Requirements: `_reversa_forward/003-kanban-pos-venda/requirements.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Resumo da abordagem

A feature estende o ciclo de vida da Venda com etapas de pós-venda entre a criação (hoje `PENDENTE_VALIDACAO`) e a aprovação final (hoje `APROVADA` feita pelo Auditor). Surge um papel novo `FINANCEIRO` no RBAC (a `perfis` e ao `app_metadata.app_role`). O fluxo passa a ser: **Vendedor cria venda → Secretaria valida contrato (upload no bucket `contratos_pdf`) → Financeiro emite cobrança (referência externa) → Aluno paga → Financeiro confirma a 1ª mensalidade (upload do comprovante) → Auditor/Gestor aprova e destrava a comissão**.

As transições de fila são mutações exclusivas de uma nova Edge Function `postvenda-mover` (padrão já existente: serviço com `SERVICE_ROLE_KEY`, mutação só via função, histórico gravado em `vendas_historico_status`). O `status_venda_enum` ganha 4 valores e a política de liberação mensal de comissões passa a exigir venda com 1ª mensalidade paga.

## 2. Princípios aplicados

Não há `.reversa/principles.md` neste projeto. Nenhum conflito a registrar. Diretrizes implícitas respeitadas: mutações sensíveis só via Edge Functions com `SERVICE_ROLE_KEY` (padrão do ADR-002, ver `_reversa_sdd/addenda/001-implementar-v1-comissionamento.md#§4`), auditoria sempre em `vendas_historico_status`, imutabilidade de dados core de venda via trigger.

## 3. Decisões técnicas

| ID | Decisão | Justificativa | Alternativas descartadas | Confidência |
|----|---------|----------------|--------------------------|-------------|
| D-01 | Novo papel `FINANCEIRO` no RBAC (JWT `app_metadata.app_role` + `perfis.role` CHECK + tipos TS) | RF-04 exige separação de responsabilidades; Financeiro é setor distinto de Auditor/Gestor e não pode aprovar comissão | Reusar `AUDITOR` para operar a fila financeira (conflito de atribuições, RNF Segurança exige recusa cross-role) | 🟢 |
| D-02 | Dijkstra do estado: estender `status_venda_enum` com `AGUARDANDO_FINANCEIRO`, `AGUARDANDO_PAGAMENTO_1M`, `PRIMEIRA_MENSALIDADE_PAGA`, `CANCELADA` | RN-01/02/05 exigem etapas explícitas; modelo único de status já usado em listagens/RLS | Tabela Kanban própria (`vendas_kanban_etapas`) ou coluna booleana `etapa` (redundância com `vendas_historico_status`, filas duplicadas) | 🟢 |
| D-03 | Trava RN-03 via colunas novas em `vendas`: `contrato_storage_path`, `boleto_referencia`, `comprovante_pgto_1m_path` | A trava é validada server-side na Edge Function (arquivo realmente enviado), não só na UI | Validar só no frontend (NFR Usabilidade exige trava; RN-03 exige registro de responsável) | 🟢 |
| D-04 | Única Edge Function `postvenda-mover` com máquina de transições por papel (SECRETARIA/FINANCEIRO) | Reúne RN-03 (trava), RN-04 (devolução), RN-05 (cancelar/devolver) num ponto único de enforcement, replicando o padrão de `auditoria-aprovar` | Uma função por transição (`secretaria-concluir`, `financeiro-boleto`, ...) — 7 arquivos quase idênticos | 🟡 |
| D-05 | `auditoria-aprovar` e `auditoria-devolver` passam a operar só sobre `PRIMEIRA_MENSALIDADE_PAGA` | RN-02 condiciona aprovação da comissão à 1ª mensalidade paga | Permitir aprovar em `PENDENTE_VALIDACAO` (quebra RN-02) | 🟢 |
| D-06 | Fila da Secretaria = `PENDENTE_VALIDACAO` (status atual de criação); devolução Financeiro→Secretaria retorna a este status com história registrada | Reaproveita o valor existente; RN-04 registra o motivo no histórico, não precisa de status novo | Novo status `DEVOLVIDA_SECRETARIA` (enum inchado, fila idêntica ao PENDENTE) | 🟡 |
| D-07 | Devolver ao Vendedor (RN-05) reutiliza `DEVOLVIDA_AJUSTE`; cancelamento usa `CANCELADA` e zera a comissão para `ESTORNADA` | Alinha com semântica já existente (`DEVOLVIDA_AJUSTE`) e com `status_comissao_enum` | Criar `CANCELADA_SECRETARIA` separado (desnecessário) | 🟢 |
| D-08 | `liberar-comissoes-diaria` só libera comissões cuja venda esteja em `PRIMEIRA_MENSALIDADE_PAGA` (ou `APROVADA`) | RN-02 — pagamento só após efetivação financeira da 1ª mensalidade | Manter liberação por `data_inicio_curso` independente do pós-venda (vaza a trava antifraude) | 🟡 |
| D-09 | Migração do role usa `ALTER TYPE ... ADD VALUE` + nova migration SQL, sem tocar `001_schema.sql` | Preserva a regra do Reversa de nunca editar o legado; schema evolui por delta (`semver` de migrations já em uso, ex. `20260730094500_*`) | Reescrever `001_schema.sql` (proibido pelo Reversa) | 🟢 |
| D-10 | Role `FINANCEIRO` propagado via `app_metadata`; corrige o sync `perfis.role` → `app_role` (gap herdado do 002) | RLS e `useUser` leem `app_metadata.app_role`; sem sync o papel novo não teria efeito | Manter fora do escopo — papel não funcionaria (RN/RF bloqueados) | 🟡 |

## 4. Premissas

Nenhuma `[DÚVIDA]` pendente — sessão `/reversa-clarify` 2026-09-09 zera as lacunas do `requirements.md`. Respostas viraram regras RN-03 a RN-06.

## 5. Delta arquitetural

| Componente | Arquivo de origem no legado | Tipo de mudança | Resumo |
|------------|------------------------------|-----------------|--------|
| `vendas` (DDL/RLS) | `supabase/migrations/001_schema.sql` | regra-alterada | Enum estendido + 3 colunas de contraprova + acesso `FINANCEIRO` no SELECT de `vendas` |
| `auth/rls` (RBAC) | `supabase/migrations/001_schema.sql`, `supabase/migrations/20260730094500_create_perfis_table.sql` | regra-alterada | `FINANCEIRO` no CHECK de `perfis`, nas policies de `vendas`, `evidencias_vendas`, `vendas_historico_status`, `comissoes` |
| `auth` (prototype TS) | `src/types/index.ts`, `supabase/functions/_shared/types.ts`, `src/hooks/useUser.ts` | regra-alterada | `AppRole`/`UserRole` ganham `FINANCEIRO` |
| `auth` (gestão de usuários) | `src/app/actions/usuarios.ts`, `src/app/admin/usuarios/page.tsx` | regra-alterada | Opção `FINANCEIRO` no select + sync `perfis.role` → `app_metadata` |
| `vendas` (Edge Function) | `supabase/functions/postvenda-mover/` *(novo)* | componente-novo | Máquina de transições da fila de pós-venda com travas e histórico |
| `auditoria` (Edge Function) | `supabase/functions/auditoria-aprovar/index.ts`, `supabase/functions/auditoria-devolver/index.ts` | regra-alterada | Só operam a partir de `PRIMEIRA_MENSALIDADE_PAGA` |
| `comissoes` (agendador) | `supabase/functions/liberar-comissoes-diaria/` | regra-alterada | Gate extra por status da venda (1ª mensalidade paga) |
| Storage | `supabase/setup-storage.sql` | regra-alterada | `comprovantes_insert/select` seguem válidos para a upload de comprovante do Financeiro (path `sub/`); sem mudança estrutural |
| Frontend-Dashboard | `src/components/DashboardLayout.tsx` | regra-alterada | Item de navegação "Pós-Venda" para SECRETARIA/FINANCEIRO (+ GESTOR/AUDITOR leitura) |
| Frontend-Auditoria | `src/app/auditoria/page.tsx` | regra-alterada | Fila passa a consultar `PRIMEIRA_MENSALIDADE_PAGA` |
| Frontend-Pós-Venda | `src/app/postvenda/page.tsx` *(novo)* | componente-novo | Kanban por papel (Secretaria e Financeiro) com upload e travas visuais |

## 6. Delta no modelo de dados

- `status_venda_enum` recebe 4 valores novos (`AGUARDANDO_FINANCEIRO`, `AGUARDANDO_PAGAMENTO_1M`, `PRIMEIRA_MENSALIDADE_PAGA`, `CANCELADA`) via `ALTER TYPE ... ADD VALUE`.
- Tabela `vendas` recebe colunas opcionais: `contrato_storage_path`, `boleto_referencia`, `comprovante_pgto_1m_path` (todas `VARCHAR`, sem default — preenchidas pela Edge Function sob trava).
- Tabela `perfis` e políticas RLS ganham o papel `FINANCEIRO`.
- Sem tabelas novas; `vendas_historico_status` já cobre a trilha (append-only) com `motivo` e `mudado_por`.
- Detalhe completo em: `_reversa_forward/003-kanban-pos-venda/data-delta.md`

## 7. Delta de contratos externos

| Contrato | Tipo | Arquivo de detalhe |
|----------|------|--------------------|
| `postvenda-mover` (novo) | Edge Function HTTP (Deno) | `_reversa_forward/003-kanban-pos-venda/interfaces/postvenda-mover.md` |
| `auditoria-aprovar` (alterado) | Edge Function HTTP (Deno) | `_reversa_forward/003-kanban-pos-venda/interfaces/auditoria-aprovar.md` |
| `auditoria-devolver` (alterado) | Edge Function HTTP (Deno) | `_reversa_forward/003-kanban-pos-venda/interfaces/auditoria-devolver.md` |
| Storage `contratos_pdf` | Supabase Storage (upload) | contido em `postvenda-mover.md` (pré-condição da trava) |

## 8. Plano de migração

1. Migration `20260909_create_postvenda_status.sql`: `ALTER TYPE status_venda_enum ADD VALUE 'AGUARDANDO_FINANCEIRO'`, `'AGUARDANDO_PAGAMENTO_1M'`, `'PRIMEIRA_MENSALIDADE_PAGA'`, `'CANCELADA'`; `ALTER TABLE vendas ADD COLUMN contrato_storage_path`, `boleto_referencia`, `comprovante_pgto_1m_path` (nullable); CHECK de `perfis.role` estendido com `'FINANCEIRO'` (drop + recria constraint).
2. Migration `20260909_add_financeiro_rls.sql`: policies `FINANCEIRO` para SELECT em `vendas`, `vendas_historico_status`, `comissoes`, `evidencias_vendas`.
3. `src/types/index.ts` e `supabase/functions/_shared/types.ts`: adicionar `FINANCEIRO`.
4. `src/app/actions/usuarios.ts`: ao atualizar `perfis.role`, sincronizar `auth.admin.updateUserById({ app_metadata: { app_role } })`.
5. `src/app/admin/usuarios/page.tsx`: opção "Financeiro" no select de papel.
6. Novos Edge Functions `postvenda-mover/` (+ `index.ts`, `deno.json` se projeto usa por função).
7. Ajustes em `auditoria-aprovar`/`auditoria-devolver` (entrada `PRIMEIRA_MENSALIDADE_PAGA`) e `liberar-comissoes-diaria` (gate por venda).
8. Frontend: página `/postvenda` com colunas por papel e uploading; nav em `DashboardLayout`; `auditoria/page.tsx` passa a filtrar `PRIMEIRA_MENSALIDADE_PAGA`.
9. Seed/teste manual via `onboarding.md`.

## 9. Riscos e mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| `app_role` no JWT não refletir o papel novo (gap 002 do sync `perfis`→`app_metadata`) | alto | alta | D-10: `atualizarRole` passa a sincronizar `app_metadata`; senão RLS e `useUser` ignoram FINANCEIRO |
| Vendas criadas antes da feature (status `PENDENTE_VALIDACAO` já aprovadas pelo Auditor) — questão descartada no clarify | médio | média | Sem vendas legadas em produção (sistema em dev); validar via onboarding |
| `liberar-comissoes-diaria` liberar fora da regra RN-02 | alto | média | Gate no SQL/function por `vendas.status`; teste de regressão cobre |
| Upload da trava sem real envio (preenchimento falso) | alto | média | Validação em servidor: função exige caminho existente no bucket + Tamanho/MIME; UI desabilita botão (RNF Usabilidade) |
| Enum `status_venda_enum` em uso por outras policies não atualizadas | médio | média | Varredura por `status` em `supabase/functions` e `src` na `/reversa-coding` |

## 10. Critério de pronto

- [ ] Migration de enum/colunas/RLS aplicada sem quebrar políticas existentes
- [ ] `postvenda-mover` bloqueia transições sem a trava correspondente (testes)
- [ ] `auditoria-aprovar` recusa venda ≠ `PRIMEIRA_MENSALIDADE_PAGA`
- [ ] `liberar-comissoes-diaria` não libera comissão de venda sem 1ª mensalidade paga
- [ ] Página `/postvenda` operacional para SECRETARIA e FINANCEIRO; rota/role protegida
- [ ] Todas as ações do `actions.md` marcadas `[X]`
- [ ] `cross-check.md` (se executado) sem CRITICAL nem HIGH
- [ ] `regression-watch.md` gerado
- [ ] Re-extração reversa executada e sem regressão vermelha (recomendado)

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-09 | Versão inicial gerada por `/reversa-plan` | reversa |