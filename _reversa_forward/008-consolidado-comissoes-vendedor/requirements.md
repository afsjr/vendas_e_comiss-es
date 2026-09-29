# Requirements: Consolidado de comissões por vendedor para pagamento

> Identificador: `008-consolidado-comissoes-vendedor`
> Data: `2026-09-29`
> Pasta da extração reversa: `_reversa_sdd/`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA / DÚVIDA

## 1. Resumo executivo

Disponibilizar um **consolidado por vendedor** das comissões, para o GESTOR/FINANCEIRO apurar e efetuar o pagamento. O consolidado agrupa as comissões pela pessoa que originou a venda (`vendas.criado_por`), totaliza por situação (`LIBERADA_PAGAMENTO`, `PAGA`, etc.) e permite filtrar por período, com detalhamento por venda e exportação para o repasse.

## 2. Contexto a partir do legado

| Fonte | Trecho relevante | Confidência |
|-------|------------------|-------------|
| `supabase/migrations/001_schema.sql` | `comissoes` tem `venda_id` (1:1), `valor_comissao`, `status`, `data_liberacao` — **não** existe coluna de beneficiário. | 🟢 |
| `supabase/migrations/001_schema.sql` | O vendedor é `vendas.criado_por`; as policies de `comissoes` isolam por `vendas.criado_por`. | 🟢 |
| `supabase/functions/fechamento-mensal/index.ts` | O fechamento pega as comissões `LIBERADA_PAGAMENTO`, grava `livro_caixa_lancamentos` e muda para `PAGA`. | 🟢 |
| `src/app/carteira/page.tsx` | Extrato individual do vendedor ("Saldo Recebido" e "A Receber (Aprovado)"); não há visão consolidada por vendedor. | 🟢 |
| `supabase/migrations/20260730094500_create_perfis_table.sql` | `perfis` guarda `nome`, `email`, `role`. | 🟢 |
| `_reversa_sdd/decisions-gate.md#DEC-04` | Secretaria tem comissão própria (mesmo isolamento do vendedor) — deve entrar no consolidado. | 🟢 |
| `_reversa_sdd/decisions-gate.md#DEC-06` | Ciclo de fechamento financeiro é **mensal**. | 🟢 |

## 3. Personas e cenários de uso

| Persona | Objetivo | Cenário-chave |
|---------|----------|---------------|
| Roberto Gestor | Saber quanto pagar a cada vendedor no fechamento | Abre o consolidado, vê o total a pagar por vendedor e no período |
| Financeiro | Executar a baixa do lote | Confere o consolidado e usa os totais para o pagamento |
| Marcos Vendedor | Conferir o próprio consolidado | (Opcional) vê o resumo do que tem a receber |

## 4. Regras de negócio novas ou alteradas

1. **RN-01:** O consolidado agrupa as comissões por **vendedor** (`vendas.criado_por`), exibindo o nome a partir de `perfis`. 🟢
   - Origem no legado: `supabase/migrations/001_schema.sql`
   - Tipo: nova
2. **RN-02:** O total **a pagar** de um vendedor é a soma das comissões em `LIBERADA_PAGAMENTO`. 🟢
   - Origem no legado: `supabase/functions/fechamento-mensal/index.ts`
   - Tipo: nova
3. **RN-03:** Vendedores e Secretaria entram no consolidado (ambos têm comissão individual). 🟢
   - Origem no legado: `_reversa_sdd/decisions-gate.md#DEC-04`
   - Tipo: nova
4. **RN-04:** O recorte de período usa o mês de **liberação** (`comissoes.data_liberacao`), alinhado ao ciclo mensal. 🟢
   - Origem no legado: `_reversa_sdd/decisions-gate.md#DEC-06`
   - Tipo: nova
5. **RN-05:** O consolidado é **informativo**: apresenta os totais; a baixa (virar `PAGA`) continua sendo feita pelo `fechamento-mensal`. 🟢
   - Origem no legado: `supabase/functions/fechamento-mensal/index.ts`
   - Tipo: nova
6. **RN-06:** O consolidado geral é acessível a `GESTOR` e `FINANCEIRO`; `VENDEDOR`/`SECRETARIA` continuam apenas na `/carteira` (extrato individual). 🟢
   - Tipo: nova
7. **RN-07:** Os rótulos por situação são: **A pagar** = `LIBERADA_PAGAMENTO`; **Previsto** = `AGUARDANDO_INICIO_AULAS` + `BLOQUEADA_AUDITORIA`; **Pago** = `PAGA`; **Estornada** = `ESTORNADA`. 🟢
   - Origem no legado: `supabase/migrations/001_schema.sql` (enum `status_comissao_enum`)
   - Tipo: nova

