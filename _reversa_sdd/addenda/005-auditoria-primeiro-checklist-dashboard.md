# Adendo: Auditoria primeiro, checklist de devolução e dashboard por curso

> Identificador: 005-auditoria-primeiro-checklist-dashboard
> Data: 2026-09-25
> Cenário: greenfield
> Observação: mudanças aplicadas diretamente ao código (sem pasta em `_reversa_forward/`); este adendo documenta o delta sobre a extração.

## Vigência
Vigente desde 2026-09-25.

## Resumo da entrega
Inversão da ordem do fluxo de venda: a **auditoria passa a ser a primeira etapa** (valida a evidência em `PENDENTE_VALIDACAO`) e a comissão só é liberada quando a **1ª mensalidade é confirmada** pelo Financeiro. Devolução da auditoria agora é **estruturada** (5 itens de checklist + observação), com **reenvio pelo vendedor** (substituição de comprovante) ou **cancelamento e novo lançamento** quando o valor/comprovante estiver errado. O dashboard do gestor ganhou **desempenho por curso** (ticket médio, taxa de aprovação/devolução) e **recomendações**.

## Impacto por artefato da extração

| Artefato | Seção | Tipo de impacto | Delta |
|----------|-------|-----------------|-------|
| `sdd/auditoria-apontamentos.md` | Fila de auditoria | regra-alterada | Auditoria valida em `PENDENTE_VALIDACAO` (primeira etapa), não mais em `PRIMEIRA_MENSALIDADE_PAGA`; devolução com checklist estruturado (5 itens + observação) e loop de reenvio (`venda-reenviar`) ou cancelamento (`venda-cancelar`) pelo autor |
| `sdd/comissoes-livro-caixa.md` | Liberação de comissões | regra-alterada | A liberação deixa de ocorrer na aprovação da auditoria e passa a ocorrer na confirmação da 1ª mensalidade (`postvenda-mover.confirmar_pgto_1m`); `liberar-comissoes-diaria` só libera vendas em `PRIMEIRA_MENSALIDADE_PAGA` |
| `sdd/dashboard-gerencial-relatorios.md` | Painéis gerenciais | componente-novo | Lista de acompanhamento + tabela por curso (vendas, ticket médio, taxa de aprovação, taxa de devolução) e painel de recomendações. Conversão lead→venda permanece fora (sem dados de leads/cotações) |
| `sdd/apontamento-vendas-cotacoes.md` | Apontamento de venda | regra-alterada | Campos core (`aluno_id`, `curso_id`, `valor_entrada`, `criado_por`) permanecem imutáveis; correção se dá por substituição de comprovante (nova evidência + histórico) ou novo lançamento |
| `sdd/autenticacao-controle-acesso.md` | RBAC / RLS | delta-de-dados | `vendas` ganha `devolucao_itens` (JSONB) e `devolucao_observacao`; `postvenda-mover` passa a usar `APROVADA` como origem da Secretaria e `APROVADA` como retorno do Financeiro |
| `addenda/003-kanban-pos-venda.md` | Fluxo de pós-venda | regra-alterada | A ordem muda para: Vendedor → **Auditor** → Secretaria (contrato) → Financeiro (boleto/1ª mensalidade). A âncora "auditoria final em `PRIMEIRA_MENSALIDADE_PAGA`" deixa de valer |

## Fluxo vigente

```
Vendedor lança (PENDENTE_VALIDACAO)
  → AUDITOR valida a evidência
      ├─ aprova  → APROVADA ............ fila da SECRETARIA (contrato)
      └─ devolve → DEVOLVIDA_AJUSTE .... vendedor reenvia (novo comprovante)
                                         ou cancela (CANCELADA) e cadastra nova venda
  → SECRETARIA contrato → AGUARDANDO_FINANCEIRO
  → FINANCEIRO boleto → AGUARDANDO_PAGAMENTO_1M
  → FINANCEIRO confirma 1ª mensalidade → PRIMEIRA_MENSALIDADE_PAGA
      (aqui a comissão vira AGUARDANDO_INICIO_AULAS/LIBERADA_PAGAMENTO)
```

## Regras sob vigilância

- Sem watch items com peso de regressão (greenfield).

## Fontes
- `supabase/migrations/20260924000003_venda_devolucao_checklist.sql`
- `supabase/functions/auditoria-aprovar/index.ts`
- `supabase/functions/auditoria-devolver/index.ts`
- `supabase/functions/postvenda-mover/index.ts`
- `supabase/functions/liberar-comissoes-diaria/index.ts`
- `supabase/functions/venda-reenviar/index.ts`
- `supabase/functions/venda-cancelar/index.ts`
- `src/app/auditoria/page.tsx`
- `src/app/postvenda/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/minhas-vendas/page.tsx`
- `src/components/DashboardLayout.tsx`
