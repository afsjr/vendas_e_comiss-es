# Roadmap: V1 do Sistema de Comissionamento e Vendas

> Identificador: `001-implementar-v1-comissionamento`  
> Data: `2026-07-23` · **Revisado em `2026-07-27` para a stack TypeScript (ADR-001/002)**  
> Requirements: `_reversa_forward/001-implementar-v1-comissionamento/requirements.md`  
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA  

---

## 1. Resumo da abordagem

A V1 do Sistema de Comissionamento e Vendas será construída em **TypeScript fim-a-fim**, alinhada à decisão homologada em `_reversa_sdd/decisions-gate.md` seção 4 (ADR-001/002): **Frontend Next.js 14 (App Router) PWA** na Vercel, **mutações sensíveis como Supabase Edge Functions (Deno/TS)** na borda do Supabase, e **PostgreSQL 16 no Supabase Cloud** (com Supabase Auth e Storage Privado) tendo o DDL `001_schema.sql` como fonte canônica. As leituras do PWA são feitas diretamente pelo client Supabase respeitando RLS; as 5 mutações server-side (criar venda, aprovar/devolver auditoria, fechamento mensal, gerar contrato) executam como Edge Functions com acesso seguro à `SERVICE_ROLE_KEY` e à lógica transacional. O isolamento por perfil (`VENDEDOR`, `SECRETARIA`, `AUDITOR`, `GESTOR`) é executado nativamente no PostgreSQL via Row Level Security (RLS). O fuso horário de referência para corte de fechamento mensal, trava de início de aulas e auditoria é estritamente `America/Sao_Paulo` (UTC-3).

> **Nota de proveniência:** A versão original (2026-07-23) descrevia um backend Rust/Axum conteinerizado no Fly.io. Após a engenharia reversa constatar que o backend Rust **não compila** contra o DDL canônico e diverge de DEC-02 (modelo percentual vs. valor fixo), a stack foi homologada como TypeScript (ADR-001). O código Rust permanece no repositório como **registro do experimento**, sem ser mantido ou evoluído.

---

## 2. Princípios aplicados

| Princípio | Como a feature se relaciona | Status |
|-----------|------------------------------|--------|
| n/a | Nenhum arquivo `principles.md` cadastrado no projeto. | n/a |

---

## 3. Decisões técnicas

| ID | Decisão | Justificativa | Alternativas descartadas | Confidência |
|----|---------|----------------|--------------------------|-------------|
| **D-01** | **Stack TypeScript fim-a-fim (ADR-001)** | Next.js 14 (App Router) no frontend + Supabase Edge Functions (Deno/TS) para as mutações sensíveis. Uma única linguagem, tipos compartilhados com o DDL, hot reload e SDK Supabase de 1º partido. | Backend Rust/Axum (não compila contra o DDL; modelo percentual divergente; JWKS reimplementado manualmente). API Routes Next.js (exporiam a `SERVICE_ROLE_KEY` no frontend). | 🟢 |
| **D-02** | **Supabase Auth + PostgreSQL RLS Granular por Operação (DEC-04)** | Políticas SQL distintas para SELECT, INSERT e UPDATE utilizando a claim protegida `app_metadata.app_role` lida via `request.jwt.claims`. DELETE é totalmente proibido (sem policy). | Policy genérica `FOR ALL` que concederia permissão irrestrita a Auditores/Gestores. | 🟢 |
| **D-03** | **Validação Server-Side de SHA-256 na Edge Function (DEC-05)** | A Edge Function recalcula o SHA-256 dos bytes do comprovante via `crypto.subtle` (Deno nativo) e o PostgreSQL aplica constraint de unicidade (`unique_hash_sha256`), retornando HTTP `409 Conflict`. | Confiar apenas no hash pré-calculado pelo navegador. | 🟢 |
| **D-04** | **Trava de Liberação de Comissão e Scheduled Function (DEC-03, ADR-002)** | Comissão transiciona para `LIBERADA_PAGAMENTO` somente quando `status_venda == APROVADA` E `data_inicio_curso <= HOJE`. A liberação diária executa como **Supabase scheduled function** (cron do Supabase) no fuso `America/Sao_Paulo`, não on-demand. | Liberação imediata sem verificação de início das aulas; worker Rust externo sem rota ligada. | 🟢 |
| **D-05** | **Livro-Caixa Append-Only (DEC-06)** | Tabela `livro_caixa_lancamentos` possui triggers de banco que bloqueiam `UPDATE` e `DELETE`, registrando estornos como débitos auditáveis. | Edição/exclusão física de lançamentos contábeis passados. | 🟢 |
| **D-06** | **Minutas em PDF via Edge Function TS + Storage Privado** | Geração do PDF na Edge Function com biblioteca TS compatível com Deno (e.g. `pdf-lib`/`pdfkit`), migrando o template `.typ` (Typst) para um template TS. Gravação em Supabase Storage Privado e entrega ao PWA por Signed URL temporária (15 min). | Compilação via Typst CLI dentro de uma Edge Function (sem suporte a binário nativo na borda); retorno de buffer binário direto na resposta HTTP. 🟡 A escolha final da biblioteca de PDF é um ponto em aberto para o detalhamento do forward. | 🟢 |
| **D-07** | **Timezone Operacional Padronizado `America/Sao_Paulo`** | Garantia de fuso único para fechamento mensal (corte às 23:59:59), liberação de aulas e relatórios. | Fuso dependente do servidor local ou UTC bruto. | 🟢 |
| **D-08** | **Imutabilidade Cadastral de Vendas e `ON DELETE RESTRICT`** | Trigger `trg_prevent_vendas_data_mutation` impede alteração de `aluno_id`, `curso_id`, `valor_entrada` e `criado_por`. FK de evidências utiliza `ON DELETE RESTRICT` e exclusão física é totalmente vedada. | Permitir UPDATE livre nos campos cadastrais ou exclusão física por CASCADE. | 🟢 |

