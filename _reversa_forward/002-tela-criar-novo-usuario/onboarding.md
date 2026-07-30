# Onboarding de QA: Tela para criar novo usuário

> Identificador: `002-tela-criar-novo-usuario`
> Este é o roteiro prático para quem for validar a funcionalidade após pronta.

## Pré-requisitos

1. Banco de dados Supabase rodando local ou em staging com as novas migrations aplicadas.
2. Aplicação Next.js em execução na porta padrão (geralmente `localhost:3000`).

## Roteiro de Teste

### Cenário 1: Cadastro Público
1. Acesse a URL pública de cadastro: `http://localhost:3000/cadastro`.
2. Preencha o formulário de inscrição (Nome: "João Vendedor", Email: "joao.qa@teste.com", Senha: "qa-password").
3. Finalize o cadastro.
4. Faça o login.
5. Verifique no painel ou log de segurança que o usuário foi autenticado corretamente e o sistema o reconhece como `VENDEDOR` e aplica as limitações devidas (não permitindo visualizar a tela de gestores, por exemplo).

### Cenário 2: Gestão Administrativa
1. Faça login na plataforma com uma conta que já possua a permissão `GESTOR` no banco de dados (ajuste a coluna `role` manualmente no banco para a sua conta principal para facilitar).
2. Acesse a tela administrativa: `http://localhost:3000/admin/usuarios` (o endereço real será confirmado no To-Do).
3. Verifique que a listagem de membros é exibida na tela.
4. Identifique o usuário criado no Passo 1 ("João Vendedor").
5. Altere a permissão dele no dropdown (ou ação equivalente) para `SECRETARIA`.
6. Salve a alteração.

### Cenário 3: Validação de Segurança
1. Deslogue da conta de Gestor e faça login na conta de "João Vendedor" (que agora é Secretaria).
2. Tente navegar até a rota `http://localhost:3000/admin/usuarios`.
3. Verifique se o sistema apresenta uma página de Acesso Negado / 403 Forbidden.
4. Tente disparar requisições diretamente à API/banco via Ferramentas de Desenvolvedor e comprove que o Supabase RLS bloqueia o Update caso um usuário não-gestor tente mudar o próprio role.
