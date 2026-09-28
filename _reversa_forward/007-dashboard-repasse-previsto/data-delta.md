# Data Delta — Repasse previsto no dashboard do gestor

> Identificador: `007-dashboard-repasse-previsto`
> Data: `2026-09-28`
> Base extraída: `_reversa_sdd/data-dictionary.md`, `supabase/migrations/001_schema.sql`

## 1. Resumo do delta

| Objeto | Tipo | Ação |
|--------|------|------|
| — | — | **nenhuma alteração de banco** |

Não há tabela, coluna, índice, migration ou bucket. A métrica é **derivada em memória** no cliente.

## 2. Fórmula

```
fator(categoria):
  Técnico       -> 1.00
  Curso Livre   -> 1.00
  Graduação     -> 0.36
  (demais)      -> null  (fora do cálculo)

repassePrevisto(venda) = fator(venda.cursos.categoria) * venda.valor_entrada   (se fator != null)
totalPrevisto          = Σ repassePrevisto(v) para v ∈ vendas com status em APROVADAS
```

## 3. Dependências de leitura

- `vendas.valor_entrada` (já selecionado).
- `cursos.categoria` — **precisa ser adicionado** ao select atual (`cursos(nome)` → `cursos(nome, categoria)`).

## 4. Impacto em dados existentes

Nenhum. Sem backfill, sem migração.