---

## 4. Premissas

*Nenhuma premissa pendente. Todos os requisitos e especificações de negócio foram homologados no `decisions-gate.md` (DEC-01..07) e a stack de implementação no ADR-001/002.*

**Pontos ainda em aberto para o detalhamento do forward (não bloqueiam este roadmap):**
- **L4:** confirmação de que a liberação diária de comissões roda como Supabase scheduled function (cron) — adotado aqui como hipótese.
- **L5:** definição da URL base das Edge Functions no `.env` do frontend (`NEXT_PUBLIC_SUPABASE_URL` + `/functions/v1/<name>`).
- **D-06:** escolha final da biblioteca TS de geração de PDF compatível com Deno.

---

## 5. Delta arquitetural

| Componente | Arquivo de origem no legado | Tipo de mudança | Resumo |
|------------|------------------------------|-----------------|--------|
| **`vendas_core`** | `_reversa_sdd/sdd/apontamento-vendas-cotacoes.md` | componente-novo (Edge Function TS) | Edge Function de recebimento de apontamentos, validação SHA-256 server-side e INSERT transacional de `vendas` + `evidencias_vendas`. Substitui `backend/src/routes/vendas.rs`. |
| **`auditoria_engine`** | `_reversa_sdd/sdd/auditoria-apontamentos.md` | componente-novo (Edge Function TS) | Edge Function da máquina de estados de aprovação/devolução com motivo obrigatório e cálculo dinâmico do status da comissão conforme `data_inicio_curso`. Substitui `backend/src/routes/auditoria.rs`. |
| **`comissoes_ledger`** | `_reversa_sdd/sdd/comissoes-livro-caixa.md` | componente-novo (Edge Function + scheduled function TS) | Edge Function de fechamento mensal + scheduled function de liberação diária com trava de início de aulas e livro-caixa append-only. Substitui `backend/src/routes/comissoes.rs` e `fechamento.rs`. |
| **`contratos_pdf`** | `_reversa_sdd/sdd/geracao-contrato-plano-financeiro.md` | componente-novo (Edge Function TS) | Gerador de minutas de contrato em PDF via biblioteca TS (Deno), com gravação em Storage Privado e Signed URL. Substitui `backend/src/routes/contratos.rs` + `generate_typst_template`. |
| **`pwa_frontend`** | `_reversa_sdd/prd.md#3-requisitos-funcionais` | componente-novo (Next.js TS) | Interface web PWA Next.js para vendedores, secretaria, auditores e gestores. Leituras via client Supabase + RLS; mutações via chamada às Edge Functions. |

---

## 6. Delta no modelo de dados

- **Resumo das mudanças:** o DDL canônico `supabase/migrations/001_schema.sql` **permanece inalterado** como fonte da verdade — enums `status_venda_enum` e `status_comissao_enum`, tabelas `vendas`, `evidencias_vendas` (com `sha256_checksum UNIQUE` e `ON DELETE RESTRICT`), `vendas_historico_status`, `alunos`, `documentos_alunos`, `cursos`, `comissoes` e `livro_caixa_lancamentos` (com triggers append-only). Trava de imutabilidade cadastral via `trg_prevent_vendas_data_mutation` e políticas RLS separadas por operação (`SELECT`, `INSERT`, `UPDATE`; `DELETE` bloqueado por ausência de policy).
- **Detalhe completo em:** `_reversa_forward/001-implementar-v1-comissionamento/data-delta.md`

