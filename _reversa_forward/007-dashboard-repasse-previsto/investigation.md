# Investigation — Repasse previsto no dashboard do gestor

> Identificador: `007-dashboard-repasse-previsto`
> Data: `2026-09-28`
> Objetivo: registrar a pesquisa de fundo e as alternativas antes do plano.

## 1. Onde a métrica vive

- Tela: `src/app/dashboard/page.tsx` (rota `/dashboard`, restrita a `GESTOR`).
- Já carrega em paralelo: `vendas` (com `alunos(nome)`, `cursos(nome)`), `comissoes` e `perfis`.
- KPIs atuais: `Entradas (vendas validadas)`, `Comissões Apuradas`, `Pendentes de Validação`, `Aprovadas`.
- A constante `APROVADAS = ['APROVADA','AGUARDANDO_FINANCEIRO','AGUARDANDO_PAGAMENTO_1M','PRIMEIRA_MENSALIDADE_PAGA']` define o "faturamento" atual.

## 2. Dados disponíveis

- `vendas.valor_entrada` (numeric) — base do cálculo (V1 só registra a entrada inicial, `_reversa_sdd/decisions-gate.md#DEC-01`).
- `cursos.categoria` — `Técnico`, `Graduação`, `Pós-Graduação`, `Cursos Livres` (`_reversa_sdd/data-dictionary.md#cursos`).
- Observação: o select atual pede apenas `cursos(nome)`; será necessário incluir `categoria`.

## 3. De onde vem o percentual

- Regra do usuário: **Técnico = 100%**, **Curso Livre = 100%**, **Graduação = 36%**.
- O relatório real de repasses (`document (3).csv`) mostrou `% Repasse Provisao_Fixo` de 30 e 36 para Graduação; a regra desta feature fixa **36%** e não depende do relatório.

## 4. Alternativas avaliadas

| Tema | Alternativa A | Alternativa B | Escolha | Motivo |
|------|---------------|---------------|---------|--------|
| Onde calcular | cliente (dashboard) | Edge Function / view | **cliente** | dados já carregados; feature é visualização |
| Base | `valor_entrada` | valor do curso | **valor_entrada** | único valor por venda na V1 |
| Escopo | constante `APROVADAS` | todas não canceladas | **APROVADAS** | coerência com o KPI Entradas |
| Pós-Graduação | fora | 36% | **fora** | sem regra definida |

## 5. Padrões do projeto

- Formatação monetária via `formatBRL` já existente no dashboard.
- Cálculo client-side já é o padrão da tela (faturamento, ticket médio, taxas).
- Sem novas dependências.

## 6. Restrições

- Regra Reversa: alteração pontual em arquivo já existente, sem reescrever a tela.
- Não alterar status de venda/comissão (métrica informativa).
