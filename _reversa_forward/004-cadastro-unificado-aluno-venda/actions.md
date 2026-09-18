# Actions: Cadastro Unificado Aluno + Venda

> Identificador: `004-cadastro-unificado-aluno-venda`
> Data: `2026-09-15`
> Roadmap: `_reversa_forward/004-cadastro-unificado-aluno-venda/roadmap.md`

## Resumo

| Métrica | Valor |
|---------|-------|
| Total de ações | 13 |
| Paralelizáveis (`[//]`) | 4 |
| Maior cadeia de dependência | 7 (T001→T003→T011→T005→T012→T006→T007) |

## Fase 1, Preparação

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T001 | Criar scaffolding da página unificada: diretório `src/app/cadastro-unificado/`, `page.tsx` com "use client", imports básicos (useState, useEffect, useUser, useRouter, supabase, uploadFile, ícones lucide-react, DashboardLayout) e estados iniciais (toggle "Incluir Venda", loading, erro) | - | `[//]` | `src/app/cadastro-unificado/page.tsx` | 🟢 | `[ ]` |
| T002 | Adicionar item "Cadastro Unificado" no menu lateral, ícone `UserPlus`, `href: '/cadastro-unificado'`, roles `[GESTOR, VENDEDOR, SECRETARIA]`; manter os itens "Novo Aluno" e "Nova Venda" intactos | - | `[//]` | `src/components/DashboardLayout.tsx` | 🟢 | `[ ]` |
| T008 | Criar a migration `alunos_delete_owner_orphan.sql` com a policy RLS `DELETE` estreita (`criado_por = auth.uid() AND NOT EXISTS (venda do aluno)`), conforme `data-delta.md` | - | `[//]` | `supabase/migrations/<timestamp>_alunos_delete_owner_orphan.sql` | 🟡 | `[ ]` |
| T009 | Aplicar a migration no Supabase (hosted) e validar que o criador consegue deletar um aluno sem venda e que um aluno com venda permanece indeletável | T008 | - | `supabase/migrations/` | 🟡 | `[ ]` |

## Fase 2, Testes

> Omitida — o projeto não possui harness de testes executável para o frontend (ver nota em `roadmap.md`); os artefatos de teste existentes não têm runner configurado no `package.json`.

## Fase 3, Núcleo

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T003 | Implementar a seção de cadastro do aluno: campos Nome, CPF (formatação + validação com `isValidCpf`/`formatCpf` de `src/lib/cpf.ts`), E-mail e Telefone (reusar `formatPhone` e o toggle WhatsApp) | T001 | - | `src/app/cadastro-unificado/page.tsx` | 🟢 | `[ ]` |
| T010 | Criar o helper `maskName` (ex.: `A*** T***`) em `src/lib/cpf.ts` (ou novo `src/lib/format.ts`) para exibição de nome mascarado | - | `[//]` | `src/lib/cpf.ts` | 🟢 | `[ ]` |
| T004 | Implementar a seção de venda com toggle: seletor de cursos (nome + categoria), Valor de Entrada (number, step 0.01), Data de Início (date) e upload de comprovante (preview, ≤5MB, imagem/PDF) via `react-dropzone`/`uploadFile` | T001 | - | `src/app/cadastro-unificado/page.tsx` | 🟢 | `[ ]` |
| T011 | Detecção de CPF duplicado: no blur do campo, `SELECT id, nome FROM alunos WHERE cpf = $1`; se existir, exibir alerta com nome mascarado (`maskName`), colocar os dados do aluno em modo somente leitura e permitir vínculo, sem transferir `criado_por` do aluno | T003, T010 | - | `src/app/cadastro-unificado/page.tsx` | 🟢 | `[ ]` |
| T005 | Fluxo de submit (happy path): validar CPF e campos de venda, fazer upload do comprovante, INSERT em `alunos` (quando CPF novo) ou usar o `aluno_id` vinculado, e POST na Edge Function `vendas` com `{ aluno_id, curso_id, valor_entrada, data_inicio_curso, comprovante_storage_path }` | T004, T011 | - | `src/app/cadastro-unificado/page.tsx` | 🟢 | `[ ]` |
| T012 | Compensação: em falha da venda (409/erro), executar `DELETE FROM alunos WHERE id = $1` apenas se o aluno foi criado neste fluxo; se o DELETE falhar, exibir mensagem orientando retry da venda para o aluno existente | T005, T009 | - | `src/app/cadastro-unificado/page.tsx` | 🟡 | `[ ]` |

## Fase 4, Integração

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T013 | Checklist fixo de documentos pendentes após o cadastro: consultar `SELECT tipo FROM documentos_alunos WHERE aluno_id = $1` e marcar como pendentes RG, CPF, Comprovante de Residência e Histórico ausentes; não exigir anexo nem criar linhas | T005 | - | `src/app/cadastro-unificado/page.tsx` | 🟢 | `[ ]` |

## Fase 5, Polimento

| ID | Descrição | Dependências | Paralelismo | Arquivo alvo | Confidência | Status |
|----|-----------|--------------|-------------|--------------|-------------|--------|
| T006 | Tela de feedback de sucesso: ícone, resumo (aluno, curso, valor) e botão "Cadastrar Outro" que reseta o formulário; mensagem específica para o modo "Apenas cadastro" | T012, T013 | - | `src/app/cadastro-unificado/page.tsx` | 🟢 | `[ ]` |
| T007 | Polimento visual e de robustez: tema escuro (slate-900/950, rose-500, rounded-3xl, backdrop-blur-xl), estados de loading (`Loader2`) no submit/upload e mensagens de erro amigáveis sem expor códigos internos | T006 | - | `src/app/cadastro-unificado/page.tsx` | 🟢 | `[ ]` |

## Notas de execução

<!-- Reservado para /reversa-coding registrar avisos ou observações que surgiram durante a execução. -->

## Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-10 | Versão inicial gerada por `/reversa-to-do` | reversa |
| 2026-09-15 | Regenerado a partir do roadmap pós-clarify: rota `/cadastro-unificado`, migration de policy DELETE (T008/T009), `maskName` (T010), detecção/vínculo de CPF (T011) e compensação (T012); IDs T001–T007 preservados | reversa-to-do |
