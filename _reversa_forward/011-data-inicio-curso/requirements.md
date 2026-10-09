# Requirements: Data de início do curso — fallback de exibição e obrigatoriedade no cadastro

> Identificador: `011-data-inicio-curso`
> Data: `2026-10-09`
> Pasta da extração reversa: `_reversa_sdd/`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA / DÚVIDA

## 1. Resumo executivo

Padroniza o uso da data de início do curso: registros com `data_inicio_curso` nula passam a exibir a **data da venda** como referência no painel de comissões (com selo de fallback), os registros históricos nulos são **backfillados** com a data da venda, e novas vendas passam a exigir **obrigatoriamente** a data de início prevista em todos os canais de cadastro, com guarda no banco para novos registros.

## 2. Contexto a partir do legado

| Fonte | Trecho relevante | Confidência |
|-------|------------------|-------------|
| `_reversa_sdd/sdd/comissoes-livro-caixa.md#G-02` | Liberação condicionada a `data_inicio_curso <= data_atual` | 🟢 |
| `_reversa_sdd/inventory.md#5-rotas-da-api` | Edge Function `vendas` é o canal de criação de venda | 🟢 |
| `supabase/functions/vendas/index.ts:22` | Já valida `!data_inicio_curso` → 400 na criação | 🟢 |
| `src/app/vendas/novo/page.tsx:163` | Campo `type="date"` com `required` | 🟢 |
| `src/app/cadastro-unificado/page.tsx:209` | Guarda `!dataInicio` antes de criar a venda | 🟢 |
| `src/app/comissoes/page.tsx:336` | Exibe a coluna "Início do curso" (superfície do fallback) | 🟢 |
| `_reversa_sdd/data-dictionary.md#vendas` | Dicionário legado posiciona `data_inicio_curso` em `cursos`; o schema atual tem o campo em `vendas` (divergência tratada na feature 010) | 🟡 |

## 3. Personas e cenários de uso

| Persona | Objetivo | Cenário-chave |
|---------|----------|---------------|
| Gestor/auditor/financeiro | Entender a referência temporal da comissão | No painel de comissões, vê a data de início real ou, na ausência, a data da venda com selo |
| Vendedor/secretaria | Registrar a venda corretamente | Ao cadastrar uma venda, informa a data de início prevista; sem ela, o envio é bloqueado |

## 4. Regras de negócio novas ou alteradas

1. **RN-01:** Quando `vendas.data_inicio_curso` estiver nula, o painel de comissões deve exibir a **data da venda** (`vendas.criado_em`) como referência, com um **selo** indicando que é um fallback ("via data da venda"). 🟡
   - Origem no legado: `_reversa_sdd/sdd/comissoes-livro-caixa.md#G-02`
   - Tipo: nova
2. **RN-02:** O cadastro de uma nova venda exige `data_inicio_curso` não nula em todos os canais (formulários + Edge Function `vendas` + guarda no banco). 🟢
   - Origem no legado: `supabase/functions/vendas/index.ts:22`
   - Tipo: alterada (reforço de enforcement, já parcialmente existente)
3. **RN-03:** Os registros históricos com `data_inicio_curso` nula devem ser **backfillados** com a data da venda (`vendas.criado_em`), numa migração única. 🟡
   - Origem no legado: `_reversa_sdd/data-dictionary.md#vendas`
   - Tipo: nova
4. **RN-04:** Novos registros de `vendas` são protegidos por uma constraint `CHECK (data_inicio_curso IS NOT NULL) NOT VALID`, que vale para inserções futuras sem exigir o preenchimento retroativo. 🟡
   - Origem no legado: `supabase/functions/vendas/index.ts:22`
   - Tipo: nova

