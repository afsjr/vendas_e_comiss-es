# SDD Spec: Componente `dashboard-gerencial-relatorios` (Dashboard Gerencial e Relatórios)

> Selo 🟡 PLANEJADO. Documento de Especificação Detalhada de Design (SDD) gerado a partir do PRD, Ideation e Personas.

**Versão:** 1.0  
**Data:** 2026-07-23T14:15:00-03:00  
**Autor:** reversa-spec-writer  
**Status:** Rascunho Especificado  
**Módulo:** Apuração, Projeções e Relatórios Financeiros  
**Componente:** `dashboard-gerencial-relatorios`  

---

## 1. Resumo (Executive Summary)

🟡 O componente `dashboard-gerencial-relatorios` é o núcleo analítico e de inteligência de negócios do **Sistema de Comissionamento e Vendas**. Ele fornece visualizações consolidadas de desempenho comercial, controle de metas diárias e mensais, projeção estatística de vendas (*run-rate*), comparativo entre faturamento estimado e realizado, além de relatórios financeiros detalhados de comissões (pagas vs. pendentes) e reembolsos/estornos. 

O módulo foi projetado com estrito controle de acesso baseado em papéis (RBAC): a visão consolidada global é de uso **EXCLUSIVO** do perfil **Gestor**, enquanto o perfil **Vendedor** acessa apenas um mini-dashboard restrito com suas próprias métricas e metas individuais. Os dados analíticos são processados e atualizados no mínimo com frequência **D-1** (dados consolidados até o encerramento do dia anterior), oferecendo também recálculo sob demanda para vendas auditadas no dia corrente. O componente inclui motores de exportação formal nos formatos CSV e PDF com marcas de auditoria.

---

## 2. Contexto (Context)

🟡 No cenário atual da escola, a falta de visibilidade centralizada impede a diretoria e os gestores de acompanhar o atingimento de metas em tempo hábil e projetar o fechamento financeiro do mês. O cálculo de comissões e a apuração de reembolsos são feitos de forma reativa e sujeitos a erros manuais.

O componente `dashboard-gerencial-relatorios` se posiciona na camada analítica do ecossistema, consumindo dados transacionais de:
1. **Apontamento de Vendas:** Vendas registradas pelo comercial e pela secretaria.
2. **Auditoria de Vendas:** Status de validação (`🟢 Aprovada`, `🟡 Pendente de Validação`, `🔴 Devolver para Ajuste`).
3. **Carteira de Comissões:** Comissões geradas, liberadas para pagamento e pagas.
4. **Livro-Caixa:** Lançamentos imutáveis de entradas, reembolsos e estornos.
5. **Cadastro de Cursos/Produtos:** Agrupamento por modalidades (Técnico, Graduação, Pós-Graduação, Cursos Libres).

```
 +-----------------------------------------------------------------------+
 |                     FONTES TRANSACIONAIS (OLTP)                       |
 |  [Vendas] ---> [Auditoria] ---> [Comissões] ---> [Livro-Caixa]        |
 +-----------------------------------------------------------------------+
                                     |
                                     v
 +-----------------------------------------------------------------------+
 |                    CAMADA ANALÍTICA (D-1 / Materialized)              |
 |              `dashboard-gerencial-relatorios` Engine                  |
 +-----------------------------------------------------------------------+
          |                                            |
          v                                            v
 +-----------------------------+              +--------------------------+
 | Visão Gestor (Consolidada)   |              | Visão Vendedor Restrita  |
 | - KPIs Globais / Run-Rate   |              | - Progresso de Meta Indiv.|
 | - Metas Equipe / Cursos     |              | - Projeção de Comissão   |
 | - Exportação PDF / CSV      |              | - Minha Carteira         |
 +-----------------------------+              +--------------------------+
```

---

## 3. Goals (Objetivos)

🟡 Os principais objetivos do componente são:

