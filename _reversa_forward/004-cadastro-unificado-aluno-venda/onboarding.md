# Onboarding: Cadastro Unificado Aluno + Venda

> Identificador: `004-cadastro-unificado-aluno-venda`
> Data: `2026-09-15`

## Pré-requisitos

- Usuário com perfil VENDEDOR, SECRETARIA ou GESTOR autenticado
- Pelo menos 1 curso ativo em `cursos`
- Bucket `comprovantes` acessível
- Migration de policy DELETE de `alunos` aplicada (`data-delta.md`)

## Passo a passo de teste

### Cenário 1: Cadastro com venda (happy path)

1. Acesse `/cadastro-unificado` pelo menu lateral.
2. Preencha: Nome `Aluno Teste Unificado`, CPF `529.982.247-25`, E-mail `teste@email.com`, Telefone `(11) 99999-0000`.
3. Ative o toggle "Incluir Venda".
4. Selecione um curso, informe Valor de Entrada `150.00` e Data de Início futura.
5. Anexe um comprovante (imagem ou PDF, ≤5MB).
6. Clique em "Cadastrar e Registrar Venda".
7. **Esperado:** mensagem de sucesso com aluno, curso e valor.
8. **Supabase:** novo registro em `alunos`; venda vinculada com status inicial; `evidencias_vendas` com SHA-256; `comissoes` criada pela Edge Function.

### Cenário 2: Cadastro sem venda

1. Acesse `/cadastro-unificado` e preencha os dados do aluno.
2. Deixe o toggle "Incluir Venda" desativado.
3. Clique em "Cadastrar Aluno".
4. **Esperado:** sucesso no cadastro e checklist de documentos exibido (todos pendentes).
5. **Supabase:** registro em `alunos`; nenhuma venda criada.

### Cenário 3: CPF duplicado (blur + vínculo)

1. Preencha um CPF já existente e saia do campo (blur).
2. **Esperado:** alerta com nome MASCARADO (ex.: `A*** T***`) e opção de vincular.
3. Confirme o vínculo.
4. **Esperado:** dados do aluno em modo somente leitura; apenas campos de venda editáveis.
5. Preencha a venda e envie.
6. **Supabase:** nenhum aluno novo; venda vinculada ao aluno existente, com `criado_por` = vendedor logado.

### Cenário 4: Compensação (falha na venda)

1. Inicie um cadastro com venda usando um CPF novo.
2. Force a falha da Edge Function (ex.: reutilize um comprovante já registrado → 409, ou derrube a função).
3. **Esperado:** mensagem de erro amigável e o aluno recém-criado **não** permanece no banco.
4. **Supabase:** `alunos` sem o registro órfão.

### Cenário 5: Validação de obrigatórios

1. Com "Incluir Venda" ativo, clique em enviar sem preencher.
2. **Esperado:** destaque nos campos obrigatórios (Curso, Valor, Data, Comprovante).

### Cenário 6: Acesso via menu

1. Verifique o menu para VENDEDOR, SECRETARIA e GESTOR.
2. **Esperado:** item "Cadastro Unificado" visível; "Novo Aluno" e "Nova Venda" continuam disponíveis.
