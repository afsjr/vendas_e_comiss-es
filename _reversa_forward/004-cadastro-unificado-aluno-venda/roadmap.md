# Roadmap: Cadastro Unificado Aluno + Venda

> Identificador: `004-cadastro-unificado-aluno-venda`
> Data: `2026-09-15`
> Requirements: `_reversa_forward/004-cadastro-unificado-aluno-venda/requirements.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Resumo da abordagem

Nova página `/cadastro-unificado` (Next.js App Router) que combina o cadastro de aluno de `/alunos/novo` e o apontamento de venda de `/vendas/novo` num único fluxo, com toggle "Incluir Venda" controlando a visibilidade dos campos de venda (Curso, Valor de Entrada, Data de Início, Comprovante). O aluno é criado pelo Supabase client (PostgREST/RLS) e, em seguida, a venda é criada pela Edge Function `vendas` existente e **inalterada**. Detecção de CPF duplicado em duas camadas (blur client-side + constraint UNIQUE no submit), com nome mascarado no alerta e vínculo permitido a aluno de outro vendedor. A atomicidade é feita por orquestração no frontend com compensação: se a venda falhar, o aluno recém-criado é removido — o que **exige uma policy RLS de DELETE** ainda inexistente em `alunos` (único delta de schema desta feature). As rotas `/alunos/novo` e `/vendas/novo` permanecem intactas.

## 2. Princípios aplicados

Não há `.reversa/principles.md` neste projeto. Nenhum conflito a registrar.

Invariantes arquiteturais que a feature deve preservar (de `_reversa_sdd/decisions-gate.md`):

| Invariante | Como a feature se relaciona | Status |
|-----------|------------------------------|--------|
| Imutabilidade da venda (`trg_prevent_vendas_data_mutation`) | A feature nunca edita venda existente; cria e, em falha, remove o aluno (nunca a venda). | respeita |
| Isolamento por papel via RLS (DEC-04) | Mantém leitura de `alunos` como já existente e replica o padrão de RLS nas consultas novas. | respeita (ver risco R-04) |
| Livro-caixa append-only | Fora do escopo da feature; nenhum lançamento é tocado. | respeita |

## 3. Decisões técnicas

| ID | Decisão | Justificativa | Alternativas descartadas | Confidência |
|----|---------|----------------|--------------------------|-------------|
| D-01 | Criar a rota `/cadastro-unificado` (não `/cadastro`) | `/cadastro` já é a página pública de signup (`src/app/cadastro/page.tsx`); reutilizar o caminho causaria colisão de rota | `/cadastro` (colide), `/aluno-venda`, `/matricula` | 🟢 |
| D-02 | Toggle "Incluir Venda" controla a visibilidade dos campos de venda | Atende RN-01/RN-03 (cadastro isolado) com o menor custo de estado; padrão de toggle já usado no projeto (ex.: `isWhatsapp` em `/alunos/novo`) | Wizard multi-etapa, abas | 🟢 |
| D-03 | Aluno via Supabase client (INSERT direto, RLS) + venda via Edge Function `vendas` | Reproduz exatamente os caminhos já usados por `/alunos/novo` e `/vendas/novo`; a Edge Function já recebe `aluno_id` | Nova Edge Function de cadastro unificado; RPC Postgres | 🟢 |
| D-04 | Atomicidade por orquestração no frontend, com compensação | Decisão do `/reversa-clarify` (2026-09-15): cria o aluno e, em falha da venda, remove o aluno recém-criado | Transação única em Edge Function; função/RPC plpgsql | 🟢 |
| D-05 | Adicionar policy RLS de DELETE estreita em `alunos` para viabilizar a compensação | Hoje `alunos` tem RLS habilitado **sem nenhuma policy de DELETE**; o DELETE do frontend afetaria 0 linhas e deixaria aluno órfão. Policy: `criado_por = auth.uid() AND NOT EXISTS (venda do aluno)` | Compensar via Edge Function com service role (mais superfície); abandonar a compensação e apenas oferecer retry (deixa órfão) | 🟡 |
| D-06 | Detecção de CPF duplicado no blur (client) + tratamento do erro UNIQUE no submit | Defesa em profundidade com baixa fricção: avisa cedo sem custo de submit; a constraint `alunos.cpf UNIQUE` é a garantia final | Só no submit; debounce em tempo real a cada tecla | 🟢 |
| D-07 | Nome do aluno encontrado exibido mascarado no alerta; vínculo permitido a aluno de outro vendedor, sem transferir `criado_por` do aluno | Decisão do `/reversa-clarify`: reduz exposição de dados e mantém a venda sob responsabilidade do vendedor logado (`vendas.criado_por`) | Bloquear vínculo cross-vendedor; transferir titularidade do aluno | 🟢 |
| D-08 | Checklist de documentos pendentes é fixo na UI (RG, CPF, Comprovante de Residência, Histórico), inferido pela ausência de linhas em `documentos_alunos` | `documentos_alunos.storage_path` é NOT NULL, logo não há como registrar pendência sem arquivo; evitar migration desnecessária | Criar linhas-placeholder (exigiria migration); não sinalizar | 🟢 |
| D-09 | Menu lateral recebe "Cadastro Unificado" com roles `GESTOR`, `VENDEDOR`, `SECRETARIA`; itens antigos permanecem | RF-08 exige acesso para VENDEDOR e SECRETARIA; hoje "Novo Aluno"/"Nova Venda" listam apenas GESTOR e VENDEDOR | Substituir os itens antigos; não incluir SECRETARIA | 🟢 |
| D-10 | `/alunos/novo` e `/vendas/novo` não são alteradas | RN-03 e resposta do clarify: as três opções coexistem | Refatorar as páginas antigas para reusar componentes | 🟢 |

## 4. Premissas

Nenhum marcador `[DÚVIDA]` pendente no `requirements.md` (zerado no `/reversa-clarify` de 2026-09-15).

Ponto de atenção (não é premissa, é enabler inferido): **D-05** introduz um delta de RLS que não existia quando o requirements foi escrito. O texto original "sem mudanças no schema" não se sustenta; ver `data-delta.md`.

## 5. Delta arquitetural

| Componente | Arquivo de origem no legado | Tipo de mudança | Resumo |
|------------|------------------------------|-----------------|--------|
| Frontend-Cadastro-Unificado | *(novo)* `src/app/cadastro-unificado/page.tsx` | componente-novo | Página única: dados do aluno + toggle + bloco de venda + upload |
| DashboardLayout | `src/components/DashboardLayout.tsx` | regra-alterada | Novo item "Cadastro Unificado" (`GESTOR`, `VENDEDOR`, `SECRETARIA`) |
| RLS `alunos` | `supabase/migrations/001_schema.sql` (policies de `alunos`) | contrato-alterado | Nova policy `DELETE` estreita (D-05); `SELECT`/`INSERT` inalterados |
| Edge Function `vendas` | `supabase/functions/vendas/index.ts` | sem mudança | Continua recebendo `aluno_id` e criando venda+evidência+comissão |
| Frontend-Alunos | `src/app/alunos/novo/page.tsx` | sem mudança | Permanece como opção isolada |
| Frontend-Vendas | `src/app/vendas/novo/page.tsx` | sem mudança | Permanece como opção isolada |

## 6. Delta no modelo de dados

- Resumo: nenhuma tabela ou coluna nova. Apenas **uma policy RLS de DELETE** em `alunos` para permitir a compensação do cadastro órfão (D-05).
- Detalhe completo em: `_reversa_forward/004-cadastro-unificado-aluno-venda/data-delta.md`

## 7. Delta de contratos externos

| Contrato | Tipo | Arquivo de detalhe |
|----------|------|--------------------|
| `vendas` (Edge Function) | HTTP (Deno) | `_reversa_forward/004-cadastro-unificado-aluno-venda/interfaces/vendas-edge-function.md` |
| `alunos` (PostgREST/RLS: SELECT, INSERT, DELETE) | HTTP (REST) | `_reversa_forward/004-cadastro-unificado-aluno-venda/interfaces/alunos-postgrest.md` |

## 8. Plano de migração

1. Criar a migration com a policy `DELETE` estreita em `alunos` (D-05).
2. Aplicar a migration no Supabase (hosted) e confirmar que o `DELETE` do criador sem venda funciona.
3. Implementar a página `/cadastro-unificado` e o item de menu.
4. Validar os cenários de `onboarding.md` (incluindo rollback do aluno).

## 9. Riscos e mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Aluno órfão se a compensação falhar (erro de rede, DELETE bloqueado) | médio | média | Pré-validar CPF/curso/arquivo antes do INSERT; tentar o DELETE e, se falhar, exibir tela de erro orientando retry da venda para o aluno já criado |
| Aluno órfão por conflito de SHA-256 (comprovante já usado) | médio | baixa | A Edge Function retorna 409 ANTES de criar a venda; frontend remove o aluno recém-criado e orienta trocar o comprovante |
| SECRETARIA passa a ver o menu e pode listar alunos de outros perfis | baixo | média | Comportamento de `SELECT` em `alunos` já é global hoje; registrar como desvio conhecido de DEC-04 (não é regressão introduzida aqui) |
| Duplicidade de cadastro por corrida (dois submits quase simultâneos) | alto | baixa | `alunos.cpf` é UNIQUE; o segundo INSERT falha e o fluxo entra no ramo "aluno já existe" |
| Formulário não respeitar o SLA (< 2s) ao carregar cursos | baixo | baixa | Carregar cursos no mount (já é o padrão de `/vendas/novo`) |
| Venda criada pela tela unificada divergir do fluxo pós-venda da feature 003 | alto | baixa | Usa a MESMA Edge Function `vendas` de `/vendas/novo`; nenhuma lógica de status é duplicada |

## 10. Critério de pronto

- [ ] Página `/cadastro-unificado` acessível para GESTOR, VENDEDOR e SECRETARIA
- [ ] Toggle "Incluir Venda" controla a visibilidade dos campos de venda
- [ ] Detecção de CPF duplicado (blur) exibe nome mascarado e permite vincular em modo somente leitura
- [ ] Upload de comprovante (preview, ≤5MB, PDF/imagem) para o bucket `comprovantes`
- [ ] Criação de aluno + venda com compensação do aluno em caso de falha
- [ ] Modo sem venda cria apenas o aluno
- [ ] Checklist fixo de documentos pendentes exibido após o cadastro
- [ ] Menu lateral com "Cadastro Unificado"; rotas antigas preservadas
- [ ] Migration de policy DELETE aplicada
- [ ] Todas as ações do `actions.md` marcadas `[X]`
- [ ] `regression-watch.md` gerado

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-10 | Versão inicial gerada por `/reversa-plan` | reversa |
| 2026-09-15 | Replanejado após `/reversa-clarify`: rota `/cadastro-unificado`, detecção de CPF em duas camadas, vínculo cross-vendedor, checklist fixo e novo delta de RLS (policy DELETE) para viabilizar a compensação | reversa-plan |