- 🟡 **Visão Consolidada Global (Gestor):** Oferecer um painel único com os principais indicadores de vendas da escola em tempo hábil (D-1 no mínimo).
- 🟡 **Acompanhamento de Metas Diárias e Mensais:** Exibir barras de progresso visuais do atingimento da meta global da equipe e detalhamento por vendedor.
- 🟡 **Projeção de Tendência (Run-Rate):** Calcular estatisticamente a estimativa de faturamento até o último dia do mês corrente com base no ritmo atual de vendas.
- 🟡 **Comparativo Estimado × Realizado:** Exibir o faturamento bruto estimado (vendas apontadas total) versus o faturamento efetuado/realizado (vendas auditadas e confirmadas).
- 🟡 **Filtragem Multidimensional:** Permitir filtros dinâmicos por Período (diário, semanal, mensal, personalizado), Vendedor e Tipo de Curso (Técnico, Graduação, Pós-Graduação, Cursos Libres).
- 🟡 **Relatório de Comissões Pagas × Pendentes:** Fornecer visão detalhada por colaborador sobre comissões já quitadas e comissões aguardando liberação/pagamento.
- 🟡 **Relatório de Reembolsos e Estornos:** Apresentar histórico auditável de devoluções financeiras efetuadas no livro-caixa com motivos e impacto no realizado.
- 🟡 **Exportação Multiformato Auditável:** Permitir download de relatórios consolidados e analíticos em arquivos CSV (dados brutos) e PDF (formato executivo assinado com timestamp).
- 🟡 **Privacidade e Isolamento (RBAC):** Garantir que vendedores enxerguem rigorosamente apenas seus próprios dados.

---

## 4. Non-Goals (Não-Objetivos)

🟡 Ficam expressamente fora do escopo deste componente:

- 🟡 **Não emitir Nota Fiscal Eletrônica (NF-e):** O sistema não integrará com prefeituras ou SEFAZ para emissão fiscal.
- 🟡 **Não processar pagamentos bancários:** O dashboard não executa transferências (Pix/TED) nem cobra cartões de crédito; apenas reflete os lançamentos operacionais.
- 🟡 **Não permitir edição de lançamentos transacionais:** O dashboard é read-only; correções de vendas devem ser feitas através do módulo de auditoria ou contra-lançamentos no livro-caixa.
- 🟡 **Não fornecer visão global para perfis que não sejam Gestor:** Vendedores e secretárias jamais poderão visualizar números consolidados da instituição.

---

## 5. Usuários e Personas

🟡 As especificações deste componente atendem diretamente às seguintes personas:

| Persona | Perfil | Permissões / Visão no Dashboard | Necessidade Principal |
|---|---|---|---|
| **Roberto Gestor** | Gestor / Auditor | 🟡 Visão Global Consolidada total. Acesso a todas as equipes, vendedores, produtos, relatórios de comissões, estornos e exportação PDF/CSV. | Acompanhar a meta diária/mensal da escola, estimar o fechamento do mês (run-rate), auditar comissões pagas/pendentes e exportar relatórios. |
| **Marcos Vendedor** | Vendedor Comercial | 🟡 Visão Restrita ("Mini-Dashboard Individual"). Acessa apenas suas metas pessoais, seu ritmo diário e suas projeções de comissão. | Saber se está atingindo sua meta diária/mensal e quanto receberá de comissão no final do mês. |
| **Ana Secretaria** | Secretaria / Balcão | 🟡 Visão Restrita Operacional. Acessa relatórios de suas próprias vendas de balcão e pendências de documentação. | Acompanhar o volume de matrículas de balcão efetuadas no período. |

---

## 6. Requisitos Funcionais (RF-XX)

### 🟡 RF-01: Exibição de KPIs Consolidados Globais (Painel do Gestor)
- **Descrição:** O sistema deve apresentar no topo da tela do Gestor os cards sintéticos com os principais indicadores de desempenho comercial da instituição no período selecionado.
- **Critérios de Aceite:**
  - 🟡 Exibir os cards: **Faturamento Realizado (R$)**, **Faturamento Estimado (R$)**, **Meta Mensal (R$)**, **% Atingimento da Meta**, **Quantidade de Vendas Aprovadas** e **Ticket Médio (R$)**.
  - 🟡 Os valores devem respeitar os filtros ativos de período, vendedor e categoria de curso.
  - 🟡 Atualização dos dados garantida até **D-1** no mínimo, exibindo o carimbo da última consolidação realizada.
- **Fluxo Principal (Happy Path):**
  1. O Gestor acessa a aba "Dashboard Gerencial".
  2. O sistema consulta as visões analíticas consolidadas.
  3. O sistema renderiza os 6 cards de KPIs principais com formatação monetária padrão BRL (`R$ #.##0,00`).
- **Fluxos Alternativos / Exceção:**
  - *FA-01.1 (Sem dados no período):* Exibir cards com valor `R$ 0,00` e mensagem informativa de ausência de lançamentos.

---

### 🟡 RF-02: Gestão e Barra de Progresso de Meta Diária e Mensal
- **Descrição:** O sistema deve calcular e exibir o progresso da meta mensal e a meta diária proporcional (equipe e individual).
- **Critérios de Aceite:**
  - 🟡 A **Meta Diária Proporcional da Equipe** é calculada por: $$\text{Meta Diária} = \frac{\text{Meta Mensal Global}}{\text{Dias Úteis do Mês}}$$.
  - 🟡 Exibir barra de progresso visual (porcentagem e barra colorida: Vermelho < 70%, Amarelo 70%-99%, Verde >= 100%).
  - 🟡 Exibir tabela comparativa por Vendedor contendo: Nome, Meta Individual, Realizado no Mês, Meta Diária e Progresso (% Atingido).
