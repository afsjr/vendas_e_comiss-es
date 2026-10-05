# Requirements: Dashboard visual — funil por etapa, volume acumulado e acesso por papel

> Identificador: `009-dashboard-graficos-acesso`
> Data: `2026-10-05`
> Pasta da extração reversa: `_reversa_sdd/`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA / DÚVIDA

## 1. Resumo executivo

Adiciona gráficos visuais ao dashboard do sistema, mostrando em que etapa do fluxo comercial cada venda está (funil) e o volume financeiro acumulado no período (entradas, comissões e repasse previsto). A tela passa a atender todos os papéis: **Vendedor** e **Secretaria** veem apenas os próprios lançamentos; **Gestor**, **Auditor** e **Financeiro** veem o próprio recorte e também a visão geral consolidada, com comparativo **lado a lado** por vendedor. Resolve a ausência de visão analítica para os papéis de lançamento (hoje o dashboard é exclusivo do Gestor) e transforma dados já disponíveis em leitura gerencial imediata.

## 2. Contexto a partir do legado

| Fonte | Trecho relevante | Confidência |
|-------|------------------|-------------|
| `_reversa_sdd/sdd/dashboard-gerencial-relatorios.md#6. Requisitos Funcionais (RF-XX)` | RF-01 (KPIs consolidados), RF-05 (distribuição por categoria), RF-10 (mini-dashboard individual restrito do Vendedor), RF-06 (filtros de período/vendedor/categoria) | 🟡 |
| `_reversa_sdd/sdd/dashboard-gerencial-relatorios.md#12. Segurança e Privacidade (Security & LGPD)` | Isolamento total por perfil: VENDEDOR/SECRETARIA filtram pelo próprio usuário; GESTOR acessa tudo | 🟡 |
| `_reversa_sdd/sdd/autenticacao-controle-acesso.md#11.1 Matriz de Acesso RBAC (Role-Based Access Control)` | Listagem de vendas é "Filtro Próprio" para VENDEDOR/SECRETARIA e "Global Geral" para GESTOR | 🟡 |
| `_reversa_sdd/addenda/005-auditoria-primeiro-checklist-dashboard.md#Fluxo vigente` | Etapas vigentes do processo (PENDENTE_VALIDACAO → APROVADA → AGUARDANDO_FINANCEIRO → AGUARDANDO_PAGAMENTO_1M → PRIMEIRA_MENSALIDADE_PAGA) e o dashboard do gestor com desempenho por curso | 🟢 |
| `_reversa_sdd/addenda/006-pre-auditoria-repasses.md` | Superfícies exclusivas do GESTOR e liberação de comissão na 1ª mensalidade | 🟢 |
| `_reversa_sdd/data-dictionary.md#vendas` | Campos `valor_entrada` (imutável), `status_venda`, `criado_por` | 🟢 |
| `_reversa_sdd/data-dictionary.md#comissoes` | Campos `valor_comissao`, `status_comissao` (BLOQUEADA_AUDITORIA, AGUARDANDO_INICIO_AULAS, LIBERADA_PAGAMENTO, PAGA, ESTORNADA) | 🟢 |
| `_reversa_sdd/inventory.md#3. Tecnologias e frameworks` | O legado já previa uma biblioteca de gráficos no frontend, ausente no código atual | 🟢 |

## 3. Personas e cenários de uso

| Persona | Objetivo | Cenário-chave |
|---------|----------|---------------|
| Roberto Gestor (`GESTOR`) | Enxergar o funil consolidado, o volume acumulado e comparar vendedores | Abre o dashboard, vê o funil por etapa, o volume do mês e o comparativo **lado a lado** por vendedor; seleciona um vendedor para detalhar |
| Marcos Vendedor (`VENDEDOR`) | Ver apenas os seus lançamentos, em que etapa estão e quanto já soma | Abre o dashboard no celular e vê o funil e os valores apenas das suas próprias vendas |
| Ana Secretaria (`SECRETARIA`) | Acompanhar suas vendas de balcão no mesmo nível de recorte do vendedor | Abre o dashboard e vê o mesmo recorte restrito às vendas que ela lançou |
| Auditor (`AUDITOR`) | Ver a visão geral consolidada e o próprio recorte | Abre o dashboard e vê o consolidado da instituição; alterna para o recorte dos seus próprios lançamentos |
| Financeiro (`FINANCEIRO`) | Acompanhar o volume geral e o próprio recorte | Abre o dashboard e vê entradas/comissões consolidadas da instituição e o seu próprio recorte |

## 4. Regras de negócio novas ou alteradas

1. **RN-01:** O funil por etapa agrupa as vendas pela etapa vigente do fluxo, exibindo quantidade e valor financeiro (`valor_entrada`) por etapa: `PENDENTE_VALIDACAO`, `APROVADA`, `DEVOLVIDA_AJUSTE`, `AGUARDANDO_FINANCEIRO`, `AGUARDANDO_PAGAMENTO_1M`, `PRIMEIRA_MENSALIDADE_PAGA`, `CANCELADA`. 🟢
   - Origem no legado: `_reversa_sdd/addenda/005-auditoria-primeiro-checklist-dashboard.md#Fluxo vigente`
   - Tipo: nova
