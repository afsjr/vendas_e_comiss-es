# Onboarding — Pré-auditoria de repasses de Graduação

> Identificador: `006-pre-auditoria-repasses`
> Data: `2026-09-28`
> Para: pessoa que vai testar a feature pela primeira vez.

## 1. Pré-requisitos

- Projeto rodando (`npm run dev`) com as variáveis `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`.
- Supabase com as migrations aplicadas (incluindo a nova `20260928000000_pre_auditoria_repasses.sql`).
- Edge Function `pre-auditoria-repasses` publicada.
- Um usuário com `app_metadata.app_role = 'GESTOR'` (e outro com papel diferente, para o teste negativo).
- O arquivo de exemplo `document (3).csv` desta rodada (relatório real do polo).
- Pelo menos uma venda de **Graduação** cadastrada, cuja comissão ainda não esteja `LIBERADA_PAGAMENTO`/`PAGA`, com o CPF do aluno presente (ou ausente) no CSV.

## 2. Passo a passo

1. Faça login com o usuário **GESTOR**.
2. No menu lateral, confirme que aparece o item **Pré-auditoria** (`/pre-auditoria`). Logue com um usuário não-GESTOR e confirme que o item **não** aparece e que a página nega acesso.
3. Abra `/pre-auditoria` e suba o `document (3).csv`.
4. Aguarde a importação e verifique o resumo: total de linhas, linhas válidas e contagem de `APARECEU` / `NAO_APARECEU` / `AMBIGUO`.
5. Verifique na lista:
   - Um aluno com **parcela 1** (`R101`, `Mensalidade=1`) e `Valor_Repasse > 0` deve aparecer como **APARECEU**, com a competência de início preenchida.
   - Um aluno cujo CPF aparece só com parcelas > 1 deve aparecer como **NAO_APARECEU**.
   - Um CPF com mais de uma venda de Graduação deve aparecer como **AMBIGUO**.
6. Selecione alguns itens `APARECEU` e clique em **confirmar em lote**.
7. Confira que, para os itens confirmados, a comissão passou a `LIBERADA_PAGAMENTO` (tabela `comissoes`) e que `conciliacoes_repasse` recebeu `confirmado_por`/`confirmado_em`.
8. Reenvie o **mesmo** CSV e confirme que a importação é rejeitada (`409 CONFLICT` / mensagem de arquivo já importado).

## 3. Testes de fallback

9. Sem nenhum CSV importado, acesse `/auditoria` e confirme que a validação manual continua funcionando (nada mudou).
10. Cadastre/selecione uma venda de **Curso Livre** e confirme que ela não entra na conciliação automática.

## 4. Testes automatizados

- Rodar os testes Deno: `tests/pre_auditoria_repasses.test.ts` (parser puro e regras de parcela/ambiguidade).
- Lint do projeto: `npm run lint`.

## 5. O que observar

| Sinal | Significado |
|-------|-------------|
| `APARECEU` com competência vazia | Bug: parcela 1 sem `Data Competencia` não deveria pré-aprovar |
| Item `NAO_APARECEU` liberando comissão | Bug crítico: confirmação deveria ignorar não-`APARECEU` |
| Menu/rota acessível a não-GESTOR | Bug de autorização (verificar RLS e guard) |
| `/auditoria` alterada | Regressão: o fallback deveria permanecer intacto |
