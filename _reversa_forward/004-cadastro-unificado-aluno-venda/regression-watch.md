# Regression Watch: Cadastro Unificado Aluno + Venda

> Identificador: `004-cadastro-unificado-aluno-venda`
> Data: `2026-09-24`
> Âncora: **greenfield** (`prd.md` + specs em `_reversa_sdd/sdd/`). Não há regras 🟢 extraídas de código legado para vigiar.

## Watch principal

| ID | Origem (arquivo, seção) | Regra esperada após mudança | Tipo de verificação | Sinal de violação |
|----|--------------------------|------------------------------|---------------------|-------------------|
| —  | —                        | *(vazio: greenfield, nada a vigiar no principal)* | — | — |

## Observações

RFs implementados nesta entrega (das specs SDD). Ganham peso de regressão quando uma futura extração `/reversa` confirmar o comportamento como 🟢.

- RF-01: página `/cadastro-unificado` cria aluno e, opcionalmente, venda — `src/app/cadastro-unificado/page.tsx`.
- RF-02: validação de CPF (`isValidCpf`/`formatCpf`).
- RF-03: detecção de CPF duplicado no blur + vínculo read-only; nome mascarado via `maskName`.
- RF-04: seletor de curso exibe nome + categoria (sem comissão).
- RF-05: upload de comprovante ≤5MB para o bucket `comprovantes`.
- RF-06: toggle "Incluir Venda" permite cadastro isolado.
- RF-07: telas de feedback distintas para com e sem venda.
- RF-08: item de menu "Cadastro Unificado" (GESTOR/VENDEDOR/SECRETARIA); rotas antigas preservadas.
- RF-09: checklist fixo de documentos pendentes inferido por ausência em `documentos_alunos`.

Invariantes verificados por leitura (não extraídos de código ainda):

- `vendas` criada exclusivamente pela Edge Function `vendas` (não duplicar a lógica de comissão/SHA).
- `alunos.id` referenciado por `vendas` nunca é removido (`ON DELETE RESTRICT` + policy DELETE condicionada a `NOT EXISTS`).

## Histórico de re-extrações

*(inicialmente vazio; preenchido pelo agente reverso quando rodar `/reversa` de novo)*

## Arquivadas

*(inicialmente vazio)*
