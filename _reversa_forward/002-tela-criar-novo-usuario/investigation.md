# Investigação e Alternativas: Tela para criar novo usuário

> Identificador: `002-tela-criar-novo-usuario`

## 1. Pesquisa de Fundo
A gestão de permissões (RBAC) no ecossistema Next.js com Supabase geralmente é abordada de duas formas:
1. **Custom Claims em `auth.users.raw_app_meta_data`**: A role fica codificada no próprio JWT emitido pelo Supabase Auth. Essa abordagem é excelente para segurança pois remove o JOIN com tabelas adicionais para checagem de RLS. Contudo, não resolve bem o problema de listar usuários num painel administrativo (onde gestores precisam ver os perfis).
2. **Tabela Pública Sincronizada (`public.perfis` ou `public.profiles`)**: Cria-se uma tabela no schema público vinculada 1:1 ao `auth.users`. Isso permite fazer JOINs, listagens via Data API do Supabase e expor apenas os campos desejados (nome, email, role).

## 2. Alternativas Avaliadas

### A. Apenas Custom Claims (Rejeitada)
- **Vantagem**: Verificação nativa em chamadas RLS via função `auth.jwt() -> 'user_role'`.
- **Desvantagem**: Para o gestor listar todos os usuários na interface, ele precisaria invocar a API de Administração do Supabase (`@supabase/supabase-js` auth admin auth.admin.listUsers()), o que é limitado por paginação severa e expõe dados sensíveis. É considerado má prática expor chamadas admin no frontend, mesmo por trás de uma API Route.

### B. Tabela Pública + Triggers de RLS (Escolhida)
- **Vantagem**: A tabela `perfis` age como a visão pública dos usuários. RLS pode facilmente ser estruturado: `CREATE POLICY "Gestores podem editar" ON perfis FOR UPDATE USING ((SELECT role FROM perfis WHERE id = auth.uid()) = 'GESTOR');`.
- **Desvantagem**: A avaliação de RLS exige um `SELECT` adicional (self-join implícito), porém, para o volume e escopo do projeto, a latência de verificação é desprezível comparada ao benefício na DX (Developer Experience).

## 3. Padrões Adotados
* **Database Triggers**: Único meio confiável de impedir que perfis fiquem dessincronizados ao realizar a criação via provedor de Auth externo (Google/E-mail) é por meio de `AFTER INSERT ON auth.users`.
* **Segurança Profunda (Defense in Depth)**: Validação será feita via políticas RLS no banco, mas também bloqueada na interface do Next.js (Server Components) para impedir acesso indevido às páginas `/admin`.
