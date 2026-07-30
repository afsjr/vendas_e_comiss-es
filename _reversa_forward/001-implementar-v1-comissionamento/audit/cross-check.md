# Cross-Check de Auditoria — V1 do Sistema de Comissionamento e Vendas

> **Feature:** `001-implementar-v1-comissionamento`
> **Data da auditoria:** `2026-07-27`
> **Auditor:** reversa-audit (somente leitura)
> **Artefatos analisados:**
> - `requirements.md`
> - `roadmap.md`
> - `actions.md`
> **Artefatos de apoio cruzados:**
> - `data-delta.md`
> - `interfaces/api-v1-vendas.md`
> **Fontes de legado (âncora):**
> - `_reversa_sdd/decisions-gate.md` (DEC-01..07 + ADR-001/002)
> - `_reversa_sdd/prd.md`
> - `supabase/migrations/001_schema.sql` (DDL canônico)
> - `_reversa_sdd/addenda/001-implementar-v1-comissionamento.md` (adendo vigente)

---

## Resumo

| Severidade | Quantidade |
|------------|------------|
| CRITICAL | 1 |
| HIGH | 4 |
| MEDIUM | 5 |
| LOW | 2 |
| **Total** | **12** |

> **Aviso:** nenhum dos três artefatos (`requirements.md`, `roadmap.md`, `actions.md`) foi alterado por esta auditoria. O skill é estritamente leitor. As correções sugeridas devem ser feitas manualmente ou via `/reversa-clarify`/edição.

---

## Findings

