# Roadmap: Visibilidade e baixa de pagamento de comissões

> Identificador: `010-baixa-pagamento-comissoes`
> Data: `2026-10-09`
> Requirements: `_reversa_forward/010-baixa-pagamento-comissoes/requirements.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Resumo da abordagem

Adicionar uma tela nova `/comissoes` (acesso restrito a `GESTOR`, `AUDITOR` e `FINANCEIRO`) que lista, por vendedor, as comissões com situação e data de referência, calcula os totais a receber/pagos em uma lib pura (`src/lib/comissoes-pagamento.ts`) e oferece a baixa de pagamento. A baixa é feita por uma função Postgres transacional (`registrar_pagamento_comissoes`), no mesmo padrão de `processar_fechamento_mensal` (`supabase/migrations/20261008000003`): transita `LIBERADA_PAGAMENTO` → `PAGA`, grava `data_pagamento` e insere o lançamento no livro-caixa. O relatório de repasse é uma Edge Function (`relatorio-repasse`) que gera o PDF com `pdf-lib`, reaproveitando o padrão de `gerar-contrato`. O acesso é protegido em duas camadas: regra de rota no `src/middleware.ts` (por `app_metadata.app_role`) e RLS vigente. Nenhum schema é redesenhado; apenas uma coluna nova e duas funções.

## 2. Princípios aplicados

`_reversa_sdd/` não possui `.reversa/principles.md` ativo; não há princípio formal a validar nesta feature. Recomenda-se rodar `/reversa-principles` se o time quiser formalizar (ex.: "sem dependência nova sem necessidade", "dinheiro sempre transacional").

| Princípio | Como a feature se relaciona | Status |
|-----------|------------------------------|--------|
| (nenhum princípio formal registrado) | — | n/a |

## 3. Decisões técnicas

| ID | Decisão | Justificativa | Alternativas descartadas | Confidência |
|----|---------|----------------|--------------------------|-------------|
| D-01 | Schema atual é canônico (`comissoes.data_liberacao`, `comissoes.status`, `livro_caixa_lancamentos.tipo`/`descricao`) | Resposta do `/reversa-clarify`; o `data-dictionary.md` é extração legada com divergências já registradas | alinhar ao dicionário legado (`liberada_em`/`paga_em`) | 🟢 |
| D-02 | Baixa via RPC Postgres `registrar_pagamento_comissoes(uuid[], date)` `SECURITY DEFINER`, transacional | Garante atomicidade e idempotência, no padrão de `processar_fechamento_mensal` | loop de updates na aplicação (risco de status/lançamento descompassados) | 🟢 |
| D-03 | Nova coluna `comissoes.data_pagamento TIMESTAMPTZ` | Registra a data de pagamento própria pedida no clarify | reutilizar `atualizado_em` (perde semântica) | 🟢 |
| D-04 | Relatório em PDF por Edge Function com `npm:pdf-lib@1.17.1` | Já é o padrão do projeto em `gerar-contrato`; não exige depender de `package.json` (fora do `allowedPaths`) | gerar PDF no cliente; adicionar lib ao `package.json` | 🟢 |
| D-05 | Agregação/totais em `src/lib/comissoes-pagamento.ts` puro, testado em Deno | Reaproveita o padrão de `src/lib/consolidado.ts` e `tests/consolidado.test.ts` | cálculo inline na página (não testável) | 🟡 |
| D-06 | Rota `/comissoes` liberada por papel no `src/middleware.ts` + RLS | Defesa em profundidade; nenhuma mudança de RLS além do necessário | apenas guarda no cliente (acesso via API direta) | 🟢 |
| D-07 | Alerta de fechamento (após dia 22) calculado na tela a partir da data corrente | RF-13/RN-06; não exige job novo | agendar rotina no banco (custo maior, sem ganho nesta entrega) | 🟡 |
| D-08 | `SECRETARIA` fora do menu e da rota de comissões | Resposta do `/reversa-clarify` (sem acesso a comissões) | incluir a secretaria no consolidado | 🟢 |

## 4. Premissas

Nenhuma premissa herdada de `[DÚVIDA]` não resolvida — as três dúvidas foram fechadas no `/reversa-clarify` de 2026-10-09.

| Premissa | Origem (`requirements.md` seção) | Risco se errada |
|----------|----------------------------------|-----------------|
| n/a | n/a | n/a |

## 5. Delta arquitetural

| Componente | Arquivo de origem no legado | Tipo de mudança | Resumo |
|------------|------------------------------|-----------------|--------|
| Frontend UI (Pages) | `_reversa_sdd/inventory.md#2-estrutura-de-pastas` | componente-novo | Nova rota `src/app/comissoes/page.tsx` e item de menu em `src/components/DashboardLayout.tsx` |
| Frontend lib | `src/lib/consolidado.ts` (padrão) | componente-novo | `src/lib/comissoes-pagamento.ts` com agregação e totais, testável |
| Middleware de rotas | `src/middleware.ts` | contrato-alterado | Nova entrada `ROUTE_ROLES` para `/comissoes` (`GESTOR`/`AUDITOR`/`FINANCEIRO`) |
| Banco (comissoes) | `_reversa_sdd/data-dictionary.md#comissoes` | regra-alterada | Nova coluna `data_pagamento`; nova RPC transacional de baixa |
| Edge Functions | `supabase/functions/gerar-contrato` (padrão) | componente-novo | Função `relatorio-repasse` gera PDF de repasse |

