# Actions: Cadastro Unificado Aluno + Venda

> Identificador: `004-cadastro-unificado-aluno-venda`
> Data: `2026-09-10`
> Roadmap: `_reversa_forward/004-cadastro-unificado-aluno-venda/roadmap.md`

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de ações | 6 |
| Paralelizáveis (`[//]`) | 2 |
| Maior cadeia de dependência | 4 (T001→T003→T005→T006) |

## Fase 1, Preparação

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T001 | Criar scaffolding da página `/cadastro`: diretório `src/app/cadastro/`, arquivo `page.tsx` com "use client", imports básicos (useState, useEffect, useUser, useRouter, supabase, uploadFile, ícones lucide-react, DashboardLayout), e estrutura inicial do componente com estados de toggle e loading | - | `[//]` | `src/app/cadastro/page.tsx` | 🟡 | `[ ]` |
| T002 | Adicionar item "Cadastro" no menu lateral do DashboardLayout, com ícone UserPlus, href `/cadastro`, roles `[GESTOR, VENDEDOR, SECRETARIA]` | - | `[//]` | `src/components/DashboardLayout.tsx` | 🟡 | `[ ]` |

## Fase 2, Testes

> Omitida — o projeto não possui testes de frontend (conforme `_reversa_sdd/inventory.md#7`).

## Fase 3, Núcleo

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T003 | Implementar seção de cadastro do aluno no formulário unificado: campos Nome, CPF (com formatação e validação via `isValidCpf`/`formatCpf` de `src/lib/cpf.ts`), E-mail, Telefone (com botão toggle WhatsApp). Incluir lógica de detecção de CPF duplicado: ao completar CPF (blur ou 14 caracteres), executar `supabase.from('alunos').select('id, nome, cpf').eq('cpf', cpfLimpo).single()`. Se encontrar, exibir alerta "Aluno já cadastrado: [Nome]" e pré-preencher campos em modo somente leitura (disabled). Se não encontrar, permitir preenchimento livre. | T001 | - | `src/app/cadastro/page.tsx` | 🟡 | `[ ]` |
| T004 | Implementar seção de venda no formulário unificado: toggle "Incluir Venda" que controla visibilidade dos campos de venda. Quando ativado: seletor de cursos (carregado de `supabase.from('cursos').select('*').order('nome')` exibindo nome e categoria), campo Valor de Entrada (number, step 0.01), campo Data de Início (date), upload de comprovante via react-dropzone com preview (≤5MB, aceita imagem/PDF). Validar que todos os campos de venda estão preenchidos antes de permitir submit com venda. | T001 | - | `src/app/cadastro/page.tsx` | 🟡 | `[ ]` |
| T005 | Implementar fluxo de submit: função `handleSubmit` que (1) valida CPF, (2) se toggle venda ativo, valida campos de venda e faz upload do comprovante, (3) se CPF não existe, faz INSERT no `alunos` e obtem `aluno_id`, (4) se CPF existe, usa `aluno_id` do aluno encontrado, (5) se venda incluída, chama POST na Edge Function `vendas` com `{aluno_id, curso_id, valor_entrada, data_inicio_curso, comprovante_storage_path}`, (6) exibe feedback de sucesso. Em caso de falha na venda, fazer rollback do aluno se foi criado nesta sessão (DELETE). | T003, T004 | - | `src/app/cadastro/page.tsx` | 🟡 | `[ ]` |
| T006 | Implementar feedback de sucesso e indicadores de documentos pendentes: tela de confirmação com ícone de sucesso, dados resumidos (nome do aluno, curso se aplicável, valor). Se modo "Apenas cadastro", exibir badges de documentos pendentes (RG, Comprovante de Residência, Histórico) consultando `supabase.from('documentos_alunos').select('tipo').eq('aluno_id', id)`. Botão "Cadastrar Outro" para resetar o formulário. | T005 | - | `src/app/cadastro/page.tsx` | 🟡 | `[ ]` |

## Fase 4, Integração

> Sem integrações externas novas — a Edge Function `vendas` já existe e não precisa de alteração.

## Fase 5, Polimento

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T007 | Validações finais e consistência visual: garantir que o formulário segue o estilo do projeto (tema escuro slate-900/950, rose-500 como cor de destaque, rounded-3xl, backdrop-blur-xl). Adicionar estados de loading (Loader2 spinner) durante submit e upload. Tratar erros da Edge Function exibindo mensagem amigável (não expor código de erro interno). Verificar que o formulário funciona nos 3 cenários: aluno novo + venda, aluno existente + venda, aluno novo sem venda. | T006 | `[//]` | `src/app/cadastro/page.tsx` | 🟢 | `[ ]` |

## Notas de execução

<!-- Reservado para /reversa-coding registrar avisos ou observações que surgiram durante a execução. -->

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-10 | Versão inicial gerada por `/reversa-to-do` | reversa |