| ID | Severidade | Eixo | Descrição | Onde está |
|----|-----------|------|-----------|-----------|
| A001 | CRITICAL | Coerência com o legado | Adendo vigente descreve entrega **Rust/Axum** "convergida" (22 ações `[X]`, ~4.781 LOC, Sentry/OTel, Typst) que foi **descartada** pela revisão de stack ADR-001/002 (2026-07-27). O adendo e o `actions.md` estão em contradição direta: o adendo afirma "entrega convergida" enquanto o `actions.md` afirma "nenhuma mutação implementada em TS". | `_reversa_sdd/addenda/001-implementar-v1-comissionamento.md` (seções "Resumo da entrega" e "Impacto por artefato") vs `actions.md` linha 7 (nota de revisão) |
| A002 | HIGH | Cobertura | `actions.md` (resumo, linha 14) declara "17 paralelizáveis (`[//]`)" mas a contagem real de linhas com `[//]` na coluna Paralelismo é **12** (T002, T003, T005, T006, T007, T010, T011, T013, T016, T019, T020, T021). Discrepância de 5 — o resumo do `actions.md` está inflado. | `actions.md` linha 14 vs linhas 21-62 |
| A003 | HIGH | Consistência | `roadmap.md` (D-08) e `actions.md` (T001) citam o trigger de imutabilidade cadastral como `trg_prevent_vendas_data_mutation`, que **existe** no DDL canônico. Porém `data-delta.md` (seção 3.2) e o trigger no DDL `001_schema.sql` (linha 74-90) usam o **nome da função** `block_vendas_data_mutation()` — coerente. Sem divergência de nome real aqui, mas o `data-delta.md` **omite o trigger `trg_prevent_vendas_data_mutation`** na sua listagem textual (só mostra a FUNCTION, não o `CREATE TRIGGER`), ao passo que `actions.md` T001 o lista explicitamente como entregável. Inconsistência de cobertura entre data-delta e actions. | `data-delta.md` seção 3.2 vs `actions.md` T001 |
| A004 | HIGH | Coerência com o legado | `actions.md` T001 lista como entregáveis políticas RLS "por operação (SELECT, INSERT, UPDATE)" e menciona tabela `documentos_alunos`, mas **não menciona** que o DDL canônico (`001_schema.sql` linhas 237-273) também habilita RLS e cria políticas `SELECT`+`INSERT` para `comissoes` e `alunos` — essas não aparecem no `data-delta.md` (que só documenta as 3 policies de `vendas`). Ação T001 omite RLS de `comissoes` e `alunos`, risco de implementação parcial. | `actions.md` T001 e `data-delta.md` seção 4 vs `001_schema.sql` linhas 237-273 |
| A005 | HIGH | Sanidade do actions | `actions.md` T009 (Edge Function `vendas`) declara dependência `T001, T002, T008` mas a própria T009 diz "buscar bytes do Storage via service role" — isso depende de o bucket `comprovantes` existir (T002) **e** do helper `client.ts` (T008). A cadeia está correta, porém T002 (configuração de Storage) tem dependência `-` (nenhuma) e é marcada `[//]` paralelizável, enquanto na prática T002 é **pré-requisito físico** de T009/T013/T015/T018. A coluna de dependências não reflete isso para as tarefas de frontend (T015/T016/T018 só citam T014, não T002), embora usem Signed URLs do Storage. Risco de execução paralela quebrando por Storage ausente. | `actions.md` T002, T009, T013, T015, T016, T018 |
| A006 | MEDIUM | Consistência | T001 em `actions.md` lista as tabelas do DDL mas **omite `alunos`** e **omite `documentos_alunos`** da descrição (só cita `cursos`, `vendas`, `evidencias_vendas`, `vendas_historico_status`, `comissoes`, `livro_caixa_lancamentos`). Como T001 é "aplicar o schema DDL inteiro", a omissão é textual, mas pode induzir o implementador a não criar essas duas tabelas. O DDL canônico cria ambas (linhas 46 e 166). | `actions.md` T001 vs `001_schema.sql` linhas 46-56, 166-174 |
| A007 | MEDIUM | Consistência | `roadmap.md` D-06 e `actions.md` T013 deixam a escolha da biblioteca de PDF em aberto (`pdf-lib`/`pdfkit`, "spike prévio"). `requirements.md` RF-07 também cita "biblioteca compatível com Deno". Esse ponto em aberto é declarado como 🟡 em dois artefatos mas **não há uma ação dedicada de spike** em `actions.md` — o spike é apenas mencionado em "Notas de execução". Risco de atrasar T013 se o spike falhar e não houver ação rastreada. | `roadmap.md` D-06 + `actions.md` T013/notas vs (ausência de ação de spike) |
| A008 | MEDIUM | Cobertura | `requirements.md` RF-03 (Cadastro e Checklist de Documentos do Aluno) menciona RG, CPF, Comprovante de Residência e Histórico. O DDL `001_schema.sql` (linha 169) define `CHECK (tipo_documento IN ('RG', 'CPF', 'COMPROVANTE_RESIDENCIA', 'HISTORICO'))`. `actions.md` T018 cobre o checklist, mas o `data-delta.md` **não documenta a tabela `documentos_alunos`** em nenhuma seção (ela existe no DDL mas está ausente do data-delta). Lacuna de cobertura do data-delta. | `data-delta.md` (ausência) vs `001_schema.sql` linhas 166-174 e `actions.md` T018 |
| A009 | MEDIUM | Consistência | `roadmap.md` seção 5 (delta arquitetural) lista 5 componentes (`vendas_core`, `auditoria_engine`, `comissoes_ledger`, `contratos_pdf`, `pwa_frontend`) mas **não lista componente para o cadastro de alunos / checklist documental** (RF-03), que é uma feature autônoma coberta por T018. O delta arquitetural omite RF-03 como componente novo, embora haja ação (T018). | `roadmap.md` seção 5 vs `requirements.md` RF-03 e `actions.md` T018 |
| A010 | MEDIUM | Coerência com o legado | `interfaces/api-v1-vendas.md` seção 1.5 diz que `POST /gerar-contrato` é invocável por "Vendedor ou Secretaria", mas **não há RLS/policy no DDL** que valide `app_role` para a **tabela que o contrato lê** (`vendas`/`comissoes`). A autorização fica implícita na Edge Function (T008/T013 via `app_role` do JWT), não no banco. Não é um conflito com regra 🟢 do legado, mas o contrato externo declara um ator que não tem enforcement no DDL além do já existente em `vendas_select_policy`. Documentar para evitar dupla-validação. | `interfaces/api-v1-vendas.md` 1.5 vs `001_schema.sql` 182-193 |
| A011 | LOW | Sanidade do actions | `actions.md` T022 (E2E) depende de T015, T016, T017, T018 mas **não depende de T012** (fechamento-mensal) nem de T011 (liberar-comissoes-diaria), embora a descrição do T022 inclua o cenário "fechamento mensal". Sem T012 como dependência, o E2E pode rodar sem o endpoint de fechamento implementado. | `actions.md` T022 dependências |
| A012 | LOW | Cosmético | `actions.md` T001 cita o trigger append-only como `trg_prevent_changes_livro_caixa` (correto) mas `requirements.md` RN-06 e o histórico do `roadmap.md` às vezes se referem ao livro-caixa apenas como "tabela `livro_caixa_lancamentos`" sem nomear o trigger. Nomenclatura consistente no todo; apenas o `requirements.md` não cita o nome do trigger (cosmético, não bloqueante). | `requirements.md` RN-06 |