## 6. Delta no modelo de dados

- Resumo das mudanças: adiciona `comissoes.data_pagamento` e a função `registrar_pagamento_comissoes` (transacional). Sem novas tabelas.
- Detalhe completo em: `_reversa_forward/010-baixa-pagamento-comissoes/data-delta.md`

## 7. Delta de contratos externos

| Contrato | Tipo | Arquivo de detalhe |
|----------|------|--------------------|
| `registrar_pagamento_comissoes` | RPC Postgres | `_reversa_forward/010-baixa-pagamento-comissoes/interfaces/baixa-comissoes.md` |
| `relatorio-repasse` | HTTP (Edge Function) | `_reversa_forward/010-baixa-pagamento-comissoes/interfaces/relatorio-repasse.md` |

## 8. Plano de migração

1. Migration `add_comissoes_data_pagamento`: `ALTER TABLE comissoes ADD COLUMN data_pagamento TIMESTAMPTZ`.
2. Migration `registrar_pagamento_comissoes`: criar a função `SECURITY DEFINER`, com `REVOKE ALL` de `public/anon/authenticated` e `GRANT EXECUTE` a `service_role`.
3. Deploy da Edge Function `relatorio-repasse`.
4. Atualizar `ROUTE_ROLES` no `src/middleware.ts` e o menu em `DashboardLayout.tsx`.
5. Sem backfill obrigatório; comissões `PAGA` antigas ficam com `data_pagamento` nulo (exibido como "não registrada").

## 9. Riscos e mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Concorrência: baixa dupla da mesma comissão | alto | média | RPC verifica `status` e usa `FOR UPDATE`; idempotência por status |
| Divergência de fuso na regra do dia 22 | médio | média | Fixar America/Sao_Paulo e documentar a referência na interface |
| `data_pagamento` nula em comissões legadas | baixo | alta | Exibir "não registrada" sem quebrar totais |
| PDF de volume alto | baixo | baixa | Processar no servidor; limites de tamanho na Edge Function |
| Nomenclatura divergente do dicionário legado | médio | baixa | D-01: schema atual é canônico; divergência documentada no `data-delta.md` |

## 10. Critério de pronto

- [ ] Todas as ações do `actions.md` marcadas `[X]`
- [ ] `cross-check.md` (se executado) sem CRITICAL nem HIGH
- [ ] `regression-watch.md` gerado
- [ ] Re-extração reversa executada e sem regressão vermelha (recomendado, não obrigatório)

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-10-09 | Versão inicial gerada por `/reversa-plan` | reversa |
