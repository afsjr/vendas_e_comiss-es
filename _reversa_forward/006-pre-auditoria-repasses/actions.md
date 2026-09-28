# Actions: Pré-auditoria de repasses de Graduação

> Identificador: `006-pre-auditoria-repasses`
> Data: `2026-09-28`
> Roadmap: `_reversa_forward/006-pre-auditoria-repasses/roadmap.md`

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de ações | 11 |
| Paralelizáveis (`[//]`) | 4 |
| Maior cadeia de dependência | 5 |

## Fase 1, Preparação

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T001 | Criar migration com as tabelas `relatorios_repasse`, `resumo_repasse_aluno` e `conciliacoes_repasse` (colunas, CHECKs, FKs e índices) | - | - | `supabase/migrations/20260928000000_pre_auditoria_repasses.sql` | 🟢 | `[X]` |
| T002 | Complementar a migration com triggers append-only/guard, RLS restrita a `GESTOR` e criação do bucket `relatorios_repasse` + policies de storage | T001 | - | `supabase/migrations/20260928000000_pre_auditoria_repasses.sql` | 🟢 | `[X]` |
| T003 | Implementar o parser CSV puro (BOM, encoding Latin-1, separador `;`, cabeçalho repetido, valores pt-BR, datas `dd/mm/aa`, competência `MÊS/AAAA`, parcela 1) em módulo compartilhado | - | `[//]` | `supabase/functions/_shared/repasse_parser.ts` | 🟢 | `[X]` |

## Fase 2, Testes

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T004 | Criar testes Deno do parser com o arquivo real (cabeçalhos repetidos, acentos, valores `R$`, competência e identificação da parcela 1) | T003 | - | `tests/pre_auditoria_repasses.test.ts` | 🟢 | `[X]` |
| T005 | Adicionar testes das regras de conciliação: parcela 1 habilita, parcela > 1 não aparece e CPF com múltiplas vendas vira `AMBIGUO` | T004 | - | `tests/pre_auditoria_repasses.test.ts` | 🟢 | `[X]` |

## Fase 3, Núcleo

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T006 | Implementar a Edge Function `pre-auditoria-repasses`, ação `importar`: validar `GESTOR`, baixar o CSV, parsear, conciliar por `alunos.cpf`, aplicar `sha256` UNIQUE e gravar `relatorios_repasse`/`resumo_repasse_aluno`/`conciliacoes_repasse` | T002, T003 | - | `supabase/functions/pre-auditoria-repasses/index.ts` | 🟢 | `[X]` |
| T007 | Implementar a ação `confirmar`: confirmar apenas itens `APARECEU`, gravar `confirmado_por`/`confirmado_em` e mover as comissões vinculadas para `LIBERADA_PAGAMENTO` | T006 | - | `supabase/functions/pre-auditoria-repasses/index.ts` | 🟢 | `[X]` |

## Fase 4, Integração

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T008 | Criar a página `/pre-auditoria` (GESTOR-only): upload via `react-dropzone` + `uploadFile`, disparo da ação `importar`, lista de resultados com filtros e confirmação em lote | T006 | - | `src/app/pre-auditoria/page.tsx` | 🟢 | `[X]` |
| T009 | Adicionar o item de menu "Pré-auditoria" restrito ao papel `GESTOR` | - | `[//]` | `src/components/DashboardLayout.tsx` | 🟢 | `[X]` |

## Fase 5, Polimento

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T010 | Adicionar logs estruturados (`logger`) e mensagens de erro padronizadas na Edge Function | T007 | `[//]` | `supabase/functions/pre-auditoria-repasses/index.ts` | 🟡 | `[X]` |
| T011 | Tratar estados de carregamento, vazio e erro na página, com feedback de importação/confirmação e marcação visual de `AMBIGUO` | T008 | `[//]` | `src/app/pre-auditoria/page.tsx` | 🟡 | `[X]` |

## Notas de execução

<!-- Reservado para /reversa-coding. -->

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-28 | Versão inicial gerada por `/reversa-to-do` | reversa |