---

## Findings CRITICAL/HIGH — impacto e direção de correção

### A001 (CRITICAL) — Adendo vigente descreve entrega Rust descartada

**Impacto:** este é o achado mais grave e é exatamente a divergência que motivou esta auditoria. O adendo em `_reversa_sdd/addenda/001-implementar-v1-comissionamento.md`, datado de 2026-07-25 e **sem linha de superação** (portanto vigente), afirma que a V1 foi entregue com 22 ações concluídas em **Rust/Axum** (~4.781 LOC, Sentry/OTel, geração de PDF via Typst, middleware JWKS manual). Contudo, a revisão de stack homologada em 2026-07-27 (ADR-001/002, registrada em `decisions-gate.md` seção 4 e nas notas de revisão de `requirements.md`, `roadmap.md` e `actions.md`) declarou que o backend **Rust não compila contra o DDL canônico** e a stack passa a ser **TypeScript (Edge Functions Supabase + Next.js)**, com os status de T001-T022 **resetados para `[ ]`**.

Consequência: a extração reversa (`_reversa_sdd/`) aponta para uma entrega que **não existe mais como base de implementação**. Qualquer skill que âncore no adendo (ex.: `/reversa-sync` num futuro `done`) convergiria uma entrega fantasma. O `/reversa-coding` que ignora o adendo está correto, mas o estado do projeto fica incoerente: metadado `active-requirements.json` diz `done`, `actions.md` diz 0/22, adendo diz "convergido".

**Direção de correção (não executada por este skill):**
1. O adendo precisa ser **superado** (adicionar linha de Vigência indicando "Superado em 2026-07-27 pela revisão de stack ADR-001/002") ou **reescrito** para refletir a stack TS. Como o skill `/reversa-sync` é o dono dos adendos, a direção natural é rodar `/reversa-sync` **após** o coding TS concluir — não agora (não há entrega TS para convergir ainda). Até lá, o adendo Rust deve ser marcado como superado manualmente ou via edição do `decisions-gate.md`/adendo.
2. O `active-requirements.json` (`current-stage: "done"`) está divergente do estágio físico (`coding-em-progresso`, 0/22). Recomenda-se **edição manual** desse campo para `coding-em-progresso` (ou rodar `/reversa-resume`/`/reversa-forward` que recalcula), para o `/reversa-forward` não reclassificar erroneamente. **Este skill não altera `active-requirements.json`.**

### A002 (HIGH) — Contagem de paralelizáveis inflada no resumo

**Impacto:** o resumo de `actions.md` declara 17 tarefas `[//]` mas só 12 existem. Se o orquestrador do `/reversa-coding` confiar no resumo para dimensionar paralelismo, vai superestimar a capacidade de execução concorrente e pode programar batches que na verdade são seriais (dependência `-` em T008, T009, T012, T014, T022).

**Direção:** edição manual do campo "Paralelizáveis" na tabela de Resumo de `actions.md` de 17 para 12, ou revisão das marcações `[//]` se a intenção era realmente 17 (T008, T009, T012, T014, T022 estão com `-` em Paralelismo — confirmar se é intencional). Não há skill dedicado; é correção textual em `actions.md`.

### A003 (HIGH) — data-delta omite o CREATE TRIGGER de imutabilidade cadastral

