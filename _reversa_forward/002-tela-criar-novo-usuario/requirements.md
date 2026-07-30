# Requirements: Tela para criar novo usuário

> Identificador: `002-tela-criar-novo-usuario`
> Data: `2026-07-30`
> Pasta da extração reversa: `_reversa_sdd/`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA / DÚVIDA

## 1. Resumo executivo

Criação de funcionalidade para cadastro de novos usuários no sistema. O sistema deverá suportar tanto um cadastro público (self-registration) quanto o cadastro interno feito pelo gestor. Por padrão, todo novo usuário criado deve receber o perfil "Vendedor". Apenas usuários autenticados e com o perfil de Gestor/Administrador possuem permissão para alterar o perfil de permissão de qualquer usuário (ex: promovendo para Secretaria ou Gestor).

## 2. Contexto a partir do legado

| Fonte | Trecho relevante | Confidência |
|-------|------------------|-------------|
| `_reversa_sdd/prd.md#2-personas-alvo` | Definição de perfis: Vendedor Comercial, Secretaria e Gestor / Auditor. | 🟢 |
| `_reversa_sdd/prd.md#6-restricoes` | Controle de acesso por perfil (RBAC) e isolamento estrito por RLS. | 🟢 |

## 3. Personas e cenários de uso

| Persona | Objetivo | Cenário-chave |
|---------|----------|---------------|
| Gestor / Administrador | Cadastrar equipe e gerenciar permissões | O gestor acessa a listagem/edição de usuários, visualiza um novo membro (que entrou como Vendedor) e altera seu perfil para Secretaria ou Gestor, se aplicável. |
| Vendedor | Criar sua conta | O vendedor preenche seus dados na tela de criação de conta e entra automaticamente com restrições do seu perfil. |

## 4. Regras de negócio novas ou alteradas

1. **RN-01:** O cadastro de um novo usuário deve atribuir automaticamente o perfil "Vendedor" (ou equivalente de menor privilégio) ao usuário criado. 🟢
2. **RN-02:** Apenas usuários com perfil "Gestor" (ou Administrador) têm autorização para visualizar e editar o perfil de permissão (role) de outros usuários. 🟢

## 5. Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-01 | Tela de criação de usuário | Must | O formulário deve coletar Nome, Email e Senha. Deve haver uma página pública de cadastro sem campo de 'Perfil' e uma página interna para o gestor cadastrar. | 🟢 |
| RF-02 | Definição padrão de perfil | Must | Ao concluir a criação da conta, o sistema deve associar o perfil "Vendedor" ao usuário. | 🟢 |
| RF-03 | Alteração de permissão por Gestor | Must | O gestor (em uma tela administrativa) pode acessar a edição do usuário e trocar seu perfil para Secretaria ou Gestor. | 🟢 |
| RF-04 | Bloqueio de alteração | Must | Vendedores e Secretarias não podem acessar a funcionalidade de alterar perfis de outros usuários nem o seu próprio. | 🟢 |

## 6. Requisitos Não Funcionais

| Tipo | Requisito | Evidência ou justificativa | Confidência |
|------|-----------|----------------------------|-------------|
| Segurança | Controle de Acesso (RBAC) | Apenas Gestores podem invocar as rotas/APIs (ex: Supabase RPC ou Edge Functions) de alteração de role. | 🟢 |

## 7. Critérios de Aceitação

```gherkin
Cenário: Cadastro de um novo usuário
  Dado que um usuário preenche o formulário de novo usuário
  Quando ele envia os dados
  Então a conta é criada
  E o perfil "Vendedor" é atribuído automaticamente no banco de dados

Cenário: Alteração de perfil por um Gestor
  Dado que o usuário logado tem perfil "Gestor"
  Quando ele edita um usuário existente
  Então ele pode selecionar um novo perfil e salvar com sucesso

Cenário: Tentativa de alteração de perfil por não-Gestor
  Dado que o usuário logado tem perfil "Vendedor"
  Quando ele tenta acessar a edição de perfis de usuário
  Então o sistema bloqueia o acesso e/ou a API recusa a requisição
```

## 8. Prioridade MoSCoW

| Item | MoSCoW | Justificativa |
|------|--------|---------------|
| RF-01 | Must | Necessário para on-boarding de equipe |
| RF-02 | Must | Regra base estipulada pelo usuário (padrão = vendedor) |
| RF-03 | Must | Necessário para definir quem será Gestor/Secretaria após a criação |
| RF-04 | Must | Requisito de segurança exigido ("apenas o gestor altera") |

## 9. Esclarecimentos

### Sessão 2026-07-30

- **Q:** Como deve ser o acesso à tela de criar novo usuário?
  **R:** Ambas: o gestor cadastra por dentro, e a pessoa pode se cadastrar por fora num link público.
- **Q:** Como está estruturada (ou será estruturada) a gestão de permissões (roles) no banco de dados com Supabase?
  **R:** Ainda não defini, escolha a opção mais simples e segura para o nosso cenário no plano. (Decisão delegada para a etapa de arquitetura/plano).

## 10. Lacunas

Nenhuma lacuna pendente.

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-07-30 | Versão inicial gerada por `/reversa-requirements` | reversa |
