# Data Delta: Dashboard visual — funil, volume acumulado e acesso por papel

> Identificador: `009-dashboard-graficos-acesso`
> Data: `2026-10-05`
> Base extraída: `_reversa_sdd/data-dictionary.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Veredito

**Sem mudança de schema e sem migração.** A feature lê dados já existentes (`vendas`, `comissoes`, `perfis`, `cursos`) e as policies vigentes já cobrem todos os papéis do recorte.

## 2. Tabelas e campos usados (sem alteração)

| Tabela | Campos lidos | Origem |
|--------|--------------|--------|
| `vendas` | `id`, `valor_entrada`, `status_venda`, `criado_por`, `criado_em`, `aluno_id`, `curso_id` | `_reversa_sdd/data-dictionary.md#vendas` |
| `cursos` | `nome`, `categoria` | `_reversa_sdd/data-dictionary.md#cursos` |
| `comissoes` | `valor_comissao`, `status_comissao`, `data_liberacao` | `_reversa_sdd/data-dictionary.md#comissoes` e `src/lib/consolidado.ts` |
| `perfis` | `id`, `nome`, `email` | `supabase/migrations/20260929000000_perfis_financeiro_select.sql` |

## 3. RLS — estado atual e implicação

| Tabela | Regra vigente | Implicação para o dashboard |
|--------|---------------|-----------------------------|
| `vendas` | `VENDEDOR` lê só o próprio; `SECRETARIA` lê tudo; `AUDITOR`/`GESTOR`/`FINANCEIRO` leem tudo | Isolamento rígido para `VENDEDOR`; para `SECRETARIA` o recorte próprio é **filtro de consulta** |
| `comissoes` | idem (via `venda_id → vendas`) | Mesma leitura |
| `perfis` | `GESTOR`/`AUDITOR`/`FINANCEIRO` leem | Necessário para rotular o vendedor no comparativo |

Fonte: `supabase/migrations/20260909000001_postvenda_rls.sql` e `supabase/migrations/20260929000000_perfis_financeiro_select.sql`.

🟡 **Observação de design:** `SECRETARIA` precisa de leitura global de `vendas` para operar o pós-venda; por isso o recorte "só o próprio" no dashboard é aplicado com `.eq('criado_por', user.id)` na consulta. Não endurecer a policy de `SECRETARIA` sem reavaliar o pós-venda.

## 4. Índices (opcional, não bloqueante)

Nenhum índice novo é obrigatório. Se houver volume relevante, candidatos: `vendas(criado_por)` e `vendas(criado_em)`. Ficam como melhoria futura, fora do escopo desta feature.

## 5. Migrações necessárias

Nenhuma.

## 6. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-10-05 | Versão inicial gerada por `/reversa-plan` | reversa |