---

## 7. Delta de contratos externos

| Contrato | Protocolo | Arquivo de detalhe |
|----------|-----------|--------------------|
| **API V1 Vendas & Auditoria** | Invocação de Supabase Edge Functions (JSON + upload de comprovante via Storage) | `_reversa_forward/001-implementar-v1-comissionamento/interfaces/api-v1-vendas.md` |

> A URL base passa a ser `https://<project-ref>.supabase.co/functions/v1/<function-name>`, autenticada com o JWT do usuário no header `Authorization: Bearer <access_token>` (validado pelo Supabase) e — nas mutações que exigem service role — resolvido via secrets da Edge Function, nunca exposto ao frontend.

---

## 8. Plano de migração

1. **Setup de Banco & RLS:** Execução do DDL `001_schema.sql` no Supabase com enums, tabelas, constraints SHA-256, triggers append-only/imutabilidade e políticas RLS por operação (já existente como fonte canônica).
2. **Setup de Storage Privado:** Configuração dos buckets `comprovantes`, `documentos_alunos` e `contratos_pdf` com acesso privado e políticas de Signed URLs (15 min).
3. **Deploy das Edge Functions (TS):** `supabase functions new` para `vendas`, `auditoria-aprovar`, `auditoria-devolver`, `fechamento-mensal`, `gerar-contrato` e a scheduled function `liberar-comissoes-diaria`; `supabase functions deploy`. Secrets (`SERVICE_ROLE_KEY`) configurados no projeto.
4. **Deploy do PWA (Next.js):** Deploy da aplicação frontend na Vercel vinculada ao Supabase Auth e às URLs das Edge Functions; `.env` com `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e, se necessário, URL base das functions.
5. **Carga Inicial do Catálogo:** Inserção do cadastro inicial de cursos com seus respectivos `valor_comissao_fixo`.

---

## 9. Riscos e mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| **Tentativa de reutilização de comprovantes** | Alto | Médio | Validação conclusiva server-side na Edge Function (`crypto.subtle`) + constraint `UNIQUE (sha256_checksum)` no banco, retornando `409 Conflict`. |
| **Bypass indevido de RLS ou Alteração Cadastral** | Crítico | Baixo | Edge Functions usam `service_role` apenas nas mutações estritamente necessárias; RLS separada por operação + Trigger `trg_prevent_vendas_data_mutation`. |
| **Divergência no fechamento mensal por Fuso Horário** | Alto | Baixo | Padronização estrita de todas as operações temporais em `America/Sao_Paulo` (UTC-3); scheduled function agendada no fuso do Supabase. |
| **Cold start / limite de duração das Edge Functions** | Médio | Médio | Mutações são curtas (INSERT/UPDATE transacional); liberação diária particionada por lotes; geração de PDF mantida leve (template TS, não compilação nativa). |
| **Geração de PDF sem binário nativo na borda** | Médio | Médio | Adotar biblioteca TS pura compatível com Deno (`pdf-lib`/`pdfkit`); validar em spike antes do detalhamento final. 🟡 |

---

## 10. Critério de pronto

- [ ] Todas as ações do `actions.md` marcadas com `[X]`
- [ ] Políticas RLS por operação (`SELECT`, `INSERT`, `UPDATE`; `DELETE` bloqueado) testadas (pgTAP ou script `deno test` contra o Postgres)
- [ ] Trava de imutabilidade cadastral de vendas (`aluno_id`, `curso_id`, `valor_entrada`, `criado_por`) testada
- [ ] Validação de hash SHA-256 testada com uploads concorrentes duplicados (retornando `409 Conflict`)
- [ ] Triggers *append-only* testados no `livro_caixa_lancamentos` (bloqueando UPDATE/DELETE)
- [ ] Scheduled function de liberação diária de comissões testada (trava `data_inicio_curso <= HOJE`)
- [ ] Homologação dos contratos das Edge Functions de devolução com motivo e fechamento mensal

---

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-07-23 | Versão inicial gerada por `/reversa-plan` (PL-02) — backend Rust/Axum | reversa |
| 2026-07-23 | Atualização pós REV-20260723-006: RLS por operação, imutabilidade cadastral e contratos de auditoria/devolução | reversa |
| 2026-07-27 | **Revisão de stack para TypeScript (ADR-001/002):** Rust/Axum + Fly.io + cargo-chef substituídos por Supabase Edge Functions (Deno/TS) + Vercel. D-01 (stack), D-03 (SHA-256 na Edge Function), D-04 (scheduled function), D-06 (PDF via biblioteca TS) reescritos; plano de migração, riscos e critério de pronto atualizados. DDL canônico inalterado. | reversa |
