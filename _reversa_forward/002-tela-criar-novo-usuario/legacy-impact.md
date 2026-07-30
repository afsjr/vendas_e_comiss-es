# Legacy Impact: Tela para criar novo usuário

> Data: 2026-07-30
> Feature: 002-tela-criar-novo-usuario
> Âncora de legado ativa.

## Resumo de Impacto

| Arquivo afetado | Componente | Tipo | Severidade | Justificativa |
|-----------------|------------|------|------------|---------------|
| `supabase/migrations/*_perfis_table.sql` | DB Schema | componente-novo | MEDIUM | Criação de tabela de perfis atrelada ao Auth. Necessário para listagem. |
| `src/types/index.ts` | Frontend (types) | componente-novo | LOW | Adição do tipo `Perfil` estendendo a lógica do DDL. |
| `src/app/cadastro/*` | Frontend (UI) | componente-novo | LOW | Rota nova de cadastro público. |
| `src/app/admin/usuarios/*` | Frontend (UI) | componente-novo | MEDIUM | Dashboard para Gestores alterarem roles (afeta RBAC). |
| `src/middleware.ts` | Frontend (Routing) | componente-novo | HIGH | Restrição global de rotas admin; vital para a segurança de acesso da UI. |

## Diff Conceitual

- **DB Schema:** O DDL original não contava com uma tabela mapeando o perfil explicitamente fora do Auth. Foi introduzida a tabela `perfis`, com os mesmos `AppRole` enumerados no dicionário de dados legado.
- **Frontend:** O sistema agora possui roteamento estruturado para `/admin` restrito a gestores/auditores e uma via de acesso público para auto-cadastro.

## Preservadas

- 🟢 Controle de acesso por perfil e isolamento estrito por RLS (`prd.md#6-restricoes`). A nova tabela possui políticas que blindam a edição e restringem a leitura administrativa apenas para Gestores/Auditores.
- 🟢 Tipos `AppRole` (VENDEDOR, SECRETARIA, AUDITOR, GESTOR) documentados no `data-dictionary.md`.

## Modificadas

(Nenhuma regra preservada original foi removida ou violada).