2. **RN-02:** O volume financeiro acumulado no período é composto por: (a) **entradas** = soma de `valor_entrada` das vendas do período, e (b) **comissões** = soma de `valor_comissao` das comissões não estornadas. 🟢
   - Origem no legado: `_reversa_sdd/data-dictionary.md#vendas` e `#comissoes`
   - Tipo: nova
3. **RN-03:** O **repasse previsto** é calculado por `valor_entrada × fator(categoria do curso)`, com fator `1,0` para Técnico e Cursos Livres e `0,36` para Graduação. 🟢
   - Origem no legado: `src/app/dashboard/page.tsx` (regra vigente `FATOR_REPASSE`)
   - Tipo: alterada (regra hoje existe apenas na tela; passa a ser item de agregação reutilizável)
4. **RN-04:** Todos os papéis autenticados acessam o dashboard, mas o recorte depende do papel: `VENDEDOR` e `SECRETARIA` veem exclusivamente os registros cujo `criado_por` seja o próprio usuário; `GESTOR`, `AUDITOR` e `FINANCEIRO` veem o próprio recorte **e** a visão geral consolidada. O recorte é aplicado na consulta (nunca apenas na interface). 🟢
   - Origem no legado: `_reversa_sdd/sdd/autenticacao-controle-acesso.md#11.1 Matriz de Acesso RBAC (Role-Based Access Control)`
   - Tipo: alterada (o dashboard deixa de ser exclusivo do GESTOR)
5. **RN-05:** Um vendedor não pode obter dados de terceiros manipulando parâmetros de consulta; tentativas de acessar o recorte consolidado não retornam dados de outros vendedores. 🟡
   - Origem no legado: `_reversa_sdd/sdd/dashboard-gerencial-relatorios.md#12. Segurança e Privacidade (Security & LGPD)`
   - Tipo: nova

## 5. Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-01 | O dashboard é acessível a todos os papéis (`GESTOR`, `VENDEDOR`, `SECRETARIA`, `AUDITOR`, `FINANCEIRO`), com o recorte ajustado ao papel; nenhum papel é redirecionado ao login por falta de permissão | Must | Autenticado como qualquer papel, acessar `/dashboard` renderiza a tela (sem redirecionamento) com o recorte previsto para o papel | 🟡 |
| RF-02 | Exibir um gráfico de funil por etapa do processo, com quantidade e valor por etapa | Must | Para um conjunto de vendas, cada etapa vigente aparece com a contagem e o somatório de `valor_entrada` correspondentes; somatório das etapas = total do recorte | 🟢 |
| RF-03 | Exibir o volume financeiro acumulado do período (entradas e comissões não estornadas) e o repasse previsto | Must | Os indicadores batem com a agregação direta dos registros do recorte e atualizam ao mudar o período | 🟢 |
| RF-04 | Permitir filtro de período (mês atual, mês anterior e intervalo personalizado) que recalcula gráficos e indicadores | Must | Alterar o período atualiza todos os visuais sem recarregar a página inteira | 🟡 |
| RF-05 | Exibir, para os papéis com visão geral (`GESTOR`, `AUDITOR`, `FINANCEIRO`), um comparativo **lado a lado** por vendedor e permitir isolar um vendedor; esse comparativo nunca aparece para VENDEDOR/SECRETARIA | Must | Papel com visão geral vê o comparativo por vendedor e consegue isolar um vendedor; VENDEDOR não vê a lista de outros vendedores | 🟡 |
| RF-06 | Exibir gráfico de distribuição das entradas por categoria de curso (Técnico, Graduação, Pós-Graduação, Cursos Livres) | Should | As fatias/percentuais somam 100% do volume de entradas do recorte | 🟡 |
| RF-07 | Aplicar isolamento de dados no nível da consulta, impedindo que usuário de lançamento receba registros de terceiros | Must | Requisição iniciada por VENDEDOR/SECRETARIA retorna apenas registros com `criado_por` igual ao seu ID; nenhum dado de terceiro é exposto | 🟢 |
| RF-08 | Tratar estados de carregamento, ausência de dados e erro de consulta | Should | Sem dados no período, exibir mensagem neutra; falha na consulta exibe aviso com opção de tentar novamente | 🟡 |
| RF-09 | Papéis com visão geral (`GESTOR`, `AUDITOR`, `FINANCEIRO`) alternam entre o próprio recorte e a visão geral consolidada | Must | O papel com visão geral vê o próprio recorte e a visão geral, alternando sem recarregar a página inteira | 🟡 |

## 6. Requisitos Não Funcionais

