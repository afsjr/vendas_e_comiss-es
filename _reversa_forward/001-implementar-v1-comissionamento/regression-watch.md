# Regression Watch: V1 do Sistema de Comissionamento e Vendas

> **Data:** 2026-07-27  
> **Feature:** `001-implementar-v1-comissionamento`  
> **Contexto:** Greenfield (sem extração de legado `/reversa`)  
> **Status:** Fase 1 concluída (T001-T004)

---

## ⚠️ Nota de Contexto

Este é um **projeto greenfield**. Não há extração prévia de regras 🟢 de código legado. 

A seção "Watch Principal" abaixo estará **vazia até que uma futura rodada de `/reversa`** (re-extração) sobre o código novo implementado confirme as regras de negócio como 🟢. Até lá, os itens aqui registram as **intenções arquiteturais** derivadas das specs SDD.

---

## Watch Principal

*(Vazio - aguardando confirmação de regras via re-extração `/reversa` futura)*

---

## Observações: Requisitos Funcionais Implementados (Fase 1)

| ID | Origem (SDD) | RF esperado após implementação | Status | Prioridade de verificação |
|---|---|---|---|---|
| OBS-001 | `apontamento-vendas-cotacoes.md` | Vendas imutáveis: aluno_id, curso_id, valor_entrada, criado_por (após INSERT) | Trigger `trg_prevent_vendas_data_mutation` em SQL | **CRÍTICO** — testar em T005 |
| OBS-002 | `comissoes-livro-caixa.md` | Livro de caixa append-only: bloqueia UPDATE/DELETE | Trigger `trg_prevent_changes_livro_caixa` em SQL | **CRÍTICO** — testar em T005 |
| OBS-003 | `apontamento-vendas-cotacoes.md` | SHA-256 checksum UNIQUE garante unicidade de comprovantes | Constraint `UNIQUE (sha256_checksum)` em `evidencias_vendas` | **CRÍTICO** — testar em T006 |
| OBS-004 | `auditoria-apontamentos.md` | RLS granular por operação: SELECT, INSERT, UPDATE separadas | Policies em PostgreSQL por operation | **CRÍTICO** — testar em T005 |
| OBS-005 | `comissoes-livro-caixa.md` | Transição AGUARDANDO_INICIO_AULAS → LIBERADA_PAGAMENTO quando data_inicio_curso <= HOJE | Scheduled function `liberar-comissoes-diaria` | **ALTO** — testar em T011 (Fase 3) |
| OBS-006 | `geracao-contrato-plano-financeiro.md` | PDF gerado em Edge Function, storage privado, Signed URL 15 min | Edge Function `gerar-contrato` | **MÉDIO** — testar em T013 (Fase 3) |
| OBS-007 | `apontamento-vendas-cotacoes.md` | Validação server-side SHA-256 via `crypto.subtle` Deno | Edge Function `vendas` | **MÉDIO** — testar em T006 (Fase 2) |

---

## Histórico de Re-extrações

*(Inicialmente vazio — será preenchido quando `/reversa` rodar novamente)*

Após a implementação completa de cada fase:
1. Executar `/reversa` novamente sobre o código finalizado
2. Comparar regras 🟢 extraídas com observações acima
3. Mover confirmadas para "Watch Principal"
4. Registrar data e detalhes da re-extração aqui

---

## Arquivadas

*(Inicialmente vazio — será preenchido se alguma regra for descontinuada)*

---

## Notas para Próximas Rodadas

- **Fase 2 (Testes):** Testes T005-T007 devem verificar OBS-001 a OBS-007.
- **Fase 3 (Núcleo):** Lógica de Edge Functions deve respeitar constraintse RLS.
- **Fase 4-5:** Após conclusão, rodar `/reversa-audit` para validar conformidade com requirements.
- **Re-extração:** Agendar `/reversa` após Fase 5 (Polimento) estar completa e E2E passar.

---

## Histórico

| Data | Ação | Responsável |
|------|------|---|
| 2026-07-27 | Criação de regression-watch.md (Fase 1, greenfield) | reversa-coding |

