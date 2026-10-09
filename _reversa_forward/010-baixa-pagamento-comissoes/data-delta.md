# Data Delta: Visibilidade e baixa de pagamento de comissões

> Identificador: `010-baixa-pagamento-comissoes`
> Data: `2026-10-09`
> Base extraída: `_reversa_sdd/data-dictionary.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Veredito

**Mudança mínima de schema:** uma coluna nova (`comissoes.data_pagamento`) e uma função transacional nova (`registrar_pagamento_comissoes`). Nenhuma tabela nova, nenhum campo removido.

## 2. Divergência de nomenclatura (resolvida)

O `_reversa_sdd/data-dictionary.md` descreve `comissoes.liberada_em`/`paga_em` e `livro_caixa_lancamentos.tipo_lancamento`/`historico`, enquanto o schema em uso (`supabase/migrations/001_schema.sql`) usa `data_liberacao` e `tipo`/`descricao`. Conforme a sessão de esclarecimento de 2026-10-09 (D-01), **o schema atual é canônico** para esta feature.

| Elemento | Data-dictionary (legado) | Schema atual (canônico) |
|----------|--------------------------|--------------------------|
| Data de liberação | `liberada_em` | `data_liberacao` 🟢 |
| Data de pagamento | `paga_em` | **ausente → será criada como `data_pagamento`** 🟡 |
| Tipo de lançamento | `tipo_lancamento` (`PAGAMENTO_COMISSAO`) | `tipo` (`CRÉDITO`/`DÉBITO`) 🟢 |
| Descrição do lançamento | `historico` | `descricao` 🟢 |

## 3. Campos adicionados

| Tabela | Campo | Tipo | Obrigatório | Default | Notas |
|--------|-------|------|-------------|---------|-------|
| `comissoes` | `data_pagamento` | TIMESTAMPTZ | não | — | Setada na baixa; nula em comissões antigas já `PAGA` |

## 4. Campos removidos

Nenhum.

## 5. Funções novas

| Função | Assinatura | Segurança | Descrição |
|--------|-----------|-----------|-----------|
| `registrar_pagamento_comissoes` | `(p_ids uuid[], p_data_pagamento date)` → `jsonb` | SECURITY DEFINER, EXECUTE só `service_role` | Transita comissões `LIBERADA_PAGAMENTO` para `PAGA`, grava `data_pagamento` e insere lançamento no livro-caixa, tudo em uma transação com `FOR UPDATE` |

Retorno planejado: `{ "pagas": <n>, "ignoradas": <n>, "total": <valor> }`.

## 6. Índices

Nenhum índice novo é obrigatório. Candidato futuro: `comissoes(status)` já existe (`idx_comissoes_status`). Para o painel por vendedor, `vendas(criado_por)` já existe.

## 7. Migrações necessárias

| Ordem | Migração | Conteúdo |
|-------|----------|----------|
| 1 | `add_comissoes_data_pagamento` | `ALTER TABLE comissoes ADD COLUMN data_pagamento TIMESTAMPTZ` |
| 2 | `registrar_pagamento_comissoes` | `CREATE FUNCTION ... SECURITY DEFINER` + `REVOKE ALL` de `public/anon/authenticated` + `GRANT EXECUTE TO service_role` + `NOTIFY pgrst` |

## 8. Impacto no legado

- `livro_caixa_lancamentos` permanece append-only; a baixa apenas insere (nunca atualiza/remove).
- A leitura por vendedor continua limitada por RLS (comissões via `venda_id → vendas`).
- Comissões `PAGA` sem `data_pagamento` devem ser exibidas como "data não registrada" (sem quebrar totais).

## 9. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-10-09 | Versão inicial gerada por `/reversa-plan` | reversa |
