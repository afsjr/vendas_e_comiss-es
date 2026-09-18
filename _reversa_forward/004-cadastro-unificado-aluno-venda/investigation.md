# Investigation: Cadastro Unificado Aluno + Venda

> Identificador: `004-cadastro-unificado-aluno-venda`
> Data: `2026-09-15`

## 1. Padrões existentes no código

### Formulário de cadastro de aluno (`src/app/alunos/novo/page.tsx`)
- `useUser()` para o usuário autenticado; validação com `isValidCpf()`/`formatCpf()` de `src/lib/cpf.ts`.
- INSERT direto `supabase.from('alunos').insert({...}).select().single()` com `criado_por: user.id`.
- Redireciona para `/alunos/${data.id}` após sucesso. Tema Tailwind escuro (slate-900/950, rose-500).

### Formulário de venda (`src/app/vendas/novo/page.tsx`)
- Carrega `cursos` e `alunos` via `supabase.from(...).select('*')`.
- Upload via `uploadFile('comprovantes', fileName, file)` de `src/lib/supabase.ts`.
- POST `${NEXT_PUBLIC_SUPABASE_URL}/functions/v1/vendas` com Bearer token e payload `{ aluno_id, curso_id, valor_entrada, data_inicio_curso, comprovante_storage_path }`.
- Exibe tela de sucesso com "Lançar Outra Venda".

### Edge Function `vendas` (`supabase/functions/vendas/index.ts`)
- `getUserAndRole(req)` restringe a VENDEDOR/SECRETARIA.
- Baixa o arquivo do bucket, calcula SHA-256, bloqueia duplicidade (409).
- Busca `valor_comissao_fixo` do curso; INSERT em `vendas` → `evidencias_vendas` → `comissoes` com rollback manual em caso de erro.
- **Não foi alterada pela feature 003** (pós-venda): a criação continua igual para as duas telas.

### Menu (`src/components/DashboardLayout.tsx`)
- `menuItems[] = { label, href, icon, roles }`; filtro por `role`.
- "Nova Venda" e "Novo Aluno" hoje têm `roles: ['GESTOR', 'VENDEDOR']` — **a SECRETARIA não vê esses itens**, embora o RLS permita INSERT.

### Pós-venda (feature 003, addendum `_reversa_sdd/addenda/003-kanban-pos-venda.md`)
- O enum `status_venda_enum` ganhou `AGUARDANDO_FINANCEIRO`, `AGUARDANDO_PAGAMENTO_1M`, `PRIMEIRA_MENSALIDADE_PAGA`, `CANCELADA`; surgiram colunas `contrato_storage_path`, `boleto_referencia`, `comprovante_pgto_1m_path` e o papel `FINANCEIRO`.
- Transições são feitas pela Edge Function `postvenda-mover`, não pela criação. Reusar a Edge Function `vendas` mantém a tela unificada idêntica à `/vendas/novo` nesse aspecto.

## 2. Fontes externas consultadas

Nenhuma. A feature reusa padrões e contratos já presentes no repositório.

## 3. Alternativas avaliadas

| Alternativa | Prós | Contras | Decisão |
|-------------|------|---------|---------|
| Modificar `/alunos/novo` para incluir venda | Uma página a menos | Rompe o cadastro isolado; mexe em fluxo consolidado | Descartada (D-10) |
| Nova Edge Function `cadastro-unificado` | Transação real no servidor | Duplica a inserção de aluno e a lógica de comissão/SHA da `vendas` | Descartada (D-03) |
| RPC plpgsql transacional | Atomicidade garantida no banco | Sai do padrão 1ª-parte (Edge Functions) do ADR-002; mais um artefato a manter | Descartada (D-04) |
| Orquestração no frontend + compensação | Reusa tudo; menor delta | Exige policy DELETE estreita; órfão possível em falha de rede | **Escolhida** (D-04/D-05) |
| Wizard multi-etapa | UX guiada | Estado extra e complexidade para 2 seções | Descartada (D-02) |
| Sem compensação (só retry) | Zero migration | Deixa aluno órfão a cada falha de venda | Descartada (D-05) |

## 4. Achado relevante (bloqueador do plano original)

`alunos` tem RLS habilitado (`001_schema.sql:154`) e, ao longo das migrations, só recebeu policies de **SELECT** (`Alunos readable by all roles`) e **INSERT** (`VENDEDOR/SECRETARIA`, depois `GESTOR` em `20260909000002_alunos_insert_gestor.sql`). **Nunca foi criada policy de DELETE.** Com RLS habilitado e sem policy, um `DELETE` via client autenticado remove 0 linhas silenciosamente. A compensação do plano (remover o aluno se a venda falhar) é, portanto, inoperante sem a migration descrita em `data-delta.md`.

## 5. Padrões aplicáveis

- **Toggle de visibilidade:** mesmo padrão do `isWhatsapp` em `/alunos/novo`.
- **Read-only:** inputs `disabled`/`readOnly` para dados do aluno vinculado.
- **Máscara de nome:** função utilitária nova (ex.: `maskName` em `src/lib/`) exibindo apenas as iniciais do primeiro e do último nome.
- **Checagem no blur:** usa o índice `idx_alunos_cpf`; consulta `SELECT id, nome FROM alunos WHERE cpf = $1`.
- **Upload com preview:** `react-dropzone` já é dependência do projeto.