## 5. Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-01 | Tela de consolidado por vendedor | Must | Lista cada vendedor com quantidade de comissões e totais por situação, ordenada pelo total a pagar | 🟢 |
| RF-02 | Totalizadores | Must | Exibe "A pagar" (`LIBERADA_PAGAMENTO`), "Previsto" (`AGUARDANDO_INICIO_AULAS` + `BLOQUEADA_AUDITORIA`), "Pago" (`PAGA`) e "Estornada" (`ESTORNADA`) | 🟢 |
| RF-03 | Filtro por período | Must | Filtra por mês/intervalo com base em `data_liberacao` | 🟡 |
| RF-04 | Detalhamento das comissões por vendedor | Should | Ao abrir um vendedor, lista as comissões (aluno, curso, valor, status, data) | 🟡 |
| RF-05 | Exportação | Should | Exporta o consolidado (CSV) para o repasse | 🟡 |
| RF-06 | Controle de acesso | Must | Visível a `GESTOR` e `FINANCEIRO`; Vendedor/Secretaria não acessam o consolidado geral (ficam na `/carteira`) | 🟢 |

## 6. Requisitos Não Funcionais

| Tipo | Requisito | Evidência ou justificativa | Confidência |
|------|-----------|----------------------------|-------------|
| Precisão | Totais monetários somados com arredondamento a 2 casas | Padrão do projeto (`formatBRL`, NUMERIC) | 🟢 |
| Desempenho | Consolidado carrega em p95 < 1 s para a base atual | Volume de comissões do protótipo | 🟡 |
| Segurança | Leitura do consolidado restrita no servidor (RLS/papel) | Padrão RBAC do projeto | 🟢 |
| Consistência | O total "a pagar" deve bater com o que o `fechamento-mensal` processa | `supabase/functions/fechamento-mensal/index.ts` | 🟢 |

## 7. Critérios de Aceitação

```gherkin
Cenário: Consolidado mostra o total a pagar por vendedor
  Dado que existem comissões LIBERADA_PAGAMENTO de mais de um vendedor
  Quando o gestor abre o consolidado
  Então cada vendedor aparece com o total a pagar somado corretamente

Cenário: Filtro por período
  Dado um intervalo de datas de liberação
  Quando o gestor aplica o filtro
  Então apenas as comissões liberadas no intervalo compõem os totais

Cenário: Perfil não autorizado
  Dado um usuário com perfil VENDEDOR
  Quando tenta acessar o consolidado geral
  Então o servidor recusa o acesso

Cenário: Exportação
  Dado um consolidado carregado
  Quando o gestor exporta
  Então é gerado um CSV com vendedor, situação e valores
```

## 8. Prioridade MoSCoW

| Item | MoSCoW | Justificativa |
|------|--------|---------------|
| RF-01 Consolidado | Must | Objetivo central |
| RF-02 Totalizadores | Must | Base do pagamento |
| RF-03 Filtro de período | Must | Fechamento é mensal |
| RF-06 Acesso | Must | Dados financeiros sensíveis |
| RF-04 Detalhamento | Should | Auditoria do valor |
| RF-05 Exportação | Should | Apoia o pagamento, mas não bloqueia |

## 9. Esclarecimentos

### Sessão 2026-09-29

- **Q:** Quem acessa o consolidado geral?
  **R:** `GESTOR` e `FINANCEIRO`.
- **Q:** O vendedor/secretaria vê o próprio consolidado?
  **R:** Não; continuam apenas na `/carteira`.
- **Q:** Quais status entram e como rotular?
  **R:** A pagar = `LIBERADA_PAGAMENTO`; Previsto = `AGUARDANDO_INICIO_AULAS` + `BLOQUEADA_AUDITORIA`; Pago = `PAGA`; Estornada = `ESTORNADA`.
- **Q:** Qual data define o período?
  **R:** `comissoes.data_liberacao`.
- **Q:** O que a tela oferece além dos totais?
  **R:** Tela + export CSV; a baixa continua no `fechamento-mensal`.

## 10. Lacunas

> Nenhuma lacuna em aberto. Todos os pontos foram resolvidos na sessão de esclarecimento.

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-29 | Versão inicial gerada por `/reversa-requirements` | reversa |
| 2026-09-29 | Sessão de esclarecimentos: acesso GESTOR+FINANCEIRO, vendedor só na carteira, rótulos por status, período por `data_liberacao` e saída com CSV | reversa-clarify |