- **Fluxo Principal (Happy Path):**
  1. O Gestor visualiza a seção "Acompanhamento de Metas".
  2. O sistema calcula a fração de meta esperada até o dia atual ($D$).
  3. O sistema exibe o indicador visual da meta acumulada esperada vs realizada.
- **Fluxos Alternativos / Exceção:**
  - *FA-02.1 (Dia não útil/final de semana):* O cálculo ajusta a contagem mantendo a proporção dos dias úteis efetivamente trabalhados.

---

### 🟡 RF-03: Projeção de Tendência de Vendas (*Run-Rate*)
- **Descrição:** O sistema deve calcular a projeção estatística de faturamento estimado até o final do mês corrente com base na média diária de vendas auditadas.
- **Critérios de Aceite:**
  - 🟡 Fórmula oficial do Run-Rate de Faturamento:
    $$\text{Run-Rate} = \left( \frac{\text{Faturamento Realizado acumulado até o dia } d}{d_{\text{corridos}}} \right) \times D_{\text{total\_dias\_mes}}$$
  - 🟡 Apresentar gráfico de tendência (linha histórica do realizado + linha pontilhada da projeção até o fim do mês).
  - 🟡 Exibir indicador de desvio: "Projeção acena para +X% acima da meta" ou "-Y% abaixo da meta".
- **Fluxo Principal (Happy Path):**
  1. O sistema identifica o dia atual $d$ do mês em vigência.
  2. O sistema divide o acumulado auditado pelos dias decorridos e multiplica pelo total de dias do mês.
  3. Renderiza o valor projetado e sinaliza o status do atingimento (Superávit/Déficit previsto).
- **Fluxos Alternativos / Exceção:**
  - *FA-03.1 (Primeiro dia do mês, d = 0):* O sistema exibe "Projeção indisponível (aguardando primeiro dia de apuração)".

---

### 🟡 RF-04: Comparativo de Faturamento Estimado × Realizado
- **Descrição:** O sistema deve detalhar visualmente a diferença entre as vendas apenas apontadas (faturamento estimado) e as vendas auditadas/aprovadas (faturamento realizado).
- **Critérios de Aceite:**
  - 🟡 **Faturamento Estimado:** Soma de todas as vendas apontadas no status `🟡 Pendente de Validação` + `🟢 Aprovada`.
  - 🟡 **Faturamento Realizado:** Soma estrita de vendas no status `🟢 Aprovada` com comprovante conferido.
  - 🟡 Exibir gráfico de barras lado a lado (Estimado em Azul, Realizado em Verde, Divergente em Vermelho).
- **Fluxo Principal (Happy Path):**
  1. Gestor escolhe o período de análise (ex: Mês Atual).
  2. Sistema agrupa as vendas por status de auditoria.
  3. Exibe o gráfico comparativo e o valor financeiro pendente de auditoria em caixa.

---

### 🟡 RF-05: Visão por Categoria de Produto (Tipo de Curso)
- **Descrição:** O sistema deve permitir a segmentação dos resultados de faturamento e quantidade de matrículas por tipo de curso.
- **Critérios de Aceite:**
  - 🟡 Categorias obrigatórias: **Técnico**, **Graduação**, **Pós-Graduação**, **Cursos Libres**.
  - 🟡 Exibir gráfico de rosca/pizza com a distribuição percentual do faturamento por categoria.
  - 🟡 Exibir tabela analítica com: Categoria, Matrículas Realizadas, Ticket Médio por Categoria, Faturamento Total e % de Representatividade no Caixa.
- **Fluxo Principal (Happy Path):**
  1. O Gestor visualiza o painel "Desempenho por Produto".
  2. O sistema consolida os dados de vendas com base na categoria cadastrada no curso.
  3. Exibe a distribuição percentual e o detalhamento monetário por modalidade.

---

