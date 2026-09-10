# Onboarding: Cadastro Unificado Aluno + Venda

> Identificador: `004-cadastro-unificado-aluno-venda`
> Data: `2026-09-10`

## Pré-requisitos

- Usuário com perfil VENDEDOR ou SECRETARIA autenticado no sistema
- Pelo menos 1 curso cadastrado e ativo na tabela `cursos`
- Acesso ao Supabase Storage bucket `comprovantes`

## Passo a passo de teste

### Cenário 1: Cadastro de aluno COM venda (happy path)

1. Acesse `/cadastro` pelo menu lateral
2. Preencha os dados do aluno:
   - Nome: `Aluno Teste Unificado`
   - CPF: `529.982.247-25` (CPF válido)
   - E-mail: `teste@email.com`
   - Telefone: `(11) 99999-0000`
3. Ative o toggle "Incluir Venda"
4. Selecione um curso na lista
5. Preencha Valor de Entrada: `150.00`
6. Preencha Data de Início: data futura (ex: próximo mês)
7. Anexe um arquivo de comprovante (imagem ou PDF, ≤5MB)
8. Clique em "Cadastrar e Registrar Venda"
9. **Esperado:** Mensagem de sucesso com nome do aluno, curso e valor
10. **Verifique no Supabase:** Tabela `alunos` tem novo registro; tabela `vendas` tem venda vinculada com status `PENDENTE_VALIDACAO`; tabela `comissoes` tem registro com status `AGUARDANDO_INICIO_AULAS`

### Cenário 2: Cadastro de aluno SEM venda

1. Acesse `/cadastro`
2. Preencha dados do aluno ( Nome: `Aluno Sem Venda`, CPF: `453.178.287-91`, etc.)
3. **Desative** o toggle "Incluir Venda" (ou deixe desativado por padrão)
4. Clique em "Cadastrar Aluno"
5. **Esperado:** Mensagem de sucesso de cadastro; indicadores de documentos pendentes exibidos
6. **Verifique no Supabase:** Tabela `alunos` tem novo registro; nenhuma venda foi criada

### Cenário 3: Detecção de CPF duplicado

1. Acesse `/cadastro`
2. Preencha o CPF de um aluno já existente na base
3. Aguarde a validação (pode ser no blur do campo ou no submit)
4. **Esperado:** Alerta "Aluno já cadastrado: [Nome Mascarado]" com opção de vincular
5. Confirme o vínculo
6. **Esperado:** Dados do aluno aparecem em modo somente leitura; apenas os campos de venda ficam editáveis
7. Preencha os campos de venda e envie
8. **Verifique no Supabase:** Nenhum novo aluno criado; nova venda vinculada ao aluno existente

### Cenário 4: Validação de campos obrigatórios

1. Acesse `/cadastro` com toggle "Incluir Venda" ativado
2. Clique em "Cadastrar e Registrar Venda" sem preencher nada
3. **Esperado:** Campos obrigatórios destacados com erro (Curso, Valor, Data, Comprovante)

### Cenário 5: Acesso via menu

1. Verifique o menu lateral
2. **Esperado:** Item "Cadastro" aparece para VENDEDOR e SECRETARIA
3. Verifique que "Novo Aluno" e "Nova Venda" continuam aparecendo