**Impacto:** `data-delta.md` seção 3.2 mostra a FUNCTION `block_vendas_data_mutation()` mas **omite** o `CREATE TRIGGER trg_prevent_vendas_data_mutation` (que o DDL canônico tem na linha 88-90). `actions.md` T001 lista o trigger como entregável. Um implementador que siga só o `data-delta.md` pode criar a função sem o trigger, deixando a imutabilidade sem efeito.

**Direção:** edição manual de `data-delta.md` seção 3.2 para incluir o `CREATE TRIGGER` (já presente no DDL `001_schema.sql`, que é a fonte canônica). Não bloqueia o coding, mas deve ser saneado para o data-delta ser fiel.

### A004 (HIGH) — RLS de `comissoes` e `alunos` não documentado nem coberto por T001

**Impacto:** o DDL canônico habilita RLS e cria policies para `comissoes` (SELECT por `beneficiario_id`) e `alunos` (SELECT+INSERT por `criado_por`), além das de `vendas`. Mas `data-delta.md` seção 4 só documenta as policies de `vendas`, e `actions.md` T001 descreve genericamente "políticas RLS granulares por operação (SELECT, INSERT, UPDATE)" sem citar `comissoes`/`alunos`. Risco de o implementador aplicar só as policies de `vendas` e deixar `comissoes`/`alunos` sem RLS efetiva, quebrando o isolamento DEC-04 para a carteira de comissões (T017).

**Direção:** edição de `actions.md` T001 para listar explicitamente as policies de `comissoes` e `alunos` (ou pelo menos referenciar o DDL canônico como fonte única), e ampliar `data-delta.md` seção 4. Como o DDL `001_schema.sql` é a fonte canônica e **já contém** tudo, a implementação em si não é bloqueada — basta o implementador aplicar o DDL integral (que é o que T001 manda: "aplicar o schema DDL"). O risco é só de cobertura documental.

### A005 (HIGH) — Dependência de Storage (T002) subdeclarada nas tarefas de frontend

**Impacto:** T002 (configurar buckets `comprovantes`/`documentos_alunos`/`contratos_pdf`) tem dependência `-` e é `[//]`. Mas T015, T016, T018 (telas de apontamento/auditoria/alunos) fazem upload e Signed URLs e só declaram dependência de T014 (auth), não de T002. Se executadas em paralelo a T002, podem falhar por bucket ausente. T009 e T013 corretamente dependem de T002; as telas não.

**Direção:** edição manual das dependências em `actions.md`: T015, T016, T018 deveriam incluir `T002` além das já listadas. Não há skill dedicado; é correção da coluna Dependências.

---

## Itens verificados que PASSARAM (por eixo)

### Eixo 1 — Cobertura
- ✅ Todo requisito funcional (RF-01 a RF-08) tem pelo menos uma decisão correspondente no `roadmap.md` (D-01 a D-08) e pelo menos uma ação em `actions.md`.
  - RF-01 → D-01/T009/T015; RF-02 → D-03/T006/T009; RF-03 → T018 (ver A009 para o componente arquitetural); RF-04 → D-02/T010; RF-05 → D-04/T011; RF-06 → D-05/T012; RF-07 → D-06/T013; RF-08 → T017.
- ✅ Todo cenário Gherkin do `requirements.md` (seção 7) está coberto por ações: SHA-256 duplicado (T006), isolamento RLS (T005), trava de início de aulas (T007/T011), imutabilidade livro-caixa (T012/DDL triggers).
- ✅ Todas as 7 DEC-01..07 do `decisions-gate.md` têm correspondência em regras RN-01..07 do `requirements.md` e decisões D-01..D-08 do `roadmap.md`.