## 5. Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-01 | O painel de comissões deve exibir a data da venda como referência quando `data_inicio_curso` estiver nula, com selo de fallback | Must | Comissão/venda sem início de curso mostra a data da venda com o selo "via data da venda" | 🟡 |
| RF-02 | O sistema deve exibir a `data_inicio_curso` real quando presente | Must | Registro com data mostra a data de início, sem selo | 🟢 |
| RF-03 | O cadastro de nova venda deve rejeitar envio sem data de início do curso na UI (`vendas/novo` e `cadastro-unificado`) | Must | Submeter sem data exibe erro e não cria a venda | 🟢 |
| RF-04 | A Edge Function `vendas` deve rejeitar criação sem data de início do curso | Must | Requisição sem `data_inicio_curso` retorna 400 sem inserir | 🟢 |
| RF-05 | O banco deve rejeitar novos registros de `vendas` com `data_inicio_curso` nula via `CHECK NOT VALID` | Must | Um INSERT novo sem data é rejeitado; nenhum registro histórico é invalidado | 🟡 |
| RF-06 | Uma migração deve backfillar os registros históricos nulos com a data da venda | Should | Após a migração, `vendas` não tem `data_inicio_curso` nula nos registros existentes | 🟡 |

## 6. Requisitos Não Funcionais

| Tipo | Requisito | Evidência ou justificativa | Confidência |
|------|-----------|----------------------------|-------------|
| Consistência | Uma única regra de fallback reutilizada na exibição | Evita divergência e regra duplicada | 🟡 |
| Localização | Datas exibidas no formato pt-BR (dd/mm/aaaa) | Padrão das telas atuais | 🟢 |
| Integridade | Novo registro sempre com data; histórico backfillado | RN-02, RN-03 e RN-04 | 🟡 |
| Segurança | Sem alteração de papéis; validação server-side na Edge Function | Regra de negócio no servidor | 🟢 |

## 7. Critérios de Aceitação

```gherkin
Cenário: Fallback no painel de comissões
  Dado uma venda com data de início do curso nula
  Quando abro o painel de comissões
  Então vejo a data da venda como referência
  E vejo o selo "via data da venda"

Cenário: Data de início presente
  Dado uma venda com data de início do curso preenchida
  Quando abro o painel de comissões
  Então vejo a data de início real, sem selo

Cenário: Cadastro exige a data
  Dado que estou cadastrando uma nova venda
  Quando tento enviar sem informar a data de início prevista
  Então o sistema bloqueia o envio com mensagem clara
  E nenhuma venda é criada

Cenário negativo: Criação direta sem data no backend
  Dado uma chamada à Edge Function vendas sem data de início do curso
  Quando a função processa a requisição
  Então retorna 400 e não insere a venda

Cenário negativo: Guarda no banco
  Dado um INSERT novo em vendas sem data de início do curso
  Quando o banco processa o insert
  Então a constraint CHECK NOT VALID rejeita o insert

Cenário: Backfill do histórico
  Dado registros históricos de vendas com data de início nula
  Quando a migração de backfill roda
  Então esses registros passam a ter a data da venda como data de início
```

## 8. Prioridade MoSCoW

| Item | MoSCoW | Justificativa |
|------|--------|---------------|
| RF-01, RF-02 | Must | O fallback no painel é o objetivo direto do pedido |
| RF-03, RF-04, RF-05 | Must | Obrigatoriedade no cadastro (UI, servidor e banco) |
| RF-06 | Should | Corrige o histórico para leitura direta |
| RNF de consistência | Should | Evita regra duplicada divergente |

## 9. Esclarecimentos

### Sessão 2026-10-09

- **Q:** Como impedir novos registros sem data, preservando o histórico?
  **R:** Constraint `CHECK (data_inicio_curso IS NOT NULL) NOT VALID`.
- **Q:** O fallback (data da venda) é só exibição ou afeta a liberação?
  **R:** **Só exibição**; a liberação continua dependendo de `data_inicio_curso` real.
- **Q:** Como sinalizar o fallback na interface?
  **R:** Mostrar a data da venda com o **selo "via data da venda"**.
- **Q:** Em quais superfícies aplicar o fallback?
  **R:** **Painel de Comissões** (`/comissoes`).
- **Q:** O que fazer com os históricos nulos?
  **R:** **Backfill** com a data da venda. O fallback + selo permanece como regra de leitura defensiva para qualquer registro ainda nulo.

## 10. Lacunas

- Nenhuma lacuna aberta após a sessão de esclarecimento de 2026-10-09.

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-10-09 | Versão inicial gerada por `/reversa-requirements` | reversa |
| 2026-10-09 | Sessão de esclarecimento: 3 dúvidas resolvidas, RN-04 e RF-05/RF-06 ajustados, escopo restrito ao painel | reversa |
