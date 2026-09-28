# Roadmap: Pré-auditoria de repasses de Graduação

> Identificador: `006-pre-auditoria-repasses`
> Data: `2026-09-28`
> Requirements: `_reversa_forward/006-pre-auditoria-repasses/requirements.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Resumo da abordagem

A feature é um delta **aditivo** sobre o fluxo vigente, sem alterar a máquina de estados de venda existente. Adiciona uma página GESTOR-only (`/pre-auditoria`), um bucket privado (`relatorios_repasse`) e uma Edge Function nova (`pre-auditoria-repasses`) com duas ações: `importar` e `confirmar`. Na importação, o servidor baixa o CSV do bucket, faz o parsing (Latin-1, BOM, `;`, cabeçalhos repetidos, números pt-BR, competência por mês), concilia por CPF contra as vendas de Graduação pendentes de liberação e grava `relatorios_repasse`, `resumo_repasse_aluno` e `conciliacoes_repasse`. Na confirmação, o GESTOR seleciona itens em lote e o servidor marca a comissão correspondente como `LIBERADA_PAGAMENTO`. A tela `/auditoria` permanece intacta como fallback manual (sem relatório, não-Graduação ou formatos não suportados).

## 2. Princípios aplicados

`.reversa/principles.md` **não existe** neste projeto (verificado em `.reversa/`). Nenhum conflito a registrar.

| Princípio | Como a feature se relaciona | Status |
|-----------|------------------------------|--------|
| n/a | Arquivo de princípios ausente (`setup.json#principles.enabled=true` mas sem arquivo) | n/a |

## 3. Decisões técnicas

| ID | Decisão | Justificativa | Alternativas descartadas | Confidência |
|----|---------|----------------|--------------------------|-------------|
| D-01 | Parser CSV **in-house** dentro da Edge Function (Deno), sem biblioteca externa | O layout é conhecido e simples; evita nova dependência e mantém 1 runtime (TS/Deno) | `papaparse` (dependência npm sem uso em Edge Function), serviço externo | 🟢 |
| D-02 | Novo bucket privado `relatorios_repasse` (CSV, ≤ 5 MB) com policy GESTOR-only | Isola o arquivo-fonte; não mistura com `comprovantes`/`contratos_pdf` | guardar o CSV em `comprovantes` | 🟢 |
| D-03 | Persistir **importação** (`relatorios_repasse`) + **resultado por venda** (`conciliacoes_repasse`) + **resumo por aluno** (`resumo_repasse_aluno`) | RN-08 (resultados + resumo, sem linhas brutas) | guardar todas as linhas; guardar só por venda | 🟢 |
| D-04 | Conciliação por `alunos.cpf`; CPF com >1 venda vira `AMBIGUO` | RN-03/RN-09; `alunos.cpf` é UNIQUE e texto claro | casar por nome/contrato (sistema não possui) | 🟢 |
| D-05 | Edge Function com `getServiceRoleClient` + `getUserAndRole`, validando `GESTOR` no servidor | Padrão de `_shared/client.ts` e `postvenda-mover`; cliente nunca envia status/role | RLS-only no cliente (insuficiente para escrita) | 🟢 |
| D-06 | `relatorios_repasse` e `resumo_repasse_aluno` **append-only** (trigger bloqueia UPDATE/DELETE); `conciliacoes_repasse` permite UPDATE **só** dos campos de confirmação | Padrão `livro_caixa_lancamentos`; rastreabilidade (RN-08) | tudo append-only (inviabiliza confirmação) | 🟡 |
| D-07 | Confirmação altera `comissoes.status` para `LIBERADA_PAGAMENTO` diretamente | RN-06 (decisão do usuário) | depender de `liberar-comissoes-diaria` | 🟢 |
| D-08 | UI reutiliza `react-dropzone` + `uploadFile` (`src/lib/supabase.ts`) | Convenção do projeto (`/cadastro-unificado`, `/minhas-vendas`) | novo componente de upload | 🟢 |
| D-09 | Sem novas dependências npm; sem `interfaces/` extra além do contrato da Edge Function | Reduz superfície e risco | adicionar libs de parsing/report | 🟢 |

## 4. Premissas

Nenhuma. O `requirements.md` chegou ao plano com **0 marcadores `[DÚVIDA]`**.

| Premissa | Origem (`requirements.md` seção) | Risco se errada |
|----------|----------------------------------|-----------------|
| — | — | — |

