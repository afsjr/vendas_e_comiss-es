# PL-01 — Proposta de Stack e Arquitetura V1

## Objetivo

Produzir uma proposta técnica para a V1, alinhada ao gate de decisões, sem criar código de produto nem alterar SDDs canônicos.

## Escopo permitido

- Criar somente `.reversa/architecture-proposal.md`.
- Adicionar um registro em `.reversa/collaboration-ledger.md` usando o template `REG-YYYYMMDD-NNN`.

## Entregáveis obrigatórios

1. Uma recomendação de stack principal e uma alternativa, comparando:
   - frontend/PWA;
   - backend, com Rust como candidato explícito;
   - banco, autenticação, storage privado e geração de PDF;
   - hospedagem/deploy e observabilidade mínimos.
2. Um diagrama Mermaid da arquitetura escolhida.
3. Responsabilidade e contrato de cada componente.
4. Como a arquitetura preserva: RLS/RBAC, comprovante único por SHA-256, estados de comissão, livro-caixa append-only e acesso a arquivos privados.
5. Riscos, dependências externas e decisões que precisam de aprovação humana.
6. Plano de fundação em no máximo cinco passos, sem implementar esses passos.

## Restrições

- Não escolher ou alterar decisões de negócio do `decisions-gate.md`.
- Não criar código, migrations, credenciais, dependências ou infraestrutura.
- Não assumir que Supabase, Rust, Node ou qualquer provedor já está aprovado; apresente trade-offs.
- Toda recomendação deve distinguir fato, hipótese e decisão pendente.

## Critérios de aceite

- A proposta menciona explicitamente DEC-01 a DEC-07 quando relevante.
- Nenhuma regra entra em conflito com a fonte canônica.
- O documento permite ao orquestrador tomar uma decisão de stack sem buscar outros artefatos.
- O registro no ledger informa os arquivos alterados e confirma que não houve implementação.

## Verificação

```sh
test -f .reversa/architecture-proposal.md
rg -n 'DEC-0[1-7]|Rust|RLS|SHA-256|LIBERADA_PAGAMENTO|append-only' .reversa/architecture-proposal.md
```
