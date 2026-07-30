# Delta de Dados: Tela para criar novo usuário

> Identificador: `002-tela-criar-novo-usuario`

Este documento lista as modificações concretas e migrações necessárias ao banco de dados com relação ao modelo listado no `_reversa_sdd/data-dictionary.md`.

## 1. Nova Tabela: `public.perfis`

Criada para espelhar os usuários do Auth e permitir a gestão das permissões de forma transparente para as consultas do sistema.

| Campo | Tipo | Obrigatoriedade | Default | Descrição |
|-------|------|-----------------|---------|-----------|
| `id` | `UUID` (PK) | Sim | - | Chave primária. Deve ser FK para `auth.users(id)` com `ON DELETE CASCADE`. |
| `nome` | `VARCHAR(255)` | Não | - | Nome completo preenchido durante o onboarding/cadastro. |
| `email` | `VARCHAR(255)` | Sim | - | E-mail espelhado do cadastro original. |
| `role` | `VARCHAR(50)` | Sim | `'VENDEDOR'` | Papel no sistema (usar o CHECK correspondente a `AppRole` do Typescript ou Enum nativo, se existir). |
| `criado_em` | `TIMESTAMPTZ` | Sim | `now()` | Timestamp de registro no sistema. |

## 2. Functions e Triggers

**Function: `handle_new_user()`**
- Tipo: `SECURITY DEFINER`
- Retorno: `trigger`
- Comportamento: 
  ```sql
  BEGIN
    INSERT INTO public.perfis (id, email, nome, role)
    VALUES (
      new.id, 
      new.email, 
      coalesce(new.raw_user_meta_data->>'full_name', 'Usuário sem nome'),
      'VENDEDOR'
    );
    RETURN new;
  END;
  ```

**Trigger: `on_auth_user_created`**
- Evento: `AFTER INSERT ON auth.users`
- Ação: Invoca `handle_new_user()`

## 3. Políticas RLS na Tabela `perfis`

A segurança desta tabela é crítica. Devem ser implementadas as seguintes `POLICIES`:

1. **Leitura Pessoal (`SELECT`)**: Usuários de todos os perfis podem ler o próprio registro. (`id = auth.uid()`)
2. **Leitura Gestor (`SELECT`)**: Usuários com `role = 'GESTOR' OR role = 'AUDITOR'` podem ler todos os perfis da unidade.
3. **Escrita Restrita (`UPDATE`)**: Apenas Gestores (checados via self-query ou Auth Meta) podem dar update em `role`. A própria tabela restringe as mudanças para não permitir auto-elevação se não for gestor.

## 4. Migração Histórica (Opcional, se aplicável)

Se o sistema já possui usuários cadastrados no `auth.users`, a migration que cria esta tabela e os triggers deve também realizar o backfill (preenchimento):
```sql
INSERT INTO public.perfis (id, email, nome, role)
SELECT id, email, coalesce(raw_user_meta_data->>'full_name', email), 'VENDEDOR' -- Ou remapear caso haja identificação
FROM auth.users;
```
