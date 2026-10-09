# Spec: Acesso por Papel às Comissões

**Versão:** 1.0
**Status:** Rascunho
**Autor:** reversa-spec-sdd
**Data:** 2026-10-09
**Reviewers:** N/A

---

## 1. Resumo

🟡 Este componente define quem pode ver e dar baixa nas comissões, garantindo que gestor, auditor e financeiro tenham visão consolidada e que o vendedor permaneça restrito à própria carteira. Existe para que a visibilidade de pagamento não abra brecha de acesso indevido.

---

## 2. Contexto e Motivação

**Problema:**
🟡 Ao expor uma visão consolidada de comissões, é preciso garantir que os papéis administrativos vejam tudo e que ninguém mais ganhe acesso indevido aos dados financeiros.

**Evidências:**
🟡 O legado usa `app_metadata.app_role` no JWT e RLS por papel (`supabase/migrations/20260909000001_postvenda_rls.sql` e `20261008000004_financeiro_rls_alignment.sql`).

**Por que agora:**
🟡 A nova visão e a ação de baixa criam novas rotas e consultas que precisam respeitar o RBAC já existente.

---

## 3. Goals (Objetivos)

- [ ] 🟡 G-01: Restringir a leitura consolidada de comissões a gestor, auditor e financeiro.
- [ ] 🟡 G-02: Restringir a baixa de pagamento aos mesmos papéis.
- [ ] 🟡 G-03: Manter o vendedor restrito à própria carteira.

**Métricas de sucesso:**

| Métrica | Baseline atual | Target | Prazo |
|---------|---------------|--------|-------|
| Acessos indevidos a comissões de terceiros | não medido | 0 ocorrências | 3 meses |
| Rotas administrativas protegidas por papel | parcial | 100% | 3 meses |

---

## 4. Non-Goals (Fora do Escopo)

- NG-01: 🟡 Não redefine o conjunto de papéis do sistema.
- NG-02: 🟡 Não altera o fluxo de autenticação ou de login.
- NG-03: 🟡 Não implementa SSO ou autenticação externa.
- NG-04: 🟡 Não implementa permissões por vendedor individual.

---

## 5. Usuários e Personas

**Usuário primário:** 🟡 Gestor/auditor/financeiro, com acesso consolidado.
**Usuário secundário:** 🟡 Vendedor, restrito à própria carteira.

**Jornada atual (sem a feature):**
1. 🟡 O controle de acesso é parcial e disperso entre telas.
2. 🟡 Não há uma regra única para as rotas financeiras.

**Jornada futura (com a feature):**
1. 🟡 O usuário acessa a rota e o sistema verifica o papel.
2. 🟡 Papéis autorizados veem a visão; os demais são redirecionados.
3. 🟡 O vendedor continua vendo apenas a própria carteira.

---

## 6. Requisitos Funcionais

### 6.1 Requisitos Principais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | O sistema deve permitir a leitura consolidada de comissões apenas para `GESTOR`, `AUDITOR` e `FINANCEIRO`. | Must | Outro papel recebe acesso negado na rota do painel. |
| RF-02 | O sistema deve permitir a baixa de pagamento apenas para `GESTOR`, `AUDITOR` e `FINANCEIRO`. | Must | Outro papel não consegue executar a ação de baixa. |
| RF-03 | O sistema deve manter o `VENDEDOR` restrito à própria carteira de comissões. | Must | O vendedor vê apenas comissões de `criado_por` igual ao seu id. |
| RF-04 | O sistema deve verificar o papel a partir de `app_metadata.app_role` do token. | Must | A autorização usa o papel do JWT, não um parâmetro de tela. |
| RF-05 | O sistema deve redirecionar o usuário não autorizado para o dashboard com aviso de acesso negado. | Must | Acesso negado exibe aviso e não revela dados. |
| RF-06 | O sistema deve aplicar as mesmas restrições no banco (RLS) e na rota. | Should | Consulta direta ao banco respeita o papel do usuário. |
| RF-07 | O sistema deve registrar tentativas de baixa negadas por papel. | Could | Tentativa negada gera registro de auditoria. |

### 6.2 Fluxo Principal (Happy Path)

1. 🟡 O usuário autenticado acessa a rota do painel de comissões.
2. 🟡 O sistema lê `app_metadata.app_role` do token.
3. 🟡 O sistema confere se o papel está entre gestor, auditor e financeiro.
4. 🟡 O sistema libera a rota e a consulta consolidada.
5. 🟡 O sistema libera a ação de baixa para o mesmo papel.
6. 🟡 Resultado: somente os papéis autorizados operam a visão e a baixa.

### 6.3 Fluxos Alternativos

**Fluxo Alternativo A — Papel não autorizado:**
1. 🟡 O usuário com papel não autorizado acessa a rota.
2. 🟡 O sistema redireciona para o dashboard com aviso "acesso negado".

**Fluxo Alternativo B — Papel ausente no token:**
1. 🟡 O token não contém `app_role`.
2. 🟡 O sistema trata como não autorizado e redireciona.

---

## 7. Requisitos Não-Funcionais

