# Regression Watch: Dashboard visual — funil, volume acumulado e acesso por papel

> Identificador: `009-dashboard-graficos-acesso`
> Cenário: greenfield — sem regras 🟢 de extração para vigiar nesta rodada.

## Watch principal

| ID | Origem (arquivo, seção) | Regra esperada após mudança | Tipo de verificação | Sinal de violação |
|----|-------------------------|------------------------------|---------------------|-------------------|
| — | — | Nenhum watch com peso de regressão (greenfield) | — | — |

## Observações (sem peso de regressão até re-extração)

Comportamentos implementados a partir das specs SDD. Ganham peso quando uma futura extração `/reversa` sobre o código novo os confirmar como 🟢.

| ID | Origem (`requirements.md`) | Comportamento esperado | Sinal de violação |
|----|----------------------------|------------------------|-------------------|
| W001 | RF-01 / RN-04 | Todos os papéis autenticados acessam `/dashboard`; `VENDEDOR`/`SECRETARIA` veem só o próprio recorte | Papel de lançamento redirecionado ao login ou vendo dados de terceiros |
| W002 | RF-02 / RN-01 | Funil por etapa cobre as 7 etapas vigentes com quantidade e valor | Etapa sumida ou valores divergentes do total |
| W003 | RF-03 / RN-02 / RN-03 | Volume acumulado = entradas (não canceladas) + comissões não estornadas; repasse por fator de categoria | Comissão estornada somada ou fator de repasse incorreto |
| W004 | RF-04 | Filtro de período (mês atual, mês anterior, intervalo) recalcula todos os visuais | Visual não atualizar ao trocar o período |
| W005 | RF-05 / RF-09 | Papéis gerais veem comparativo lado a lado e alternam próprio × geral | Comparativo exibido para VENDEDOR/SECRETARIA |
| W006 | RF-07 / RNF Segurança | Vendedor recebe apenas registros com `criado_por` igual ao próprio ID | Retorno de registro de terceiros |
| W007 | RF-08 | Estados de carregamento, vazio e erro tratados | Tela em branco sem feedback |

## Histórico de re-extrações

<!-- Preenchido pelo agente reverso quando `/reversa` rodar novamente. -->

## Arquivadas

<!-- Vazio no momento. -->

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-10-05 | Versão inicial gerada por `/reversa-coding` | reversa |