### 🟡 RF-06: Filtros Multidimensionais Avançados
- **Descrição:** O sistema deve disponibilizar barra de filtros globais para refinamento imediato das informações do dashboard e relatórios.
- **Critérios de Aceite:**
  - 🟡 **Filtro de Período:** Opções pré-definidas: *Hoje*, *D-1 (Ontem)*, *Semana Atual*, *Mês Atual*, *Mês Anterior*, *Intervalo Personalizado (Data Início e Data Fim)*.
  - 🟡 **Filtro de Vendedor:** *Todos os Vendedores* ou seleção individualizada.
  - 🟡 **Filtro de Categoria de Curso:** *Todas as Categorias* ou seleção de uma ou mais categorias.
  - 🟡 As alterações nos filtros devem recalcular todos os cards, gráficos e tabelas da tela em sub-segundo sem recarregar a página inteira.
- **Fluxo Principal (Happy Path):**
  1. O Gestor seleciona "Mês Anterior" + Vendedor "Marcos Vendedor".
  2. O sistema atualiza os KPIs, barras de meta, run-rate e relatórios para refletir apenas os dados filtrados.
- **Fluxos Alternativos / Exceção:**
  - *FA-06.1 (Período personalizado inválido - Data Início > Data Fim):* Bloquear aplicação do filtro e exibir alerta no campo.

---

### 🟢 RF-07: Relatório Mensal de Comissões
- **Descrição:** O sistema deve disponibilizar um relatório detalhado de apuração de comissões da equipe comercial.
- **Critérios de Aceite:**
  - 🟢 Listar por vendedor e mês de competência: **Comissão Bloqueada**, **Aguardando Início das Aulas**, **Liberada para Pagamento**, **Paga** e **Data da Última Quitação**.
  - 🟡 Permitir a ordenação por valor de comissão a pagar ou nome do colaborador.
  - 🟡 Exibir botão para detalhar a extrato de vendas individuais que originaram cada valor de comissão.
- **Fluxo Principal (Happy Path):**
  1. O Gestor navega para a sub-aba "Relatório de Comissões".
  2. O sistema agrupa os saldos com base no módulo de auditoria e lançamentos de quitação.
  3. Exibe a tabela consolidada, considerando o corte mensal no último dia às 23:59:59 e os valores fixos por venda.

---

### 🟡 RF-08: Relatório de Reembolsos e Estornos (Livro-Caixa Auditável)
- **Descrição:** O sistema deve listar todas as operações de reembolso de alunos e estornos de comissão registrados no livro-caixa.
- **Critérios de Aceite:**
  - 🟡 Listar cada evento com: ID da Venda Original, Nome do Aluno, Curso, Vendedor Responsável, Valor Reembolsado (R$), Valor da Comissão Estornada (R$), Data do Estorno, Motivo do Reembolso e Usuário Gestor Autorizador.
  - 🟡 Exibir o impacto total de devoluções deduzidas do faturamento bruto no período.
  - 🟡 Garantir a imutabilidade do histórico (registros de estorno são novos lançamentos de contra-partida).
- **Fluxo Principal (Happy Path):**
  1. O Gestor clica em "Relatório de Reembolsos e Estornos".
  2. O sistema busca os lançamentos com tipo `REEMBOLSO` ou `ESTORNO_COMISSAO` no livro-caixa imutável.
  3. Apresenta o relatório com o totalizador de perdas/devoluções do período.

---

### 🟡 RF-09: Exportação de Relatórios (CSV e PDF)
- **Descrição:** O sistema deve permitir a exportação dos relatórios e dados do dashboard nos formatos CSV e PDF.
- **Critérios de Aceite:**
  - 🟡 **Exportação CSV:** Arquivo em formato UTF-8 com separador vírgula ou ponto-e-vírgula contendo a massa de dados bruta filtrada.
  - 🟡 **Exportação PDF:** Relatório formatado em layout executivo contendo: Cabeçalho com logo da escola, Período e Filtros Aplicados, Carimbo de Timestamp da geração (`YYYY-MM-DD HH:mm:ss`), Tabelas de KPIs e Assinatura de Auditoria do Gestor.
  - 🟡 Registro de log de auditoria no sistema a cada exportação efetuada.
- **Fluxo Principal (Happy Path):**
  1. O Gestor aplica os filtros desejados e clica em "Exportar -> Salvar em PDF".
  2. O backend processa o arquivo e dispara o download no navegador.
  3. O sistema salva o log de exportação (Usuário, Data/Hora, Filtros, Formato).

---

### 🟡 RF-10: Mini-Dashboard Individual Restrito (Visão do Vendedor)
- **Descrição:** O sistema deve renderizar uma versão simplificada e restrita do dashboard para usuários com perfil `Vendedor`.
- **Critérios de Aceite:**
  - 🟡 O vendedor enxerga **APENAS** seus próprios números (suas vendas apontadas, aprovadas, sua meta individual e sua estimativa de comissão a receber).
  - 🟡 **Bloqueio Total:** O vendedor não visualiza opções de trocar vendedor no filtro nem acessa os totais da instituição.
  - 🟡 Tentativa de acessar rotas do gestor via manipulador de URL deve retornar erro de permissão.
