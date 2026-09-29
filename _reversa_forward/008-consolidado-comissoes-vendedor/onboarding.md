# Onboarding — Consolidado de comissões por vendedor para pagamento

> Identificador: `008-consolidado-comissoes-vendedor`
> Data: `2026-09-29`
> Para: pessoa que vai testar a feature pela primeira vez.

## 1. Pré-requisitos

- App rodando (`npm run dev`) e a migration `20260929000000_perfis_financeiro_select.sql` aplicada.
- Usuários de teste com papéis `GESTOR`, `FINANCEIRO`, `VENDEDOR` (ver `scripts/seed_test_users.ts`).
- Comissões em status variados: ao menos uma `LIBERADA_PAGAMENTO`, uma `PAGA` e uma `AGUARDANDO_INICIO_AULAS`, de vendedores diferentes.

## 2. Passo a passo

1. Entre como **GESTOR** e abra **Consolidado** (`/consolidado`).
2. Confirme que cada vendedor aparece com:
   - **A pagar** = soma das `LIBERADA_PAGAMENTO`;
   - **Previsto** = soma de `AGUARDANDO_INICIO_AULAS` + `BLOQUEADA_AUDITORIA`;
   - **Pago** = soma de `PAGA`;
   - **Estornada** = soma de `ESTORNADA`.
3. Aplique o **filtro de período** (por `data_liberacao`) e confirme que os totais mudam corretamente.
4. Abra um vendedor e confira o **detalhamento** (aluno, curso, valor, status, data).
5. Clique em **Exportar CSV** e valide o arquivo (vendedor, situação, valor).
6. Entre como **FINANCEIRO**: confirme que também vê os nomes e os totais.
7. Entre como **VENDEDOR**: confirme que `/consolidado` nega acesso e que a `/carteira` segue funcionando.

## 3. Verificação técnica

- `npx tsc --noEmit` sem erros.
- `deno test tests/consolidado.test.ts` (agregação e CSV).

## 4. O que observar

| Sinal | Significado |
|-------|-------------|
| "A pagar" diferente do que o `fechamento-mensal` processa | Bug: critério de status divergente |
| FINANCEIRO sem nome de vendedor | Migration de `perfis` não aplicada |
| VENDEDOR acessando o consolidado geral | Falha de guard/RLS |
| Totais do filtro de período inconsistentes | Bug no recorte por `data_liberacao` |
