# Investigation: Visibilidade e baixa de pagamento de comissões

> Identificador: `010-baixa-pagamento-comissoes`
> Data: `2026-10-09`
> Requirements: `_reversa_forward/010-baixa-pagamento-comissoes/requirements.md`

## 1. Pergunta de investigação

Como dar ao gestor/auditor/financeiro uma visão confiável do que já foi pago e do que falta por vendedor, permitir a baixa de pagamento sem risco de duplicidade e gerar um relatório de repasse em PDF, sem introduzir dependência nova nem reescrever o modelo de dados do legado?

## 2. Estado atual do código (fontes)

| Fonte | O que revela |
|-------|--------------|
| `supabase/migrations/001_schema.sql:80` | `comissoes(id, venda_id, valor_comissao, status, data_liberacao, criado_em, atualizado_em)` — sem coluna de data de pagamento |
| `supabase/migrations/001_schema.sql:90` | `livro_caixa_lancamentos(id, comissao_id, tipo, valor_credito, valor_debito, descricao, criado_em)` — append-only (trigger bloqueia UPDATE/DELETE) |
| `supabase/migrations/20261008000003_processar_fechamento_mensal.sql` | RPC transacional de fechamento: `LIBERADA_PAGAMENTO` → `PAGA` + lançamento; serve de modelo para a baixa |
| `supabase/migrations/20261008000001_remove_comissoes_client_update.sql` | Cliente (PostgREST) não pode mais alterar `comissoes.status`; mutações são via `service_role` |
| `supabase/migrations/20261008000004_financeiro_rls_alignment.sql` | `FINANCEIRO` alinhado no SELECT de alunos/vendas/comissões |
| `src/middleware.ts` | RBAC de rota por `app_metadata.app_role` (matcher atual não cobre `/comissoes`) |
| `src/components/DashboardLayout.tsx` | Menu por papel; sem item de comissões financeiras |
| `src/lib/consolidado.ts` + `tests/consolidado.test.ts` | Padrão de lib pura de agregação testada em Deno |
| `supabase/functions/gerar-contrato/index.ts:4` | Uso de `npm:pdf-lib@1.17.1` no Deno — PDF sem tocar `package.json` |
| `_reversa_sdd/data-dictionary.md#comissoes` | Dicionário legado cita `liberada_em`/`paga_em` — divergente do schema atual (ver clarify, D-01) |
| `_reversa_sdd/sdd/comissoes-livro-caixa.md#4` | Fluxo de baixa mensal planejado (spec do componente) |

## 3. Alternativas avaliadas

### 3.1 Baixa via loop de updates na aplicação

- **Prós:** simples de escrever no frontend.
- **Contras:** sem transação, uma falha no meio deixa status e livro-caixa descompassados (exatamente o defeito corrigido em `fechamento-mensal`).
- **Veredito:** descartada.

### 3.2 Baixa via RPC transacional (escolhida)

- **Prós:** atomicidade e idempotência; padrão já existente (`processar_fechamento_mensal`); mutação restrita a `service_role`.
- **Contras:** mais uma função no banco.
- **Veredito:** escolhida (D-02).

### 3.3 PDF no cliente (print) vs servidor (`pdf-lib`)

- **Cliente (print):** zero backend, mas depende do navegador e não produz arquivo padronizado; ruim para repasse.
- **Servidor (`pdf-lib`):** padrão já usado em `gerar-contrato`; sem dependência de `package.json`.
- **Veredito:** servidor com `pdf-lib` (D-04).

### 3.4 Reutilizar `processar_fechamento_mensal` para a baixa

- **Prós:** nada novo.
- **Contras:** a função atual fecha **todas** as `LIBERADA_PAGAMENTO` sem seleção, sem data de pagamento própria e sem distinguir vendedor.
- **Veredito:** descartada; criar `registrar_pagamento_comissoes` com seleção por ids e `data_pagamento` (D-02, D-03).

## 4. Padrões aplicáveis

- **Função transacional no banco:** replicar `processar_fechamento_mensal` (SECURITY DEFINER, `FOR UPDATE`, `REVOKE`/`GRANT`).
- **Lib pura + testes Deno:** replicar `src/lib/consolidado.ts` + `tests/consolidado.test.ts`.
- **Edge Function com `pdf-lib`:** replicar `supabase/functions/gerar-contrato`.
- **RBAC de rota:** replicar o array `ROUTE_ROLES` em `src/middleware.ts` para `/comissoes`.

## 5. Fontes externas

- Documentação do PostgreSQL para funções `SECURITY DEFINER` e controle de concorrência (`FOR UPDATE`).
- Documentação do `pdf-lib` (uso já presente no projeto).
- Regra de negócio: fechamento após o dia 22 (informada pelo usuário no clarify).

## 6. Conclusão

Seguir com **tela `/comissoes` + lib pura de agregação + RPC transacional de baixa + Edge Function de PDF com `pdf-lib`**, protegendo o acesso em middleware e RLS. Delta mínimo de schema (uma coluna e uma função). Sem dependência nova em `package.json`.

## 7. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-10-09 | Versão inicial gerada por `/reversa-plan` | reversa |