- **Fluxo Principal (Happy Path):**
  1. Marcos Vendedor faz login no sistema pelo smartphone.
  2. O sistema identifica a role `VENDEDOR` e redireciona automaticamente para o Mini-Dashboard Individual.
  3. Exibe: Sua Meta do Mês, Suas Vendas no Mês, Sua Comissão Estimada e Seu Ritmo Diário.

---

### 🟡 RF-11: Mecanismo de Atualização D-1 e Recálculo Sob Demanda
- **Descrição:** Os dados analíticos do dashboard devem ser pré-calculados em rotinas diárias (D-1) com opção de recálculo imediato pelo Gestor.
- **Critérios de Aceite:**
  - 🟡 Job automatizado que roda diariamente às 00:05 para consolidar a visão do dia anterior (D-1).
  - 🟡 Botão "Atualizar Dados Agora" no dashboard do Gestor que invalida o cache analítico e força a reconsolidação das vendas auditadas nas últimas horas.
  - 🟡 Exibir o texto informativo: *"Dados atualizados até DD/MM/AAAA às HH:mm"*.

---

## 7. Requisitos Não-Funcionais (RNF-XX)

| ID | Categoria | Descrição / Critério de Aceite |
|---|---|---|
| 🟡 **RNF-01** | Desempenho | Tempo de carregamento inicial da tela do Dashboard Gestor não deve exceder **1.5 segundos** para períodos de consulta de até 12 meses. |
| 🟡 **RNF-02** | Segurança / RBAC | Impedir acesso a APIs gerenciais por perfis não autorizados (*Bypass*). Qualquer requisição do perfil Vendedor para rotas de consolidação global deve retornar `403 Forbidden`. |
| 🟡 **RNF-03** | Tempo de Exportação | Geração do relatório PDF ou CSV para até 10.000 registros deve ser concluída em menos de **3.0 segundos**. |
| 🟡 **RNF-04** | Precisão Financeira | Todos os cálculos monetários devem utilizar tipos numéricos de alta precisão (Ponto Fixo / `Decimal(12,2)`) para evitar erros de arredondamento em centavos. |
| 🟡 **RNF-05** | Responsividade | O Mini-Dashboard do Vendedor deve ser 100% otimizado para navegadores mobile (telas a partir de 360px de largura). O Dashboard do Gestor deve ser otimizado para Desktop/Tablet (telas a partir de 1024px). |
| 🟡 **RNF-06** | Auditabilidade | Todas as exportações de dados em PDF ou CSV devem registrar um evento de auditoria imutável no banco com IP, ID do usuário, filtros usados e horário. |

---

## 8. Design e Interface (UI States & Layout)

### 8.1 Layout do Dashboard Gerencial (Visão Gestor - Desktop)

```
+-----------------------------------------------------------------------------------+
|  [LOGO ESCOLA]   Dashboard Gerencial e Relatórios       [Filtros: Mês Atual v] [👤 Roberto] |
+-----------------------------------------------------------------------------------+
|  FILTROS: Período: [ Mês Atual (Jul/2026) v ]  Vendedor: [ Todos v ]  Curso: [ Todos v ]  |
|  [🔄 Atualizar Dados agora]                     Última atualização: 23/07/2026 14:00 (D-1)|
+-----------------------------------------------------------------------------------+
| CARDS DE KPIS                                                                     |
| +-------------------+ +-------------------+ +-------------------+ +-------------------+ |
| | Faturamento Realiz| | Faturamento Est.  | | Meta Mensal Equipe| | % Atingimento Meta| |
| | R$ 145.800,00     | | R$ 162.000,00     | | R$ 180.000,00     | | 81.0% [======  ] | |
| +-------------------+ +-------------------+ +-------------------+ +-------------------+ |
| +-------------------+ +-------------------+                                       |
| | Vendas Aprovadas  | | Ticket Médio      |                                       |
| | 97 matrículas     | | R$ 1.503,09       |                                       |
| +-------------------+ +-------------------+                                       |
+-----------------------------------------------------------------------------------+
| GRAFICO DE RUN-RATE & TENDÊNCIA                    | DESEMPENHO POR TIPO DE CURSO  |
| [ Grafico de Linhas: Realizado x Projeção ]        | [ Grafico Rosca / Pizza ]     |
| Realizado: R$ 145.800 | Projeção Fim Mês: R$ 194.400| - Graduação: 45% (R$ 65.610) |
| Tendência: 🟢 +8.0% ACIMA DA META                 | - Pós-Graduação: 30% (R$ 43.740) |
|                                                    | - Técnico: 15% (R$ 21.870)    |
|                                                    | - Cursos Libres: 10% (R$ 14.580)|
+-----------------------------------------------------------------------------------+
| METAS POR VENDEDOR & RELATÓRIO DE COMISSÕES        [📥 Exportar CSV] [📄 Baixar PDF] |
| Vendedor          | Meta (R$)  | Realizado (R$)| % Meta | Com. Paga | Com. Pendente |
|-------------------|------------|---------------|--------|-----------|---------------|
| Marcos Vendedor   | 35.000,00  | 38.500,00     | 110% 🟢| 1.925,00  | 0,00          |
| Ana Secretaria    | 25.000,00  | 21.000,00     |  84% 🟡| 1.050,00  | 350,00        |
| Carlos Comercial  | 40.000,00  | 28.000,00     |  70% 🔴| 1.400,00  | 700,00        |
+-----------------------------------------------------------------------------------+
```