### Eixo 2 — Consistência
- ✅ Nomenclatura de enums e status consistente entre os três documentos e o DDL: `status_venda_enum` (PENDENTE_VALIDACAO, DEVOLVIDA_AJUSTE, APROVADA, CANCELADA_ESTORNADA) e `status_comissao_enum` (BLOQUEADA_AUDITORIA, AGUARDANDO_INICIO_AULAS, LIBERADA_PAGAMENTO, PAGA, ESTORNADA) idênticos em `data-delta.md`, `requirements.md`, `roadmap.md`, `actions.md` e `001_schema.sql`.
- ✅ Identificadores RF-01..RF-08 referenciados no `roadmap.md` e `actions.md` existem no `requirements.md`. Nenhum identificador fantasma de RF.
- ✅ Termo "comprovante", "venda", "comissão", "livro-caixa", "valor_comissao_fixo", "valor_entrada" usados de forma unívoca nos três documentos (sem "fatura" vs "boleto" etc.).
- ✅ Contrato `interfaces/api-v1-vendas.md` cobre os 5 endpoints das Edge Functions (vendas, auditoria-aprovar, auditoria-devolver, fechamento-mensal, gerar-contrato) e está referenciado no `roadmap.md` seção 7.
- ✅ Perfis RBAC (VENDEDOR, SECRETARIA, AUDITOR, GESTOR) idênticos em todos os artefatos e no DDL.

### Eixo 3 — Coerência com o legado
- ✅ `roadmap.md` D-01..D-08 **não contradizem** nenhuma regra 🟢 do `decisions-gate.md` (DEC-01..07). A revisão de stack ADR-001/002 foi registrada **dentro** do `decisions-gate.md` seção 4, de forma canônica — não é uma divergência, é uma evolução homologada.
- ✅ O DDL canônico `001_schema.sql` é a fonte da verdade e `roadmap.md` seção 6 confirma "permanece inalterado". Os três artefatos forward convergem para o mesmo DDL.
- ✅ Imutabilidade cadastral (`trg_prevent_vendas_data_mutation`) e append-only (`trg_prevent_changes_livro_caixa`) presentes no DDL e referenciados coerentemente em `roadmap.md` D-08/D-05 e `actions.md` T001.
- ✅ Timezone `America/Sao_Paulo` (DEC-06/ADR) consistente em `requirements.md` RNF, `roadmap.md` D-07, `actions.md` T011, `interfaces` seção 2 e `001_schema.sql` cabeçalho.
- ⚠️ Exceção: o adendo (A001) descreve a stack Rust, divergente do ADR-001/002 — ver CRITICAL acima.

### Eixo 4 — Sanidade do actions
- ✅ Todas as dependências em `actions.md` apontam para IDs existentes (T001-T022). Nenhuma dependência fantasma.
- ✅ Não há **ciclo de dependência**: a cadeia máxima é T022 ← T015/T016/T017/T018 ← T009/T010/T012/T013 ← T008 ← T003 ← (raiz), e T014 ← T004 ← (raiz). DAG acíclico confirmado.
- ✅ As tarefas marcadas `[//]` (paralelizáveis) com mesmo arquivo alvo foram verificadas: T002 e T001 têm alvos distintos (`architecture-proposal.md` vs `001_schema.sql`); T005/T006/T007 têm alvos distintos em `tests/`. Nenhum conflito de arquivo alvo entre paralelizáveis.
- ⚠️ Exceções: A002 (contagem de paralelizáveis), A005 (subdeclaração de T002), A011 (T022 sem T012) — ver acima.

---

## Conclusão e próximo passo

A auditoria encontrou **1 CRITICAL** e **4 HIGH**. O CRITICAL (A001) é a divergência esperada entre o adendo Rust "convergido" e a stack TS reconstruída — **não bloqueia o coding**, mas exige que o adendo seja saneado antes de qualquer `/reversa-sync` futuro. Os HIGH (A002-A005) são inconsistências de cobertura e declaração de dependências em `actions.md`/`data-delta.md`, **nenhuma delas impede o início do `/reversa-coding`**, pois o DDL canônico (`001_schema.sql`) já contém a verdade completa que T001 manda aplicar, e as decisões ADR-001/002 estão homologadas no `decisions-gate.md`.

**Recomendação:** revisão manual opcional dos HIGH (A002-A005 são edições textuais pequenas em `actions.md`/`data-delta.md`) antes do coding para reduzir ruído no orquestrador, e tratamento do CRITICAL (A001) marcando o adendo como superado. Mas o caminho feliz — `/reversa-coding` — está liberado, ancorado em `decisions-gate.md` + `001_schema.sql` como fontes canônicas.

---

*Relatório gerado por `/reversa-audit` em 2026-07-27. Este skill é estritamente leitor — nenhum artefato foi modificado.*