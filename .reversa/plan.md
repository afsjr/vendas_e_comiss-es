# Plano de Exploração — comissionamento e venda

> Criado pelo Reversa em 2026-07-23
> Marque cada tarefa com ✅ quando concluída.
> Você pode editar este plano antes de iniciar: adicione, remova ou reordene tarefas conforme necessário.

---

## Fase 1: Reconhecimento 🔍

- [x] **Scout** — Mapeamento de estrutura de pastas e tecnologias
- [x] **Scout** — Análise de dependências e gerenciadores de pacotes
- [x] **Scout** — Identificação de entry points, CI/CD e configurações

## Decisão de organização das specs 🗂️

> Decidido: **híbrida** (modulo na raiz, casos de uso aninhados). Persistido em `.reversa/config.toml` → `[specs]` (granularity=hybrid, decided_at=2026-07-26). Sugestão do Scout: `hybrid` (aceita).

## Fase 2: Escavação 🏗️

> Módulos identificados pelo Scout (backend Rust + frontend Next.js + Supabase).

- [x] **Arqueólogo** — Análise do módulo `vendas` (apontamento + evidências SHA-256 + histórico)
- [x] **Arqueólogo** — Análise do módulo `auditoria` (aprovar/devolver)
- [x] **Arqueólogo** — Análise do módulo `comissoes` (cálculo e ciclo de vida)
- [x] **Arqueólogo** — Análise do módulo `fechamento` (mensal + livro caixa)
- [x] **Arqueólogo** — Análise do módulo `contratos` (geração PDF)
- [x] **Arqueólogo** — Análise do módulo `auth-rls` (JWT, papéis RBAC, sync RLS)
- [x] **Arqueólogo** — Análise do módulo `frontend-shell` (App Router, PWA, providers)
- [x] **Arqueólogo** — Análise do módulo `frontend-alunos` (cadastro/documentação)
- [x] **Arqueólogo** — Análise do módulo `frontend-dashboard` (dashboard, carteira, relatórios)

## Fase 3: Interpretação 🧠

- [ ] **Detetive** — Arqueologia Git e ADRs retroativos
- [ ] **Detetive** — Regras de negócio implícitas e máquinas de estado
- [ ] **Detetive** — Matriz de permissões (RBAC/ACL)
- [ ] **Arquiteto** — Diagramas C4 (Contexto, Containers, Componentes)
- [ ] **Arquiteto** — ERD completo e integrações externas
- [ ] **Arquiteto** — Spec Impact Matrix

## Fase 4: Geração 📝

- [ ] **Redator** — Specs SDD por componente
- [ ] **Redator** — OpenAPI (se aplicável)
- [ ] **Redator** — User Stories (se aplicável)
- [ ] **Redator** — Code/Spec Matrix

## Fase 5: Revisão ✅

- [ ] **Revisor** — Revisão cruzada de specs
- [ ] **Revisor** — Resolução de lacunas com o usuário
- [ ] **Revisor** — Relatório de confiança final

---

## Agentes Independentes

> Execute estes agentes quando os recursos estiverem disponíveis — podem rodar em qualquer fase.

- [ ] **Visor** — Análise de interface via screenshots
- [ ] **Data Master** — Análise completa do banco de dados
- [ ] **Design System** — Extração de tokens de design
- [ ] **Tracer** — Análise dinâmica (requer sistema acessível)

---

## Próximo passo

Após o Time de Descoberta concluir e o `_reversa_sdd/` estar populado, você pode disparar um dos fluxos seguintes:

- `/reversa-migrate`: orquestrador do **Time de Migração** (Paradigm Advisor → Curator → Strategist → Designer → Screen Translator → Inspector). Gera as specs do sistema novo. Saída em `_reversa_sdd/migration/` e `_reversa_sdd/screens/`.
- `/reversa-reconstructor`: gera plano bottom-up para reimplementar o software a partir das specs do legado (uma tarefa por sessão).
