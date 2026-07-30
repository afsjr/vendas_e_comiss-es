# Flowchart — Módulo `comissoes`

> `backend/src/routes/comissoes.rs`
> 🔴 Funções `list`/`calcular` não estão wired em `main.rs` (L4). `process_daily_commission_release` é job.

## `process_daily_commission_release` (job diário)

```mermaid
flowchart TD
    A["now() -> America/Sao_Paulo (UTC-3)"] --> B[UPDATE comissoes c<br/>SET status=LIBERADA_PAGAMENTO,<br/>liberada_em=NOW<br/>FROM vendas v JOIN cursos cur]
    B --> C["WHERE c.venda_id = v.id<br/>AND v.status_venda = APROVADA<br/>AND c.status = AGUARDANDO_INICIO_AULAS<br/>AND cur.data_inicio_curso <= today"]
    C --> D[RETURNING id, venda_id]
    D --> E[log por comissão liberada]
    E --> F["log total liberadas<br/>Vec<CommissionRelease>"]
```

## `calcular` (não exposta)

```mermaid
flowchart TD
    A[SELECT vendas APROVADA<br/>sem comissão] --> B["valor_comissao =<br/>ROUND(valor_total *<br/>percentual_comissao / 100, 2)"]
    B --> C[JSON por venda]
```

🔴 Usa colunas inexistentes (`v.valor_total`, `cr.percentual_comissao`, `v.vendedor_id`, `usuarios`). DDL usa `valor_comissao_fixo`. Decisão de negócio não resolvida (I2: fixo vs percentual).
