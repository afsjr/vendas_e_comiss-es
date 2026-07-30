# Flowchart — Máquina de Estados (vendas + comissões)

> Derivada do DDL + handlers. 🟢 CONFIRMADO onde marcado.

## Estado da venda (`status_venda_enum`)

```mermaid
stateDiagram-v2
    [*] --> PENDENTE_VALIDACAO : criar venda<br/>vendas.rs::create
    PENDENTE_VALIDACAO --> APROVADA : auditoria::approve<br/>(AUDITOR)
    PENDENTE_VALIDACAO --> DEVOLVIDA_AJUSTE : auditoria::devolver<br/>(AUDITOR, motivo >=10 chars)
    DEVOLVIDA_AJUSTE --> PENDENTE_VALIDACAO : vendedor reenvia<br/>(RLS UPDATE policy, status=DEVOLVIDA_AJUSTE)
    APROVADA --> CANCELADA_ESTORNADA : gestor cancela<br/>(RLS UPDATE policy GESTOR)
    DEVOLVIDA_AJUSTE --> APROVADA : reaprovação após ajuste
    CANCELADA_ESTORNADA --> [*]
    APROVADA --> [*]
```

🟢 Transições confirmadas. 🟡 `DEVOLVIDA_AJUSTE → APROVADA` é inferida da policy RLS UPDATE (permite AUDITOR aprovar quando status `DEVOLVIDA_AJUSTE`), não há handler explícito.

## Estado da comissão (`status_comissao_enum`)

```mermaid
stateDiagram-v2
    [*] --> BLOQUEADA_AUDITORIA : vendas.rs::create<br/>(comissão nasce bloqueada)
    BLOQUEADA_AUDITORIA --> AGUARDANDO_INICIO_AULAS : auditoria::approve<br/>se data_inicio > hoje
    BLOQUEADA_AUDITORIA --> LIBERADA_PAGAMENTO : auditoria::approve<br/>se data_inicio <= hoje
    AGUARDANDO_INICIO_AULAS --> LIBERADA_PAGAMENTO : process_daily_commission_release<br/>quando data_inicio <= hoje<br/>(job diário, cron externo)
    LIBERADA_PAGAMENTO --> PAGA : fechamento::processar<br/>(GESTOR, mensal)
    PAGA --> ESTORNADA : cancelamento de venda<br/>(sem handler encontrado)
    LIBERADA_PAGAMENTO --> ESTORNADA : estorno
    ESTORNADA --> [*]
    PAGA --> [*]
```

🔴 `ESTORNADA` é referenciada no enum e na UI (carteira) mas **nenhum handler** implementa o estorno — lacuna funcional.