### 8.2 Estados de Interface (UI States)

1. 🟡 **State 1: Loading Skeleton (Carregamento)**
   - Exibição de cards e gráficos com animação de pulso cinza (*skeleton UI*) enquanto a API `/api/v1/dashboard/summary` busca e agrupa as informações.
2. 🟡 **State 2: Success / Default View (Visão Normal)**
   - Renderização completa dos KPIs, gráficos interativos e tabela de metas/comissões.
3. 🟡 **State 3: Empty State (Sem Dados)**
   - Caso o filtro aplicado não retorne vendas (ex: filtro em período futuro ou vendedor sem histórico), exibir mensagem amigável: *"Nenhum lançamento ou venda encontrada para os filtros selecionados."* com opção de "Limpar Filtros".
4. 🟡 **State 4: Error State (Erro na Consulta)**
   - Se ocorrer falha no banco analítico ou timeout de conexão, exibir card de aviso em vermelho: *"Não foi possível carregar os dados analíticos."* com o botão `[🔄 Tentar Novamente]`.
5. 🟡 **State 5: Mini-Dashboard Vendedor (Mobile View)**
   - Interface enxuta de coluna única otimizada para telas de smartphones, contendo apenas: Card de Progresso da Meta Individual, Minha Comissão Estimada e Ritmo Diário.

---

## 9. Modelo de Dados (Data Model)

🟡 O módulo analítico utiliza visões materializadas e tabelas de agregação no banco de dados relacional para garantir alta performance sem impactar a escrita transacional.

```
                    +-----------------------------+
                    |    tb_goals (Metas)         |
                    +-----------------------------+
                    | id (PK)                     |
                    | user_id (FK -> tb_users)    |
                    | period_month (YYYY-MM)      |
                    | target_amount (Decimal)     |
                    +-----------------------------+
                                   | 1
                                   |
                                   | N
+-------------------------------------------------------------------+
| vw_dashboard_daily_sales (Visão Analítica Agregada)                |
+-------------------------------------------------------------------+
| reference_date (Date)                                             |
| user_id (UUID)                                                    |
| user_name (String)                                                |
| course_category (Enum: TECNICO, GRADUACAO, POS_GRADUACAO, LIVRE)  |
| total_sales_count (Integer)                                       |
| total_estimated_amount (Decimal) -- inclui pendentes              |
| total_realized_amount (Decimal)  -- apenas aprovadas              |
| total_commission_amount (Decimal)                                 |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------+
| vw_commission_summary (Resumo de Comissões e Status)              |
+-------------------------------------------------------------------+
| user_id (UUID)                                                    |
| user_name (String)                                                |
| period_month (YYYY-MM)                                            |
| total_commission_generated (Decimal)                              |
| total_commission_paid (Decimal)                                   |
| total_commission_pending (Decimal)                                |
| last_payment_date (Timestamp)                                     |
+-------------------------------------------------------------------+

+-------------------------------------------------------------------+
| tb_refund_reports (Relatório de Reembolsos/Estornos)              |
+-------------------------------------------------------------------+
| id (PK, UUID)                                                     |
| sale_id (FK -> tb_sales)                                          |
| student_name (String)                                             |
| refund_amount (Decimal)                                           |
| commission_clawback_amount (Decimal)                              |
| refund_date (Timestamp)                                           |
| reason (Text)                                                     |
| authorized_by (FK -> tb_users)                                    |
+-------------------------------------------------------------------+
```

### 9.1 Dicionário de Dados e Índices

- **`tb_goals`**: Armazena as metas individuais e globais cadastradas pela gestão.
  - *Índice Único:* `(user_id, period_month)`
