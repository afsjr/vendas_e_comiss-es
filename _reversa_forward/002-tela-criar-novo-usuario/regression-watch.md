# Regression Watch: Tela para criar novo usuário

> Feature: 002-tela-criar-novo-usuario

## Itens de Vigilância (Watch)

| ID | Origem (arquivo, seção) | Regra esperada após mudança | Tipo de verificação | Sinal de violação |
|----|-------------------------|-----------------------------|---------------------|-------------------|
| W001 | `prd.md#6-restricoes` | A tabela `perfis` deve possuir políticas RLS rigorosas onde VENDEDOR e SECRETARIA não consigam atualizar perfis alheios. | presença | Furo de segurança em API, ou `UPDATE` permitido para não-gestores. |
| W002 | `data-dictionary.md` | O enum de roles na aplicação deve permanecer em sintonia com a tabela `perfis`. | presença | Alteração do enum local desvinculada do schema do DB. |

## Observações

Nenhuma alteração rebaixada em confidência nesta rodada.

## Histórico de re-extrações

(Preenchido automaticamente no próximo `/reversa`)

## Arquivadas

Nenhuma regra arquivada.