| ID | Requisito | Valor alvo | Observação |
|----|-----------|-----------|------------|
| RNF-01 | Segurança | Verificação em rota e no banco | Defesa em profundidade |
| RNF-02 | Consistência | Rota e RLS com o mesmo conjunto de papéis | Evita brecha |
| RNF-03 | Performance | Verificação de papel em < 200 ms | No middleware |
| RNF-04 | Auditar | Registro de baixa e de negação | Rastreabilidade |

---

## 8. Design e Interface

**Componentes afetados:** 🟡 Middleware de rotas, políticas RLS e menu de navegação.

**Comportamento esperado:**
🟡 O item de menu do painel aparece apenas para os papéis autorizados. O acesso direto à rota por papel não autorizado redireciona com aviso.

**Estados da UI:**
- Estado vazio: 🟡 item de menu oculto para papel não autorizado.
- Estado de carregamento: 🟡 verificação de sessão no middleware.
- Estado de erro: 🟡 aviso de acesso negado.
- Estado de sucesso: 🟡 rota acessível com dados do recorte.

---

## 9. Modelo de Dados

🟡 Sem novas tabelas. Usa `app_metadata.app_role` do JWT e as tabelas `comissoes`, `vendas` e `perfis`.

**Migrações necessárias:** 🟡 Ajuste de policies RLS para incluir os três papéis administrativos, se ainda não coberto.

---

## 10. Integrações e Dependências

| Dependência | Tipo | Impacto se indisponível |
|-------------|------|------------------------|
| Supabase Auth (JWT com `app_role`) | Obrigatória | Sem papel não há autorização |
| Middleware de rotas do Next.js | Obrigatória | Rotas administrativas ficam sem proteção de rota |

---

## 11. Edge Cases e Tratamento de Erros

| Cenário | Trigger | Comportamento esperado |
|---------|---------|----------------------|
| EC-01: Papel ausente no token | `app_role` indefinido | Tratar como não autorizado e redirecionar |
| EC-02: Papel rebaixado durante a sessão | Papel alterado após login | Próxima requisição usa o papel atual e nega se preciso |
| EC-03: Acesso direto à rota protegida | URL digitada por papel não autorizado | Redirecionar com aviso de acesso negado |
| EC-04: Consulta direta ao banco | PostgREST sem filtro de tela | RLS restringe pelo papel do usuário |
| EC-05: Token expirado | Sessão vencida | Redirecionar para login |
| EC-06: Indisponibilidade do Supabase Auth | Timeout ao validar o token | Negar a rota com mensagem de erro e permitir nova tentativa |

---

## 12. Segurança e Privacidade

- **Autenticação:** 🟡 Sessão obrigatória para as rotas.
- **Autorização:** 🟡 Papéis gestor, auditor e financeiro; vendedor restrito.
- **Dados sensíveis:** 🟡 Comissões e valores financeiros; acesso mínimo necessário.
- **Auditoria:** 🟡 Registrar baixas e tentativas negadas.

---

## 13. Plano de Rollout

- **Estratégia:** 🟡 Aplicar RBAC de rota e RLS antes de liberar o painel.
- **Como reverter (rollback):** 🟡 Reverter as policies e o matcher do middleware ao estado anterior.
- **Monitoramento pós-deploy:** 🟡 Observar redirecionamentos de acesso negado e erros de permissão.

---

## 14. Open Questions

| # | Pergunta | Impacto | Dono | Prazo |
|---|---------|---------|------|-------|
| OQ-01 | 🟡 O papel `SECRETARIA` deve ver alguma visão de comissões ou apenas vendas? | Médio | adelino | 2026-10-16 |
| OQ-02 | 🟡 A negação por papel deve ser registrada em log próprio? | Baixo | adelino | 2026-10-16 |

---

## 15. Decisões Tomadas (Decision Log)

| Decisão | Alternativas consideradas | Racional |
|---------|--------------------------|---------|
| 🟡 Usar `app_metadata.app_role` como fonte do papel | Consulta a `perfis` a cada requisição | Já disponível no JWT, sem consulta extra |
| 🟡 Defesa em profundidade (rota + RLS) | Apenas rota | Evita acesso via API direta |

---

## Apêndice

### Referências
- 🟡 `supabase/migrations/20260909000001_postvenda_rls.sql`
- 🟡 `supabase/migrations/20261008000004_financeiro_rls_alignment.sql`
- 🟡 `src/middleware.ts`

### Histórico de Revisões
| Versão | Data | Autor | Mudanças |
|--------|------|-------|---------|
| 1.0 | 2026-10-09 | reversa-spec-sdd | Criação inicial |

---

## Relatório de Avaliação (spec_scorer)

```
SCORE TOTAL: 100.0/100 — ⭐ Excelente — Pronta para implementação

Completude:    100% (peso 30%)
Testabilidade: 100% (peso 25%)
Clareza:       100% (peso 20%)
Escopo:        100% (peso 15%)
Edge Cases:    100% (peso 10%)

Gaps críticos: nenhum
Sugestões: nenhuma
```