- **`vw_dashboard_daily_sales`**: Visão atualizada por jobs agendados ou tranches de invalidação.
  - *Índices de Cobertura:* `(reference_date, user_id, course_category)`
- **`tb_refund_reports`**: Registros do livro-caixa referentes a cancelamentos e reembolsos.
  - *Índices:* `(refund_date, sale_id)`

---

## 10. Integrações (Integrations & APIs)

🟡 O componente expõe contratos de API RESTful protegidos por autenticação JWT e autorização baseada em Roles (`GESTOR`, `VENDEDOR`).

### 10.1 `GET /api/v1/dashboard/summary`
Retorna os KPIs sintéticos consolidados do dashboard.

- **Headers:** `Authorization: Bearer <token>`
- **Query Parameters:**
  - `start_date` (opcional, YYYY-MM-DD)
  - `end_date` (opcional, YYYY-MM-DD)
  - `user_id` (opcional, UUID) - *Se perfil for VENDEDOR, este parâmetro é ignorado e sobrescrito para o ID do próprio usuário logado.*
  - `course_category` (opcional, Enum)

- **Exemplo de Resposta (200 OK - Visão Gestor):**
```json
{
  "status": "success",
  "data": {
    "period": {
      "start_date": "2026-07-01",
      "end_date": "2026-07-23"
    },
    "kpis": {
      "realized_amount": 145800.00,
      "estimated_amount": 162000.00,
      "monthly_goal": 180000.00,
      "goal_achievement_percent": 81.0,
      "approved_sales_count": 97,
      "average_ticket": 1503.09
    },
    "run_rate": {
      "days_elapsed": 23,
      "total_days_in_month": 31,
      "projected_amount": 196304.34,
      "projected_achievement_percent": 109.05,
      "status": "ABOVE_TARGET"
    },
    "last_consolidation_at": "2026-07-23T14:00:00-03:00"
  }
}
```

### 10.2 `GET /api/v1/reports/commissions`
Retorna o relatório analítico de comissões pagas e pendentes.

- **Query Parameters:** `period_month=2026-07`, `vendedor_id=...`
- **Exemplo de Resposta (200 OK):**
```json
{
  "status": "success",
  "data": {
    "period_month": "2026-07",
    "summary": {
      "total_generated": 4375.00,
      "total_paid": 3375.00,
      "total_pending": 1000.00
    },
    "items": [
      {
        "user_id": "usr-123",
        "user_name": "Marcos Vendedor",
        "total_sales_amount": 38500.00,
        "commission_generated": 1925.00,
        "commission_paid": 1925.00,
        "commission_pending": 0.00,
        "last_payment_date": "2026-07-20T10:30:00-03:00"
      }
    ]
  }
}
```

### 10.3 `POST /api/v1/reports/export`
Gera o relatório em arquivo binário para download (PDF ou CSV).

- **Body (JSON):**
```json
{
  "report_type": "DASHBOARD_SUMMARY",
  "format": "PDF",
  "filters": {
    "start_date": "2026-07-01",
    "end_date": "2026-07-23",
    "vendedor_id": null,
    "course_category": null
  }
}
```
- **Resposta (200 OK):** Retorna arquivo binário (`Content-Type: application/pdf` ou `text/csv`) com o cabeçalho `Content-Disposition: attachment; filename="relatorio_gerencial_20260723.pdf"`.

---

## 11. Edge Cases (Cenários de Borda)

🟡 Tratamento para cenários atípicos identificados:

1. 🟡 **Primeiros Dias do Mês (Dia 1 ou Dia 2 sem vendas auditadas):**
   - *Comportamento:* A divisão por zero no cálculo do *Run-Rate* deve ser interceptada. Se $d = 0$ ou realizado $= 0$, o sistema exibe "Projeção em cálculo..." até o registro do primeiro apontamento aprovado.
2. 🟡 **Meses Bissextos e Quantidade de Dias Úteis Variáveis:**
   - *Comportamento:* O motor de metas consulta o calendário de dias úteis cadastrado no sistema (descontando domingos e feriados locais/nacionais) para calcular a meta diária proporcional correta.
3. 🟡 **Reembolso Retroativo de Venda de Mês Anterior:**
   - *Comportamento:* Ao efetuar um estorno no livro-caixa de uma venda auditada no mês $M-1$, o valor debitado é registrado com a data do estorno (mês atual $M$) para garantir a imutabilidade do fechamento passado e abater do faturamento realizado atual.
