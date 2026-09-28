# Investigation — Pré-auditoria de repasses de Graduação

> Identificador: `006-pre-auditoria-repasses`
> Data: `2026-09-28`
> Objetivo: registrar a pesquisa de fundo, as alternativas avaliadas e os padrões aplicáveis antes do plano.

## 1. Fonte de dados analisada

**`document (3).csv`** — exportação real do relatório de repasses do polo LIMOEIRO/PE (`BP Polo 3005381`), 302 linhas / 153 KB.

Características confirmadas na leitura:
- Separador `;`; **BOM** no início; encoding **ISO-8859-1/Windows-1252** (acentos corrompidos em UTF-8).
- **Cabeçalho repetido** a cada ~38 linhas de dados (paginação da exportação).
- Valores monetários pt-BR (`R$ 1.234,56`, negativos `-R$ 0,83`); datas `dd/mm/aa 00:00`; competência como mês em português (`SETEMBRO/2026`).
- Colunas-chave: `CPF Aluno`, `Mensalidade` (número da parcela), `Data Competencia`, `Operacao Principal` (`R101`/`R103`/`R201`/`R215`/`R080`/`R060`/`R020`), `Descricao - Operacao Principal` (ex.: `Repasse F - Mensalidade`), `Valor documento`, `% Repasse Provisao_Fixo` (30/36), `Valor_Repasse`.
- Linhas malformadas existem (curso/tipo `0`), exigindo parser tolerante.

Regra derivada: a **1ª mensalidade** é a linha `R101` com `Mensalidade = 1` e `Valor_Repasse > 0`; sua `Data Competencia` é a competência de início.

## 2. Segundo formato avaliado e descartado

**`colaborar.pdf`** — "Relatório de Repasse" (18 páginas) do mesmo polo, competência Agosto/2026.
- PDF gerado digitalmente: texto extraível (sem OCR). Extração posicional viável (`pdfplumber`).
- **Não contém CPF**; identifica o aluno por `Matrícula` (10 dígitos) + nome — que **não casam** com nenhum identificador do sistema (`alunos` só tem CPF/nome; `vendas` não guarda matrícula/contrato).
- Conclusão: descartado como fonte de conciliação automática nesta rodada (decisão registrada no requirements e nas sessões de esclarecimento).

## 3. Alternativas avaliadas

| Tema | Alternativa A | Alternativa B | Escolha | Motivo |
|------|---------------|---------------|---------|--------|
| Parser CSV | biblioteca `papaparse` | parser in-house | **in-house** | layout conhecido; evita dependência npm em runtime Deno |
| Chave de conciliação | CPF (`alunos.cpf`) | nome do aluno / nº contrato | **CPF** | único identificador comum e confiável; contrato/matrícula inexistentes no sistema |
| Gatilho da comissão | menor competência com repasse | **parcela 1 (`Mensalidade=1`)** | **parcela 1** | decisão do usuário: valor só na 1ª mensalidade |
| Efeito da confirmação | só sinalizar | **liberar `LIBERADA_PAGAMENTO`** | **liberar** | decisão do usuário (RN-06) |
| Persistência | todas as linhas | **resultado + resumo por aluno** | **resultado + resumo** | decisão do usuário (RN-08) |
| Formatos | CSV+XLSX+PDF | **só CSV** | **só CSV** | XLSX sem exemplo; PDF sem CPF |

## 4. Padrões do projeto aplicáveis

- **Edge Function server-side** com `getServiceRoleClient`/`getUserAndRole` e validação de papel (`supabase/functions/vendas/index.ts`, `postvenda-mover/index.ts`).
- **Resposta padronizada** `{ success, data, error: { code, message } }` (`_shared/types.ts`, `_shared/cors.ts`, `_shared/log.ts`).
- **Append-only com trigger** (`trg_prevent_changes_livro_caixa` em `001_schema.sql`).
- **RLS por `app_metadata.app_role`** (`001_schema.sql`, `20260909000001_postvenda_rls.sql`).
- **Guard GESTOR server-side** (`src/app/actions/guard.ts#authorizeGestor`).
- **Upload** via `react-dropzone` + `uploadFile` (`src/lib/supabase.ts`; uso em `src/app/cadastro-unificado/page.tsx`).
- **Menu por papel** em `src/components/DashboardLayout.tsx` (`roles: [...]`).
- **Testes Deno** (`tests/*.test.ts`, `Deno.test` + `deno.land/std` assert).

## 5. Restrições e limites

- Regra Reversa: migration de feature é **delta**, não edita `001_schema.sql`.
- Escopo desta rodada: CSV apenas; sem OCR; sem mapeamento curso↔código; polo único.
- A comissão de Graduação só é pré-aprovada com parcela 1 repassada; demais casos vão ao fallback manual.

## 6. Fontes externas / referências internas

- `_reversa_sdd/addenda/005-auditoria-primeiro-checklist-dashboard.md` (fluxo vigente e liberação na 1ª mensalidade)
- `_reversa_sdd/addenda/003-kanban-pos-venda.md` (pós-venda)
- `_reversa_sdd/data-dictionary.md#alunos` / `#cursos` / `#comissoes`
- `_reversa_sdd/decisions-gate.md#ADR-002` (Edge Functions)
- `supabase/functions/postvenda-mover/index.ts` (matriz de transições server-side)
- `supabase/migrations/20260909000000_postvenda_status.sql`, `20260924000003_venda_devolucao_checklist.sql` (padrão de migration delta)