## 5. Delta arquitetural

| Componente | Arquivo de origem no legado | Tipo de mudança | Resumo |
|------------|------------------------------|-----------------|--------|
| `pre-auditoria-repasses` | — (novo) | componente-novo | Edge Function com ações `importar` e `confirmar` |
| `frontend-shell` | `src/components/DashboardLayout.tsx` | contrato-alterado | Novo item de menu `/pre-auditoria` restrito a `GESTOR` |
| `frontend` (nova página) | `src/app/` | componente-novo | Página `/pre-auditoria` (upload + revisão em lote) |
| `auditoria-apontamentos` | `_reversa_sdd/sdd/auditoria-apontamentos.md#NG-03` | regra-alterada | NG-03 (sem conciliação automatizada) deixa de valer para Graduação com relatório |
| `comissoes-livro-caixa` | `_reversa_sdd/sdd/comissoes-livro-caixa.md#RF-...` | regra-alterada | Comissão de Graduação pode ir a `LIBERADA_PAGAMENTO` por confirmação da pré-auditoria |
| `auth-rls` | `supabase/migrations/001_schema.sql` | contrato-novo | Policies e bucket restritos a `GESTOR` |
| `storage` | `supabase/migrations/001_schema.sql` (buckets) | contrato-novo | Bucket `relatorios_repasse` privado |

## 6. Delta no modelo de dados

- Resumo das mudanças: 3 tabelas novas (`relatorios_repasse`, `conciliacoes_repasse`, `resumo_repasse_aluno`), 1 bucket novo; **nenhuma alteração** em `vendas`/`comissoes`/`alunos` (a liberação reusa `comissoes.status`).
- Detalhe completo em: `_reversa_forward/006-pre-auditoria-repasses/data-delta.md`

## 7. Delta de contratos externos

| Contrato | Tipo | Arquivo de detalhe |
|----------|------|--------------------|
| `pre-auditoria-repasses` (Edge Function: `importar`/`confirmar`) | HTTP (Supabase Functions) | `_reversa_forward/006-pre-auditoria-repasses/interfaces/pre-auditoria-repasses.md` |

## 8. Plano de migração

1. Criar a migration `supabase/migrations/20260928000000_pre_auditoria_repasses.sql` (tabelas + índices + RLS + triggers append-only + criação do bucket e policies de storage).
2. Implementar a Edge Function `supabase/functions/pre-auditoria-repasses/index.ts` (+ parser em `_shared` se necessário).
3. Criar a página `src/app/pre-auditoria/page.tsx` e o item de menu em `src/components/DashboardLayout.tsx`.
4. Adicionar testes Deno em `tests/pre_auditoria_repasses.test.ts` (parser puro + regra de parcela/ambiguidade).
5. Aplicar a migration no ambiente Supabase e rodar o deploy da função.

## 9. Riscos e mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Layout do CSV mudar (colunas/encoding) | alto | médio | Parser valida cabeçalho esperado e falha com erro explícito; teste com `document (3).csv` |
| CPF ausente/divergente entre relatório e sistema | alto | médio | Resultado `NAO_APARECEU` cai no fallback manual; nunca libera sem confirmação |
| CPF com múltiplas vendas de Graduação | médio | médio | Marca `AMBIGUO` e exige decisão manual (RN-09) |
| Liberação indevida de comissão | alto | baixo | Só `GESTOR` autenticado; exige parcela 1 (`R101`, `Mensalidade=1`) com repasse > 0 e confirmação explícita |
| Reimportação duplicar resultados | médio | médio | `relatorios_repasse.sha256_checksum` UNIQUE + append-only; nova importação não sobrescreve |
| Latência de parsing no Edge | baixo | baixo | Volume observado (~300 linhas/150 KB); alvo < 5 s |

## 10. Critério de pronto

- [ ] Todas as ações do `actions.md` marcadas `[X]`
- [ ] Coluna `parcela 1` (`R101` + `Mensalidade=1` + `Valor_Repasse>0`) validada contra `document (3).csv`
- [ ] `regression-watch.md` gerado (foco: `/auditoria` intacta e `comissoes.status`)
- [ ] Testes Deno do parser e da regra de ambiguidade passando
- [ ] `npm run lint` sem erros

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-28 | Versão inicial gerada por `/reversa-plan` | reversa |
