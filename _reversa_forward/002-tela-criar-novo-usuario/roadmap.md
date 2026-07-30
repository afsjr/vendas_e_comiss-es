# Roadmap: Tela para criar novo usuário

> Identificador: `002-tela-criar-novo-usuario`
> Data: `2026-07-30`
> Requirements: `_reversa_forward/002-tela-criar-novo-usuario/requirements.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Resumo da abordagem

Implementaremos a funcionalidade de cadastro de usuários no ecossistema Supabase + Next.js. Como o sistema precisa listar usuários para o gestor alterar os perfis (roles), criaremos uma tabela pública sincronizada `public.perfis` conectada por trigger à tabela de autenticação nativa `auth.users`. O sistema terá uma página pública para auto-cadastro e uma tela administrativa onde gestores poderão listar os membros e alterar o campo `role` de cada um, protegido por RLS (Row Level Security) e checagens na API.

## 2. Princípios aplicados

| Princípio | Como a feature se relaciona | Status |
|-----------|------------------------------|--------|
| Segurança via RLS | Utilizamos o Supabase RLS na nova tabela `perfis` para garantir que a leitura de todos os usuários e alteração de perfis seja exclusiva de Gestores. | respeita |
| Simplicidade | Evitamos o uso complexo de Custom Claims no JWT preferindo uma tabela espelhada simples que resolve o problema de listagem e de regras RLS simultaneamente. | respeita |

## 3. Decisões técnicas

| ID | Decisão | Justificativa | Alternativas descartadas | Confidência |
|----|---------|----------------|--------------------------|-------------|
| D-01 | Tabela `public.perfis` | Precisamos de uma forma fácil para os gestores listarem os membros e seus respectivos cargos na UI. Consultar `auth.users` diretamente exige acesso admin no frontend, o que é um antipadrão. | Usar apenas Supabase Custom Claims via JWT. | 🟢 |
| D-02 | Trigger de sincronização de cadastro | O Supabase Auth lida com a autenticação. Um trigger no banco (`after insert on auth.users`) garante a criação automática do perfil com a role 'VENDEDOR', que é o padrão de menor privilégio. | Criar o perfil manualmente via API route no Next.js (sujeito a falhas de rede e dados órfãos). | 🟢 |
| D-03 | Tela pública vs privada | Conforme resolvido no Clarify, criaremos uma tela `/cadastro` (pública) e a listagem administrativa em `/admin/usuarios` (protegida). | n/a | 🟢 |
| D-04 | API Admin para atualização | Para que o Gestor atualize o perfil de outro usuário, usaremos uma Server Action no Next.js (ou API route) operando como Service Role Key (visto que o RLS protegerá contra acessos indevidos) ou com RLS permissivo apenas para Update caso o próprio usuário seja Gestor. | n/a | 🟢 |

## 4. Premissas

| Premissa | Origem (`requirements.md` seção) | Risco se errada |
|----------|----------------------------------|-----------------|
| Não existem outros perfis default | Seção 4 (RN-01) | Novos usuários ganhariam acesso indevido se a regra padrão falhar. |

## 5. Delta arquitetural

| Componente | Arquivo de origem no legado | Tipo de mudança | Resumo |
|------------|------------------------------|-----------------|--------|
| Frontend UI (Pages) | `_reversa_sdd/architecture.md` (implícito) | componente-novo | Adição das telas `/cadastro` e `/admin/usuarios`. |
| DB Auth Trigger | `_reversa_sdd/architecture.md` (implícito) | componente-novo | Trigger e Function no PostgreSQL para `auth.users` -> `public.perfis`. |
| Políticas RLS | `_reversa_sdd/data-dictionary.md` | componente-novo | Políticas para `public.perfis` limitando leitura/escrita a Gestores (e leitura própria). |

## 6. Delta no modelo de dados

- Resumo das mudanças: Criação da tabela `perfis`, tipo enum existente aproveitado (ou recriado) e trigger em `auth.users`.
- Detalhe completo em: `_reversa_forward/002-tela-criar-novo-usuario/data-delta.md`

## 7. Delta de contratos externos

| Contrato | Tipo | Arquivo de detalhe |
|----------|------|--------------------|
| n/a | n/a | n/a |

## 8. Plano de migração

1. Criar migration DDL para a tabela `perfis`, atrelando-a a `auth.users(id)`.
2. Criar a trigger para inserção automática.
3. Se já houver usuários em `auth.users` (legado), rodar script na migration que preencha a tabela `perfis` a partir do estado atual da `auth.users`.
4. Definir políticas RLS sobre a `perfis`.

## 9. Riscos e mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Acesso indevido à alteração de roles | alto | baixo | Server Actions usarão checagem dupla (RLS + verificação explícita de autorização via JWT do chamador). |
| Falha na sincronização do Auth | médio | baixo | Uso de Database Triggers garante execução transacional no Supabase. |

## 10. Critério de pronto

- [ ] Todas as ações do `actions.md` marcadas `[X]`
- [ ] `cross-check.md` (se executado) sem CRITICAL nem HIGH
- [ ] `regression-watch.md` gerado
- [ ] Re-extração reversa executada e sem regressão vermelha (recomendado, não obrigatório)

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-07-30 | Versão inicial gerada por `/reversa-plan` | reversa |
