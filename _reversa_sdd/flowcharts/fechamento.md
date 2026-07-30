# Flowchart — Módulo `fechamento`

> `POST /api/v1/fechamento/processar-mensal` · `backend/src/routes/fechamento.rs::processar`
> 🔴 divergências de colunas em questions.md (L1)

```mermaid
flowchart TD
    A[POST /processar-mensal<br/>mes_competencia = YYYY-MM] --> B{role == GESTOR?}
    B -- não --> X1[403 FORBIDDEN]
    B -- sim --> C[acquire conn +<br/>inject_rls_context]
    C --> D[CTE transacional única]
    D --> D1["comissoes_a_pagar:<br/>status = LIBERADA_PAGAMENTO<br/>AND paga_em IS NULL"]
    D1 --> D2["lancamentos:<br/>INSERT livro_caixa_lancamentos<br/>tipo = PAGAMENTO_COMISSAO<br/>para cada comissão a pagar"]
    D2 --> D3["atualizados:<br/>UPDATE comissoes<br/>status = PAGA, paga_em = NOW()"]
    D3 --> E[SELECT json_build_object:<br/>mes, total_pago, qtd, FECHADO_SUCESSO]
    E --> P[200 OK]
```

🔴 Colunas usadas no INSERT (`tipo`, `venda_id`, `valor`, `descricao`, `created_at`) não existem no DDL (reais: `tipo_lancamento`, `comissao_id`, `valor_credito`/`valor_debito`, `historico`, `criado_em`).