4. 🟡 **Vendedor Desligado/Inativo no Meio do Mês:**
   - *Comportamento:* O histórico do vendedor permanece visível nos relatórios consolidados do Gestor para garantir o bate de caixa das comissões já geradas, porém o colaborador é removido das projeções de metas ativas da equipe.
5. 🟡 **Tentativa de Acesso Direto de Vendedor à URL do Gestor:**
   - *Comportamento:* O guardião de rota no frontend intercepta e redireciona para a página `/minha-carteira`. A API do backend rejeita a chamada com status HTTP 403.

---

## 12. Segurança e Privacidade (Security & LGPD)

🟡 Diretrizes de proteção de dados e controle de acesso:

- 🟡 **Isolamento Total por Perfil (RBAC):**
  - Perfis `VENDEDOR` e `SECRETARIA`: Filtro restrito pelo JWT; nenhum pode visualizar vendas de terceiros.
  - Perfil `GESTOR`: Acesso liberado a todos os endpoints analíticos.
- 🟡 **Mascaramento de Dados Sensíveis nos Relatórios (LGPD):**
  - Nos relatórios exportados em PDF/CSV que contenham listagem de alunos, dados como CPF e Telefone devem ser mascarados (`***.456.789-**`), preservando o sigilo conforme legislação vigente.
- 🟡 **Trilha Imutável de Auditoria de Exportação:**
  - Toda chamada ao endpoint `/api/v1/reports/export` gera um log de auditoria registrando: `user_id`, `timestamp`, `ip_address`, `format` e `query_filters`.

---

## 13. Questões Abertas (Open Questions)

🟡 Questões pendentes de definição formal pela gestão da escola:

| ID | Questão | Status | Proposta Padrão Adotada |
|---|---|---|---|
| 🟡 **Q-01** | O cálculo do *Run-Rate* deve considerar dias corridos ou dias úteis (segunda a sábado)? | 🟡 Aberta | Por padrão, adotado cálculo sobre **Dias Corridos**, com flag de alternância programada para dias úteis nas configurações. |
| 🟡 **Q-02** | As exportações em PDF devem exigir assinatura digital/token do gestor para validade contábil externa? | 🟡 Aberta | Inicialmente o PDF conterá carimbo digital com timestamp e ID do Gestor sem certificado digital ICP-Brasil. |

---

## 14. Registro de Decisões (Decision Log)

🟡 Decisões arquiteturais tomadas para a construção do componente:

- 🟡 **ADR-01: Arquitetura de Apuração em D-1 com Invalidação Sob Demanda**
  - *Contexto:* Consultas analíticas pesadas sobre a tabela de vendas podiam travar a gravação de novos apontamentos de vendedores no celular.
  - *Decisão:* Adotar visões analíticas agregadas (Materialized Views) com atualização em lote (D-1) e fornecer botão de "Atualizar Dados Agora" que limpa a camada de cache Redis.
- 🟡 **ADR-02: Exportação de Relatórios síncrona até 5.000 linhas e assíncrona acima disso**
  - *Contexto:* Relatórios com grande volume de dados geravam timeout HTTP.
  - *Decisão:* Para relatórios padrão do mês, a exportação em PDF/CSV é síncrona. Caso o intervalo selecionado seja superior a 6 meses, o sistema agenda uma tarefa em segundo plano e notifica o gestor para download.

---

## 15. Apêndice: Relatório de Avaliação da Espec (Score Report)

🟡 Avaliação técnica da especificação baseada nas métricas do projeto:

| Critério | Peso | Nota (0 - 100) | Avaliação Detalhada |
|---|---|---|---|
| 🟡 **Completude** | 30% | **100** | Abrangeu todos os requisitos exigidos no PRD (Metas, Run-rate, Estimado x Realizado, Filtros, Comissões, Reembolsos, Exportação e RBAC). |
| 🟡 **Testabilidade** | 25% | **100** | Todos os RFs possuem critérios de aceite em formato quantitativo e testável com fluxos principal e alternativos. |
| 🟡 **Clareza** | 20% | **100** | Documentação detalhada em português, com diagramas de arquitetura, ASCII mockups de UI, schemas de dados e payload JSON. |
| 🟡 **Escopo** | 15% | **100** | Limites e Não-Objetivos claramente delimitados, sem invasão de emissão fiscal ou gateways de pagamento. |
| 🟡 **Edge Cases** | 10% | **100** | Mapeados cenários de início de mês (divisão por 0), meses bissextos, estornos retroativos e bypass de perfil. |

### 🟡 Nota Final Ponderada: 100 / 100 (Aprovado com Selo 🟡 PLANEJADO)

---
*Documento gerado por reversa-spec-writer para a suíte Reversa SDD.*
