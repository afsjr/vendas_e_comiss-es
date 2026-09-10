# Investigation: Cadastro Unificado Aluno + Venda

> Identificador: `004-cadastro-unificado-aluno-venda`
> Data: `2026-09-10`

## 1. Padrões existentes no código

### Formulário de cadastro de aluno (`src/app/alunos/novo/page.tsx`)
- Usa `useUser()` para obter o usuário autenticado
- Valida CPF com `isValidCpf()` e `formatCpf()` de `src/lib/cpf.ts`
- Faz INSERT direto via `supabase.from('alunos').insert({...}).select().single()`
- Após sucesso, redireciona para `/alunos/${data.id}`
- Estilo: Tailwind CSS com tema escuro (slate-900/950, rose-500 como cor de destaque)

### Formulário de venda (`src/app/vendas/novo/page.tsx`)
- Carrega cursos e alunos via `supabase.from('cursos').select('*')` e `supabase.from('alunos').select('*')`
- Upload via `uploadFile('comprovantes', fileName, file)` de `src/lib/supabase.ts`
- Chama Edge Function `${SUPABASE_URL}/functions/v1/vendas` com POST JSON
- Payload: `{ aluno_id, curso_id, valor_entrada, data_inicio_curso, comprovante_storage_path }`
- Após sucesso, exibe mensagem de confirmação com opção de "Lançar Outra Venda"

### Edge Function `vendas` (`supabase/functions/vendas/index.ts`)
- Autenticação: `getUserAndRole(req)` → valida role VENDEDOR ou SECRETARIA
- Valida campos obrigatórios no payload
- Download do arquivo do storage para computar SHA-256
- Verifica duplicidade de hash em `evidencias_vendas`
- Busca `valor_comissao_fixo` do curso
- INSERT em `vendas` → `evidencias_vendas` → `comissoes` (tríade transacional)
- Rollback manual se evidência ou comissão falhar

### Layout do menu (`src/components/DashboardLayout.tsx`)
- Array `menuItems` com `{ label, href, icon, roles }`
- Roles permitidas: GESTOR, VENDEDOR, SECRETARIA, AUDITOR, FINANCEIRO
- Item "Novo Aluno" → `/alunos/novo` (GESTOR, VENDEDOR)
- Item "Nova Venda" → `/vendas/novo` (GESTOR, VENDEDOR)

## 2. Fontes externas consultadas

Nenhuma necessidade de fontes externas — a feature é puramente de frontend usando padrões já estabelecidos no projeto.

## 3. Alternativas avaliadas

| Alternativa | Prós | Contras | Decisão |
|-------------|------|---------|---------|
| Modificar `/alunos/novo` para incluir venda | Uma página a menos | Rompe cadastro isolado; complica lógica existente | Descartada (D-01) |
| Criar Edge Function nova `cadastro-unificado` | Controle total do fluxo | Duplica inserção de aluno; Edge Function `vendas` já funciona | Descartada (D-03) |
| Wizard multi-etapa (aluno → venda → confirmação) | UX guiada | Complexidade de estado; overkill para 2 seções | Descartada (D-02) |
| Nova página `/cadastro` com toggle | Simples, não quebra nada, reuse de componentes | Mais uma rota no menu | Escolhida |

## 4. Padrões aplicáveis

- **Toggle de visibilidade:** Padrão já usado em outros formulários do projeto (ex: checkbox WhatsApp no cadastro de aluno)
- **Pré-preenchimento read-only:** Padrão de formulário controlado React com `disabled` nos inputs
- **Query de duplicidade:** `supabase.from('alunos').select('id, nome, cpf').eq('cpf', cpf).single()` — usa índice `idx_alunos_cpf` já existente
- **Upload com preview:** `react-dropzone` já é dependência do projeto
