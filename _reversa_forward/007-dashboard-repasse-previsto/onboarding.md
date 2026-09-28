# Onboarding — Repasse previsto no dashboard do gestor

> Identificador: `007-dashboard-repasse-previsto`
> Data: `2026-09-28`
> Para: pessoa que vai testar a feature pela primeira vez.

## 1. Pré-requisitos

- App rodando (`npm run dev`) e um usuário com `app_metadata.app_role = 'GESTOR'`.
- Ao menos três vendas com status aprovado/válido, uma em cada cenário:
  - curso de **Graduação**, entrada conhecida (ex.: R$ 1.000,00);
  - curso **Técnico**;
  - curso **Curso Livre**.
- Opcional: uma venda de **Pós-Graduação** para o teste negativo.

## 2. Passo a passo

1. Faça login como GESTOR e abra **Visão Geral** (`/dashboard`).
2. Confira o novo card **Repasse previsto** com o total agregado.
3. Na tabela **Acompanhamento de Vendas**, confira a coluna **Repasse previsto** por lançamento.
4. Na tabela **Desempenho por Curso**, confira o repasse previsto somado por curso.
5. Valide os valores individualmente:
   - Graduação R$ 1.000,00 → repasse previsto **R$ 360,00**.
   - Curso Livre R$ 200,00 → repasse previsto **R$ 200,00**.
   - Técnico R$ 100,00 → repasse previsto **R$ 100,00**.

## 3. Testes negativos

6. Venda de **Pós-Graduação** não deve contribuir para o total.
7. Venda em `PENDENTE_VALIDACAO` ou `DEVOLVIDA_AJUSTE` não deve entrar no total.
8. Sem vendas elegíveis, o KPI deve mostrar **R$ 0,00**.

## 4. Verificação técnica

- `npx tsc --noEmit` sem erros.
- Conferir que o select inclui `cursos(nome, categoria)`.

## 5. O que observar

| Sinal | Significado |
|-------|-------------|
| Total previsto > Entradas | Bug: fator aplicado indevidamente ou base errada |
| Pós-Graduação somando | Bug: fator deveria ser nulo |
| Valores divergentes entre KPI e colunas | Bug: conjuntos de vendas diferentes |