| Tipo | Requisito | Evidência ou justificativa | Confidência |
|------|-----------|----------------------------|-------------|
| Segurança | Nenhuma linha de venda ou comissão de terceiros pode ser retornada a usuário de lançamento (prevenção a referência direta insegura a objeto, IDOR, e a autorização quebrada em nível de objeto, BOLA) | `_reversa_sdd/sdd/autenticacao-controle-acesso.md#11.1 Matriz de Acesso RBAC (Role-Based Control)` | 🟢 |
| Desempenho | O dashboard deve renderizar em até 2 s para janelas de consulta de até 12 meses, com agregação sobre o conjunto carregado | Padrão vigente de agregação no cliente em `src/app/dashboard/page.tsx` | 🟡 |
| Responsividade | A visão do Vendedor/Secretaria deve ser utilizável a partir de 360 px de largura (mobile-first) | `_reversa_sdd/sdd/dashboard-gerencial-relatorios.md#7. Requisitos Não-Funcionais (RNF-XX)` | 🟡 |
| Acessibilidade | Gráficos devem trazer rótulos/legendas textuais e não depender exclusivamente de cor para transmitir etapa | Boas práticas gerais; dashboard usa cor como único diferenciador hoje | 🟡 |
| Manutenibilidade | A lógica de agregação (funil, totais, repasse) deve ficar em função pura testável, sem dependência de UI | Padrão estabelecido por `src/lib/consolidado.ts` | 🟢 |

## 7. Critérios de Aceitação

```gherkin
Cenário: Vendedor visualiza apenas os próprios lançamentos
  Dado que estou autenticado com papel VENDEDOR
  E existem vendas lançadas por mim e por outro vendedor
  Quando eu acesso o dashboard
  Então o funil e os volumes consideram apenas as vendas com criado_por igual ao meu usuário
  E a lista de outros vendedores não é exibida

Cenário: Gestor visualiza o consolidado e o recorte lado a lado por vendedor
  Dado que estou autenticado com papel GESTOR
  Quando eu acesso o dashboard
  Então vejo o funil e o volume acumulado de todas as vendas da instituição
  E vejo o comparativo lado a lado por vendedor
  E ao selecionar um vendedor o recorte passa a refletir apenas as vendas dele

Cenário: Papel com visão geral alterna entre o próprio recorte e o geral
  Dado que estou autenticado com papel AUDITOR ou FINANCEIRO
  Quando eu acesso o dashboard
  Então vejo a visão geral consolidada da instituição
  E consigo alternar para o recorte dos meus próprios lançamentos
  E a alternância não recarrega a página inteira

Cenário: Funil por etapa fecha com o total do recorte
  Dado um recorte de vendas com etapas variadas
  Quando o funil por etapa é calculado
  Então a soma das quantidades por etapa é igual ao total de vendas do recorte
  E a soma dos valores por etapa é igual ao valor total do recorte

Cenário: Tentativa de acessar dados de terceiros por parâmetro
  Dado que estou autenticado com papel VENDEDOR
  Quando eu tento forçar a consulta para o recorte de outro usuário
  Então o sistema retorna apenas registros do meu próprio usuário
  E nenhum dado de terceiros é exibido
```

## 8. Prioridade MoSCoW

| Item | MoSCoW | Justificativa |
|------|--------|---------------|
| RF-01 | Must | Sem isso os papéis de lançamento nem acessam o dashboard |
| RF-02 | Must | Núcleo do pedido: visibilidade das etapas do processo |
| RF-03 | Must | Núcleo do pedido: volume financeiro acumulado |
| RF-04 | Must | Sem período não há leitura gerencial útil |
| RF-05 | Must | Requisito explícito de comparativo lado a lado por vendedor |
| RF-09 | Must | Papéis com visão geral precisam alternar entre o próprio recorte e o consolidado |
| RF-07 | Must | Segurança e privacidade entre carteiras |
| RF-06 | Should | Enriquece a análise, mas não bloqueia a entrega |
| RF-08 | Should | Qualidade de experiência; pode ser polimento |
| RNF de desempenho | Should | Garante usabilidade em volume de dados real |

## 9. Esclarecimentos

### Sessão 2026-10-05

- **Q:** Quais papéis exatamente acessam o dashboard: apenas `GESTOR`, `VENDEDOR` e `SECRETARIA`, ou também `AUDITOR` e `FINANCEIRO`?
  **R:** Todos os papéis acessam o dashboard.
- **Q:** "Volume financeiro acumulado" deve considerar apenas entradas, apenas comissões, ou ambos somados, e qual janela é o padrão?
  **R:** `VENDEDOR` e `SECRETARIA` visualizam as próprias entradas; os demais papéis (`GESTOR`, `AUDITOR`, `FINANCEIRO`) visualizam o próprio recorte e a visão geral consolidada. O indicador de volume acumulado passa a cobrir entradas e comissões no recorte, com o mesmo padrão de período para todos os papéis.
- **Q:** No dashboard do gestor, "por cada vendedor separadamente" deve ser comparativo lado a lado com drill-down, ou filtro de seleção?
  **R:** Comparativo lado a lado por vendedor, com possibilidade de isolar um vendedor.

## 10. Lacunas

Nenhuma lacuna em aberto nesta feature.

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-10-05 | Versão inicial gerada por `/reversa-requirements` | reversa |
| 2026-10-05 | Dúvidas resolvidas por `/reversa-clarify` (acesso de todos os papéis, recorte próprio + geral, comparativo lado a lado) | reversa |
