# Regression Watch: Visibilidade e baixa de pagamento de comissões

> Identificador: `010-baixa-pagamento-comissoes`
> Data: `2026-10-09`
> Cenário: **greenfield** (âncora `prd.md` + specs SDD). Não há regras 🟢 extraídas de código, portanto o watch principal começa vazio.

## 1. Watch principal

| ID | Origem (arquivo, seção) | Regra esperada após mudança | Tipo de verificação | Sinal de violação |
|----|--------------------------|------------------------------|---------------------|-------------------|
| — | — | (sem regras 🟢 de legado para vigiar) | — | — |

## 2. Observações (sem peso de regressão)

RFs implementados a partir das specs SDD; ganham peso de regressão quando uma futura extração `/reversa` os confirmar como 🟢.

- **RF-06 / RN-01:** baixa apenas de `LIBERADA_PAGAMENTO` → `PAGA`; fora disso, a comissão é recusada e entra em `ignoradas`.
- **RF-07 / RN-02:** cada baixa insere um lançamento no livro-caixa (append-only).
- **RN-04:** baixa transacional — falha reverte o conjunto.
- **RN-06 / RF-13:** alerta de fechamento a partir do dia 22 (America/Sao_Paulo).
- **RF-11 / RN-05:** `/comissoes` restrita a `GESTOR`/`AUDITOR`/`FINANCEIRO`; `VENDEDOR` e `SECRETARIA` sem acesso.
- **D-01:** schema atual é canônico (`data_liberacao`, `status`, `tipo`/`descricao`).

## 3. Histórico de re-extrações

(vazio — preenchido pelo agente reverso quando rodar `/reversa` novamente)

## 4. Arquivadas

(vazio)

## 5. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-10-09 | Versão inicial gerada por `/reversa-coding` | reversa |
