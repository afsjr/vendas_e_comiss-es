# Roadmap: Cadastro Unificado Aluno + Venda

> Identificador: `004-cadastro-unificado-aluno-venda`
> Data: `2026-09-10`
> Requirements: `_reversa_forward/004-cadastro-unificado-aluno-venda/requirements.md`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA

## 1. Resumo da abordagem

Criação de uma nova página `/cadastro` no frontend Next.js que combina os formulários de cadastro de aluno (`/alunos/novo`) e lançamento de venda (`/vendas/novo`) num único fluxo. A página possui um toggle "Incluir Venda" que controla a visibilidade dos campos de venda (Curso, Valor, Data, Comprovante). O fluxo de backend não muda: o aluno é criado primeiro via Supabase client (INSERT direto na tabela `alunos`), e em seguida a venda é criada via Edge Function `vendas` existente, que já espera `aluno_id`. A detection de CPF duplicado é feita via query prévia ao enviar. As rotas antigas `/alunos/novo` e `/vendas/novo` permanecem funcionando.

## 2. Princípios aplicados

Não há `.reversa/principles.md` neste projeto. Nenhum conflito a registrar.

## 3. Decisões técnicas

| ID | Decisão | Justificativa | Alternativas descartadas | Confidência |
|----|---------|----------------|--------------------------|-------------|
| D-01 | Criar nova página `/cadastro` em vez de modificar as existentes | RN-03 exige que as rotas antigas permaneçam; alterar formulários existentes quebra fluxos consolidados | Modificar `/alunos/novo` para incluir campos de venda (romperia o cadastro isolado) | 🟡 |
| D-02 | Toggle "Incluir Venda" controla visibilidade dos campos | RN-01 exige que o cadastro possa ser feito sem venda; toggle é o padrão mais simples e claro | Wizard multi-etapa (mais complexo para um delta pequeno) / Abas (pesado demais) | 🟡 |
| D-03 | Aluno criado via Supabase client direto, venda via Edge Function `vendas` | Mantém o padrão existente: cadastro de aluno usa INSERT direto com RLS, venda usa Edge Function com `SERVICE_ROLE_KEY` para transação atômica | Criar Edge Function nova para cadastro unificado (duplicaria lógica de inserção de aluno) | 🟢 |
| D-04 | Detecção de CPF duplicado via query `SELECT id, nome FROM alunos WHERE cpf = $1` antes do submit | RF-03 exige alerta de duplicidade; query simples é suficiente e barata (index em `cpf` já existe) | Debounce em tempo real no campo CPF (experiência melhor mas complexidade desnecessária para MVP) | 🟢 |
| D-05 | Dados do aluno pré-preenchidos em modo somente leitura quando CPF já existe | Resposta do clarify: usuário optou por read-only para evitar edição acidental de dados cadastrais | Permitir edição (risco de divergência com cadastro original) | 🟡 |
| D-06 | Sinalização de documentos pendentes via indicator visual (badges) | Resposta do clarify: usuário optou por sinalizar sem exigir anexo | Exigir upload mínimo de 1 documento (burocrático demais no ato) | 🟡 |
| D-07 | Menu lateral mantém os 3 links: "Novo Aluno", "Nova Venda", "Cadastro Unificado" | Resposta do clarify: usuário optou por manter as rotas antigas como opção adicional | Substituir os links antigos pelo unificado (perda de flexibilidade) | 🟡 |

## 4. Premissas

Nenhuma `[DÚVIDA]` pendente — todas foram resolvidas no `/reversa-clarify`.

## 5. Delta arquitetural

| Componente | Arquivo de origem no legado | Tipo de mudança | Resumo |
|------------|------------------------------|-----------------|--------|
| Frontend-Alunos | `src/app/alunos/novo/page.tsx` | regra-alterada | Sem mudança direta, mas a rota permanece disponível como opção |
| Frontend-Vendas | `src/app/vendas/novo/page.tsx` | regra-alterada | Sem mudança direta, mas a rota permanece disponível como opção |
| Frontend-Cadastro | *(novo)* `src/app/cadastro/page.tsx` | componente-novo | Nova página unificada com toggle de venda |
| DashboardLayout | `src/components/DashboardLayout.tsx` | regra-alterada | Adicionar item "Cadastro" no menu lateral |
| Edge Function vendas | `supabase/functions/vendas/index.ts` | sem mudança | Já aceita `aluno_id`, não precisa de alteração |

## 6. Delta no modelo de dados

- Sem mudanças no schema. A tabela `alunos` e `vendas` já possuem todos os campos necessários.
- Detalhe completo em: `_reversa_forward/004-cadastro-unificado-aluno-venda/data-delta.md`

## 7. Delta de contratos externos

| Contrato | Tipo | Arquivo de detalhe |
|----------|------|--------------------|
| `vendas` (Edge Function) | HTTP (Deno) | `_reversa_forward/004-cadastro-unificado-aluno-venda/interfaces/vendas-edge-function.md` |

## 8. Plano de migração

n/a — Sem mudanças de schema. Feature puramente de frontend.

## 9. Riscos e mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Race condition: aluno criado mas venda falha, deixando cadastro órfão | médio | baixa | Edge Function `vendas` já faz rollback manual (DELETE) se evidência/comissão falhar; frontend pode retry |
| CPF duplicado não detectado se usuário não preencher CPF completo | baixo | média | Validação de formato (11 dígitos) antes da query de duplicidade |
| Toggle "Incluir Venda" confunde usuários que não percebem a opção | baixo | baixa | Layout claro com seções visuais distintas; toggle com label descritivo |

## 10. Critério de pronto

- [ ] Página `/cadastro` funcional para VENDEDOR e SECRETARIA
- [ ] Toggle "Incluir Venda" controla visibilidade dos campos de venda
- [ ] Detecção de CPF duplicado exibe alerta e pré-preenche dados do aluno (read-only)
- [ ] Upload de comprovante funciona (preview, validação ≤5MB, envio para bucket)
- [ ] Criação atômica de aluno + venda (ou ambas ou nenhuma)
- [ ] Modo sem venda cria apenas o aluno
- [ ] Indicadores de documentos pendentes exibidos após cadastro
- [ ] Menu lateral atualizado com link "Cadastro"
- [ ] Todas as ações do `actions.md` marcadas `[X]`
- [ ] `regression-watch.md` gerado

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-10 | Versão inicial gerada por `/reversa-plan` | reversa |
