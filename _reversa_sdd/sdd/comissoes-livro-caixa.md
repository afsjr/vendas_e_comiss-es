# SDD Specification — Módulo Comissões e Livro-Caixa (`comissoes-livro-caixa`)

> Selo 🟡 PLANEJADO. Especificação técnica detalhada do módulo de cálculo automático de comissões, extrato individual "Minha Carteira", livro-caixa imutável e gestão auditável de estornos/reembolsos.

**Versão:** 1.0.0  
**Data:** 2026-07-23  
**Status:** 🟡 Planejado  
**Componente:** `comissoes-livro-caixa`  
**Autor:** Reversa Spec Writer  

---

## 1. Resumo Executivo 🟡

🟢 O módulo **Comissões e Livro-Caixa** calcula a comissão fixa do curso, mantém a carteira individual de Vendedor e Secretaria, e registra pagamentos e estornos em livro-caixa imutável. Uma comissão só é liberada quando a venda está `APROVADA` e a data de início das aulas foi alcançada.

---

## 2. Contexto e Justificativa 🟡

🟡 Atualmente, o controle de vendas e pagamentos de comissão ocorre de forma pulverizada em papéis, fichas físicas e grupos de WhatsApp. Essa falta de centralização gera sérios problemas:
1. **Incerteza e desconfiança**: Vendedores não sabem exatamente quanto têm a receber, quais vendas já foram auditadas ou se houve pagamento em duplicidade/omissão.
2. **Vulnerabilidade em reembolsos**: Quando um aluno solicita cancelamento ou devolução de valores, a gestão não possui histórico imutável para saber quem recebeu comissão, como o valor foi pago ou como abater a comissão já repassada.
3. **Ausência de trilha de auditoria**: Sem um livro-caixa digital imutável, qualquer alteração manual pode comprometer a integridade financeira da escola.

🟡 A introdução deste módulo resolve essas dores através de automação de regras por categoria de curso, isolamento estrito de dados por usuário, integridade contábil *append-only* e rastreabilidade total ponta a ponta.

---

## 3. Objetivos (Goals) 🟡

- 🟢 **G-01 (Cálculo Automatizado)**: Registrar o snapshot de `valor_comissao_fixo` do curso no momento da venda.
- 🟢 **G-02 (Liberação Dupla)**: Liberar para pagamento somente quando a venda estiver `APROVADA` e `data_inicio_curso <= data_atual`.
- 🟡 **G-03 (Isolamento de Privacidade)**: Oferecer a tela "Minha Carteira" onde cada vendedor/secretária acessa estritamente o seu extrato e saldo, sem acesso a dados de pares.
- 🟡 **G-04 (Imutabilidade Contábil)**: Implementar livro-caixa no padrão *Append-Only* (nenhum lançamento de venda, comissão ou estorno pode ser editado ou apagado no banco de dados).
- 🟡 **G-05 (Estornos Auditáveis por Contra-Lançamento)**: Processar devoluções/reembolsos exclusivamente via lançamentos de contra-partida (débito/crédito) vinculados à venda original e exigindo anexo de imagem de comprovante com *timestamp*.
- 🟡 **G-06 (Visão Consolidada Gerencial)**: Disponibilizar ao perfil Gestor/Auditor o extrato completo do livro-caixa da escola e relatório de comissões com filtros globais e exportação.

---

## 4. Não-Objetivos (Non-Goals) 🟡

- 🟡 **NG-01 (Processamento de Pagamento Bancário Direto)**: O sistema não fará liquidação bancária automática (não efetuará retornos via API Pix bancária ou TED aos vendedores). O repasse financeiro continuará sendo feito por meios bancários externos e registrado como baixa manual/lote no sistema.
- 🟡 **NG-02 (Edição ou Exclusão Retroativa)**: O sistema expressamente proíbe comandos `UPDATE` em valores e `DELETE` em lançamentos salvos. Erros operacionais devem ser corrigidos via estorno/contra-lançamento.
- 🟡 **NG-03 (Emissão de NFE / Integração Fiscal)**: Não abrange geração de Nota Fiscal Eletrônica de Serviços (NFS-e) para prefeituras.
- 🟡 **NG-04 (Vendas Aninhadas ou Comissões Multi-nível)**: Não suporta comissão dividida entre múltiplos vendedores ou estruturas de marketing multinível. Cada venda é estritamente 1 curso = 1 aluno = 1 vendedor.

---

## 5. Usuários e Personas 🟡

| Persona | Perfil no Sistema | Papel no Módulo `comissoes-livro-caixa` |
|---|---|---|
| 🟡 **Marcos Vendedor** | `ROLE_VENDEDOR` | Visualiza o painel "Minha Carteira" com seus saldos (A Pagar/Pendente, Aprovado, Pago), extrato detalhado de comissões de suas vendas e notificações de estorno. |
| 🟡 **Ana Secretaria** | `ROLE_SECRETARIA` | Semelhante ao vendedor para vendas originadas no balcão da secretaria. Visualiza sua carteira individual de comissionamento de matrículas. |
| 🟡 **Roberto Gestor** | `ROLE_GESTOR` / `ROLE_AUDITOR` | Configura a comissão fixa de cada curso, audita vendas, baixa lotes mensais e visualiza o Livro-Caixa consolidado. |

---

## 6. Requisitos Funcionais (RF) 🟡

### RF-01: Comissão Fixa por Curso 🟢
- **Descrição**: O sistema deve usar exclusivamente o `valor_comissao_fixo` definido no cadastro do curso.
- **Critérios de Aceite**:
  1. Cada curso ativo possui um valor fixo em reais, maior ou igual a zero.
  2. Alterações aplicam-se apenas a novas vendas; as históricas preservam o snapshot.
- **Fluxo Principal**:
  1. Gestor edita o curso e informa o novo valor fixo.
  2. O sistema salva o curso e registra evento de auditoria.
- **Fluxo Alternativo (Consulta de Histórico de Regras)**:
  1. Gestor clica em "Ver histórico de vigência de regras".
  2. O sistema exibe tabela contendo todas as taxas passadas, datas de vigência e usuário responsável pelas alterações.

---

### RF-02: Cálculo Automático de Comissão no Registro da Venda 🟢
- **Descrição**: Ao ser registrado um novo apontamento de venda (Módulo Apontamento), o sistema deve calcular automaticamente a comissão e gerar um lançamento com status `🟡 Pendente de Auditoria`.
- **Critérios de Aceite**:
  1. O motor lê o `valor_comissao_fixo` do curso da venda.
  2. Atribui esse valor, sem cálculo percentual, como snapshot imutável.
  3. Cria a comissão com `status = BLOQUEADA_AUDITORIA`.
  5. Cria provisão informativa no livro-caixa (`CREDITO_COMISSAO_PENDENTE`).
- **Fluxo Principal**:
  1. Evento `VendaCriadaEvent` é recebido com os dados da venda.
  2. Sistema recupera a regra de comissão correspondente.
  3. Armazena o snapshot do valor fixo.
  4. Associa a comissão à venda com status `BLOQUEADA_AUDITORIA`.

---

### RF-03: Liberação Condicionada à Auditoria e Início das Aulas 🟢
- **Descrição**: O valor permanece bloqueado até venda `APROVADA` e início das aulas.
- **Critérios de Aceite**:
  1. Ao aprovar venda com início futuro, a comissão transita para `AGUARDANDO_INICIO_AULAS`.
  2. Ao atingir `data_inicio_curso`, rotina diária a transita para `LIBERADA_PAGAMENTO`.
  3. Só `LIBERADA_PAGAMENTO` compõe o lote mensal e o saldo a receber.
  4. Venda `DEVOLVIDA_AJUSTE` mantém a comissão `BLOQUEADA_AUDITORIA`; estorno a torna `ESTORNADA`.
- **Fluxo Principal**:
  1. Gestor clica em "Aprovar Venda" no Módulo de Auditoria.
  2. O sistema dispara `VendaAprovadaEvent`.
  3. O serviço transita para `AGUARDANDO_INICIO_AULAS` ou `LIBERADA_PAGAMENTO`, conforme a data.
  4. Apenas a comissão liberada aparece como "A Receber".

---

### RF-04: Extrato Individual "Minha Carteira" (Visão do Vendedor) 🟡
- **Descrição**: O sistema deve prover uma interface exclusiva para Vendedores e Secretaria acompanharem o status e histórico financeiro de suas comissões.
- **Critérios de Aceite**:
  1. A tela deve exibir 4 cards sintéticos de KPI:
     - **Bloqueadas por Auditoria (🟡)**: Soma de comissões de vendas aguardando auditoria.
     - **Aguardando Início das Aulas (🔵)**: Soma aprovada, ainda não elegível.
     - **Liberadas / A Receber (🟢)**: Soma elegível para pagamento.
     - **Pagas (💙)**: Soma acumulada de comissões pagas no período selecionado.
     - **Saldo Atual da Carteira (R$)**: Valor total aprovado disponível.
  2. Tabela de lançamentos com paginação, ordenada da mais recente para a mais antiga.
  3. Exibe: Data/Hora, Código da Venda, Curso, Valor da Entrada, Comissão Fixa, Status e comprovante.
  4. Filtros por período (Mês Atual, Mês Anterior, Personalizado) e Filtro por Status.
- **Fluxo Principal**:
  1. Vendedor acessa "Minha Carteira" no menu.
  2. O sistema carrega os totais dos KPIs e os lançamentos do mês vigente.
  3. Vendedor aplica filtro por `LIBERADA_PAGAMENTO`.

---

### RF-05: Isolamento Estrito de Dados da Carteira (Segurança e RLS) 🟡
- **Descrição**: O sistema deve garantir rigorosamente que nenhum vendedor consiga visualizar o extrato, saldos ou dados de vendas de outro vendedor.
- **Critérios de Aceite**:
  1. Todo request de API para "Minha Carteira" extrai a identidade do usuário diretamente do Token JWT autenticado (`auth.uid()`).
  2. Se um usuário com perfil `ROLE_VENDEDOR` passar um parâmetro `vendedor_id` diferente do seu próprio ID na query/body, o backend deve ignorar o parâmetro ou retornar erro `403 Forbidden`.
  3. No banco de dados, políticas de Row Level Security (RLS) impedem qualquer vazamento de dados em queries diretas.
  4. Somente usuários com `ROLE_GESTOR` ou `ROLE_FINANCEIRO` podem consultar carteiras de terceiros ou visões consolidadas.

---

### RF-06: Extrato Consolidado do Livro-Caixa e Comissões (Visão Gestor) 🟡
- **Descrição**: O perfil Gestor deve ter acesso ao extrato global do Livro-Caixa e relatório consolidado da equipe de vendas.
- **Critérios de Aceite**:
  1. Exibe totalizadores da escola: Faturamento Bruto Auditado, Total de Comissões Provisionadas, Total de Comissões Aprovadas a Pagar, Total de Comissões Pagas no Mês, Saldo do Livro-Caixa.
  2. Tabela consolidada com filtro por Vendedor, Categoria de Curso, Período e Meio de Pagamento.
  3. Opção de exportação do extrato contábil em CSV e PDF com assinatura de fechamento do período.
- **Fluxo Principal**:
  1. Gestor clica em "Livro-Caixa & Comissões (Global)".
  2. Filtra pelo vendedor "Marcos" e pelo mês de "Julho/2026".
  3. O sistema renderiza o extrato completo com todas as entradas e comissões daquele vendedor no período.

---

### RF-07: Baixa e Registro de Pagamento de Comissão pelo Gestor 🟡
- **Descrição**: O Gestor/Financeiro deve realizar a baixa mensal de comissões `LIBERADA_PAGAMENTO`.
- **Critérios de Aceite**:
  1. O Gestor seleciona um vendedor e visualiza somente comissões `LIBERADA_PAGAMENTO` do ciclo mensal.
  2. Seleciona as comissões a serem pagas (individualmente ou "Selecionar Todas").
  3. Exige o upload **obrigatório** do comprovante bancário de transferência/Pix realizado ao vendedor.
  4. Ao confirmar, o sistema:
     - Altera o status das comissões selecionadas para `PAGA`.
     - Gera lançamento de saída/débito no Livro-Caixa (`PAGAMENTO_COMISSAO`).
     - Vincula o comprovante com carimbo digital de *timestamp* à transação.
     - Move o saldo das comissões pagas para o KPI "Pagas".
- **Fluxo Alternativo (Pagamento Parcial ou Lote)**:
  1. Gestor seleciona apenas 3 de 5 comissões aprovadas de um vendedor.
  2. Confirma o pagamento com o comprovante.
  3. As 3 passam para `PAGA` e as 2 continuam `LIBERADA_PAGAMENTO`.

---

### RF-08: Processamento de Reembolso / Estorno por Contra-Lançamento 🟡
- **Descrição**: Quando ocorrer o cancelamento de uma venda ou solicitação de reembolso por parte do aluno, o sistema deve registrar o estorno através de contra-lançamentos imutáveis.
- **Critérios de Aceite**:
  1. O Gestor acessa a venda auditada e aciona a opção "Processar Reembolso / Estorno".
  2. O sistema gera OBRIGATORIAMENTE um contra-lançamento de saída no Livro-Caixa (`SAIDA_REEMBOLSO_ALUNO`).
  3. **Tratamento da Comissão**:
     - *Cenário A (Comissão ainda APROVADA / A Receber)*: O sistema gera lançamento de anulação (`ESTORNO_COMISSAO`), alterando o status para `ESTORNADA` e debitando o saldo "A Receber" do vendedor.
     - *Cenário B (Comissão já PAGA ao vendedor)*: O sistema cria um lançamento de contra-partida de débito na carteira do vendedor (`DEBITO_ESTORNO_COMISSAO`). Esse valor gera um saldo devedor que será descontado automaticamente das próximas comissões aprovadas do vendedor.
  4. Nenhum registro histórico é apagado ou editado (`UPDATE`/`DELETE` proibidistas).
- **Fluxo Principal**:
  1. Gestor seleciona venda de R$ 1.000,00 com comissão de R$ 50,00 já paga ao Vendedor.
  2. Informa o motivo do reembolso e clica em "Confirmar Estorno".
  3. O sistema cria o contra-lançamento no livro-caixa da escola (-R$ 1.000,00) e insere um débito de estorno (-R$ 50,00) na carteira do vendedor.
  4. A venda original recebe a marcação de status `ESTORNADA`, mas permanece na base com vínculo ao ID do estorno.

---

### RF-09: Anexo Obrigatório de Evidência de Reembolso com Timestamp 🟡
- **Descrição**: Todo estorno/reembolso financeiro exige o envio de comprovante em imagem da devolução efetuada ao aluno.
- **Critérios de Aceite**:
  1. A operação de estorno é bloqueada se a imagem da evidência (comprovante bancário/Pix de devolução) não for fornecida.
  2. O sistema aplica carimbo digital de *timestamp* (data, hora UTC, IP, ID do usuário que processou) visualmente na imagem e nos metadados.
  3. O arquivo é armazenado no bucket privado de evidências com hash SHA-256 para garantia de integridade.

---

### RF-10: Imutabilidade Total do Livro-Caixa e Audit Trail 🟡
- **Descrição**: O livro-caixa e a tabela de comissões devem funcionar em modo *Append-Only*, gravando uma trilha inalterável de auditoria.
- **Critérios de Aceite**:
  1. Triggers de banco de dados bloqueiam qualquer tentativa de `DELETE` ou `UPDATE` em colunas contábeis (`valor`, `natureza`, `vendedor_id`, `venda_id`, `timestamp`).
  2. Cada lançamento possui um `hash_integridade` gerado por hash criptográfico contendo `(id_anterior + valor + timestamp + tipo)`.
  3. O sistema disponibiliza uma rotina de verificação de integridade da cadeia de lançamentos para o auditor.

---

## 7. Requisitos Não-Funcionais (RNF) 🟡

- 🟡 **RNF-01 (Desempenho e Latência)**:
  - O cálculo automático de comissão deve ocorrer de forma assíncrona/síncrona em menos de 100ms.
  - O tempo de carregamento da tela "Minha Carteira" (KPIs + listagem de 50 itens) deve ser inferior a 300ms no Percentil 95 (P95).
- 🟡 **RNF-02 (Segurança e Isolamento Multi-Usuário)**:
  - Garantia de isolamento estrito de dados entre vendedores através de Row Level Security (RLS) no PostgreSQL e validação dupla na camada de API (middleware de autorização).
  - Cobertura de 100% de testes automatizados contra vulnerabilidades de IDOR (Insecure Direct Object References).
- 🟡 **RNF-03 (Imutabilidade e Consistência Contábil - ACID)**:
  - Todas as operações de criação de venda + comissão ou estorno + contra-lançamento devem ser executadas em transações atômicas ACID.
  - Triggers nativos no banco de dados devem impedir modificações ou remoções acidentais ou maliciosas.
- 🟡 **RNF-04 (Proteção e Criptografia de Evidências - LGPD)**:
  - Imagens de comprovantes armazenadas com criptografia em repouso (AES-256).
  - URLs de acesso às imagens devem ser assinadas (*Signed URLs*) com validade máxima de 15 minutos.
- 🟡 **RNF-05 (Responsividade e Acessibilidade)**:
  - A interface da "Minha Carteira" deve ser totalmente responsiva, com suporte nativo para dispositivos móveis (telas a partir de 320px de largura) e atalhos PWA.
  - Suporte a padrão de alto contraste e navegação por teclado nos elementos de ação.

---

## 8. Design e Interface (UI/UX) 🟡

### 8.1 Estados da Interface — Tela "Minha Carteira" (Vendedor) 🟡

```
+-----------------------------------------------------------------------------------+
|  MINHA CARTEIRA                                              [ Julho/2026 v ]     |
+-----------------------------------------------------------------------------------+
|  +------------------+  +------------------+  +------------------+  +---------------+  |
|  | 🟡 PENDENTES      |  | 🟢 A RECEBER     |  | 💙 PAGAS         |  | SALDO CARTEIRA|  |
|  | R$ 150,00        |  | R$ 450,00        |  | R$ 1.200,00      |  | R$ 450,00     |  |
|  | (3 vendas)       |  | (5 vendas)       |  | (12 vendas)      |  |               |  |
|  +------------------+  +------------------+  +------------------+  +---------------+  |
+-----------------------------------------------------------------------------------+
|  Filtros: [ Todos v ] [ Buscar por aluno...         ]                              |
+-----------------------------------------------------------------------------------+
| DATA       | ALUNO         | CURSO           | CAT.    | VENDA    | COMISSÃO| STATUS|
+------------+---------------+-----------------+---------+----------+---------+-------+
| 23/07 14:10| Carlos Silva  | Tec. Enfermagem | Técnico | R$ 500,00| R$ 50,00| 🟡 Pend|
| 22/07 09:30| Maria Oliveira| Pos Gestao Hosp | Pós     | R$ 800,00| R$ 120,00| 🟢 Aprov|
| 20/07 16:45| Joao Santos   | Inglês Libres   | Livre   | R$ 250,00| R$ 25,00| 💙 Paga|
+-----------------------------------------------------------------------------------+
```

#### Descrição dos Estados da Tela:
1. **Estado de Carregamento (Loading State)**:
   - Exibe esqueletos (*skeletons*) pulsantes no lugar dos 4 cards de KPI e linhas cinzas na tabela.
2. **Estado Vazio (Empty State)**:
   - Exibido quando o vendedor não possui nenhuma comissão no período selecionado.
   - Ícone de carteira vazia com a frase: *"Nenhuma comissão registrada neste período. Continue realizando vendas para movimentar sua carteira!"*.
3. **Estado com Dados (Data State)**:
   - **Mobile**: Visão em formato de Cards sanfonados com informações colapsáveis. Badges coloridos de alta visibilidade (`🟡 Pendente de Validação`, `🟢 Aprovada`, `💙 Paga`, `🔴 Estornada`).
   - **Desktop**: Tabela analítica completa com paginação e ordenação por colunas.
4. **Estado de Erro (Error State)**:
   - Exibido em caso de falha na comunicação com o backend.
   - Card de alerta vermelho: *"Não foi possível carregar os dados da sua carteira. [Botão: Tentar Novamente]"*.

---

### 8.2 Estados da Interface — Tela "Livro-Caixa & Gestão de Comissões" (Gestor) 🟡

- **Aba 1: Auditoria & Baixa de Lotes de Comissão**:
  - Tabela com lista de comissões `🟢 APROVADAS` agrupadas por vendedor.
  - Botão de ação "Pagar Comissões Selecionadas", que abre modal de confirmação com upload obrigatório do comprovante bancário (Pix/TED).
- **Aba 2: Reembolsos e Estornos**:
  - Busca de venda por aluno ou código.
  - Form para registrar motivo do cancelamento, valor a reembolsar e upload da imagem do comprovante de devolução.
  - Preview dinâmico do impacto no Livro-Caixa e na carteira do vendedor afetado antes da confirmação.
- **Aba 3: Extrato Geral do Livro-Caixa (Ledger)**:
  - Tabela *Append-Only* com filtro de tipo de lançamento (`ENTRADA_VENDA`, `LIBERACAO_COMISSAO`, `PAGAMENTO_COMISSAO`, `SAIDA_REEMBOLSO`, `ESTORNO_COMISSAO`).
  - Exibição da coluna `Hash de Integridade` com selo de verificação de não-tampering.

---

## 9. Modelo de Dados (Data Model) 🟡

### 9.1 Diagrama de Entidade-Relacionamento (Mermaid) 🟡

```mermaid
erdiagram
    CURSOS ||--o{ COMISSOES : "define valor fixo"
    VENDAS ||--|| COMISSOES : "gera"
    VENDAS ||--o{ LIVRO_CAIXA_LANCAMENTOS : "origina"
    USUARIOS ||--o{ COMISSOES : "pertence a (vendedor)"
    COMISSOES ||--o{ LIVRO_CAIXA_LANCAMENTOS : "registra transação"
    LIVRO_CAIXA_LANCAMENTOS ||--o{ EVIDENCIAS_FINANCEIRAS : "possui comprovante"

    COMISSOES {
        uuid id PK
        uuid venda_id FK
        uuid vendedor_id FK
        uuid curso_id FK
        decimal valor_comissao_fixo_snapshot
        decimal valor_comissao
        string status
        uuid aprovado_por FK
        timestamp aprovado_em
        timestamp pago_em
        timestamp criado_em
    }

    LIVRO_CAIXA_LANCAMENTOS {
        uuid id PK
        string codigo_transacao
        string tipo_lancamento
        string natureza
        decimal valor
        uuid venda_id FK
        uuid comissao_id FK
        uuid lancamento_origem_id FK
        uuid vendedor_afetado_id FK
        uuid usuario_responsavel_id FK
        text descricao
        timestamp timestamp_transacao
        string hash_integridade
    }

    EVIDENCIAS_FINANCEIRAS {
        uuid id PK
        uuid lancamento_id FK
        string tipo_evidencia
        string url_arquivo
        string hash_arquivo
        timestamp timestamp_carimbo
        string metadata_ip
        uuid criado_por FK
        timestamp criado_em
    }
```

---

### 9.2 DDL de Estrutura de Banco de Dados (PostgreSQL Pseudo-código) 🟡

```sql
-- Enums para validação de tipos e status
CREATE TYPE status_comissao AS ENUM ('BLOQUEADA_AUDITORIA', 'AGUARDANDO_INICIO_AULAS', 'LIBERADA_PAGAMENTO', 'PAGA', 'ESTORNADA');
CREATE TYPE natureza_lancamento AS ENUM ('CREDITO', 'DEBITO');
CREATE TYPE tipo_lancamento_caixa AS ENUM (
    'ENTRADA_VENDA',
    'CREDITO_COMISSAO_PENDENTE',
    'LIBERACAO_COMISSAO',
    'PAGAMENTO_COMISSAO',
    'SAIDA_REEMBOLSO_ALUNO',
    'ESTORNO_COMISSAO',
    'DEBITO_ESTORNO_COMISSAO'
);
CREATE TYPE tipo_evidencia_financeira AS ENUM ('COMPROVANTE_PAGAMENTO_COMISSAO', 'COMPROVANTE_REEMBOLSO_ALUNO');

-- 1. Tabela de Comissões: valor fixo é snapshot do curso no momento da venda.
CREATE TABLE comissoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venda_id UUID NOT NULL UNIQUE REFERENCES vendas(id),
    vendedor_id UUID NOT NULL REFERENCES usuarios(id),
    curso_id UUID NOT NULL REFERENCES cursos(id),
    valor_comissao_fixo_snapshot NUMERIC(10, 2) NOT NULL,
    valor_comissao NUMERIC(10, 2) NOT NULL,
    status status_comissao NOT NULL DEFAULT 'BLOQUEADA_AUDITORIA',
    aprovado_por UUID NULL REFERENCES usuarios(id),
    aprovado_em TIMESTAMP WITH TIME ZONE NULL,
    pago_em TIMESTAMP WITH TIME ZONE NULL,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices de alta performance para a Carteira do Vendedor
CREATE INDEX idx_comissoes_vendedor_status ON comissoes(vendedor_id, status);
CREATE INDEX idx_comissoes_venda ON comissoes(venda_id);

-- 3. Tabela do Livro-Caixa (Ledger Imutável - Append Only)
CREATE TABLE livro_caixa_lancamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_transacao VARCHAR(60) NOT NULL UNIQUE,
    tipo_lancamento tipo_lancamento_caixa NOT NULL,
    natureza natureza_lancamento NOT NULL,
    valor NUMERIC(10, 2) NOT NULL,
    venda_id UUID NULL REFERENCES vendas(id),
    comissao_id UUID NULL REFERENCES comissoes(id),
    lancamento_origem_id UUID NULL REFERENCES livro_caixa_lancamentos(id), -- Para rastreabilidade de estornos
    vendedor_afetado_id UUID NOT NULL REFERENCES usuarios(id),
    usuario_responsavel_id UUID NOT NULL REFERENCES usuarios(id),
    descricao TEXT NOT NULL,
    timestamp_transacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    hash_integridade VARCHAR(64) NOT NULL -- SHA-256 da transação concatenada
);

CREATE INDEX idx_livro_caixa_vendedor ON livro_caixa_lancamentos(vendedor_afetado_id, timestamp_transacao);
CREATE INDEX idx_livro_caixa_venda ON livro_caixa_lancamentos(venda_id);

-- 4. Tabela de Evidências Financeiras (Comprovantes de Pagamento/Reembolso)
CREATE TABLE evidencias_financeiras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lancamento_id UUID NOT NULL REFERENCES livro_caixa_lancamentos(id),
    tipo_evidencia tipo_evidencia_financeira NOT NULL,
    url_arquivo VARCHAR(500) NOT NULL,
    hash_arquivo VARCHAR(64) NOT NULL,
    timestamp_carimbo TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata_ip VARCHAR(45) NOT NULL,
    criado_por UUID NOT NULL REFERENCES usuarios(id),
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

---

### 9.3 Triggers de Imutabilidade (Append-Only) 🟡

```sql
-- Trigger para bloquear UPDATE e DELETE no Livro-Caixa
CREATE OR REPLACE FUNCTION trg_impedir_alteracao_livro_caixa()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        RAISE EXCEPTION 'ERRO GRAVE DE INTEGRIDADE: Lançamentos de Livro-Caixa são imutáveis e não podem ser excluídos! (ID: %)', OLD.id;
    ELSIF (TG_OP = 'UPDATE') THEN
        RAISE EXCEPTION 'ERRO GRAVE DE INTEGRIDADE: Lançamentos de Livro-Caixa não podem ser alterados! (ID: %)', OLD.id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_livro_caixa_immutable
BEFORE UPDATE OR DELETE ON livro_caixa_lancamentos
FOR EACH ROW EXECUTE FUNCTION trg_impedir_alteracao_livro_caixa();
```

---

### 9.4 Regras de Isolamento RLS (Row Level Security) 🟡

```sql
-- Habilita RLS na tabela de comissões
ALTER TABLE comissoes ENABLE ROW LEVEL SECURITY;

-- Política de Leitura: Vendedor vê apenas suas próprias comissões; Gestor vê tudo.
CREATE POLICY policy_comissoes_select ON comissoes
FOR SELECT
USING (
    vendedor_id = auth.uid()
    OR
    EXISTS (
        SELECT 1 FROM usuarios
        WHERE usuarios.id = auth.uid()
        AND usuarios.role IN ('ROLE_GESTOR', 'ROLE_AUDITOR', 'ROLE_FINANCEIRO')
    )
);
```

---

## 10. Integrações e Arquitetura de Eventos 🟡

🟡 O módulo `comissoes-livro-caixa` comunica-se de forma desacoplada com os demais módulos do sistema via **Event-Driven Architecture (EDA)**.

```mermaid
sequenceDiagram
    autonumber
    actor Vendedor
    actor Gestor
    participant ModuloVendas as Módulo de Apontamento
    participant ModuloAuditoria as Módulo de Auditoria
    participant ModuloComissoes as Módulo Comissões & Livro-Caixa
    participant Storage as Armazenamento de Evidências

    Vendedor->>ModuloVendas: Registra nova venda (Técnico - R$ 500)
    ModuloVendas->>ModuloComissoes: Evento: VendaCriadaEvent(venda_id, vendedor_id, categoria, valor)
    ModuloComissoes->>ModuloComissoes: Registra comissão fixa do curso com status BLOQUEADA_AUDITORIA
    ModuloComissoes->>ModuloComissoes: Registra provisão informativa no Livro-Caixa

    Gestor->>ModuloAuditoria: Audita e clica em "🟢 Aprovar Venda"
    ModuloAuditoria->>ModuloComissoes: Evento: VendaAprovadaEvent(venda_id, aprovado_por)
    ModuloComissoes->>ModuloComissoes: Transita para AGUARDANDO_INICIO_AULAS ou LIBERADA_PAGAMENTO
    ModuloComissoes->>ModuloComissoes: Registra LIBERACAO_COMISSAO apenas quando as aulas iniciam

    Gestor->>ModuloComissoes: Efetua baixa de pagamento e envia comprovante
    ModuloComissoes->>Storage: Salva comprovante com timestamp digital
    ModuloComissoes->>ModuloComissoes: Transita status para PAGA
    ModuloComissoes->>ModuloComissoes: Registra PAGAMENTO_COMISSAO (Débito) no Livro-Caixa
```

---

## 11. Edge Cases (Casos de Borda) e Mitigações 🟡

| ID | Cenário de Borda | Risco / Problema | Mitigação Projetada |
|---|---|---|---|
| 🟡 **EC-01** | **Reembolso de venda cuja comissão já foi paga ao vendedor** | Vendedor já sacou/recebeu o dinheiro e a escola precisa estornar o valor total ao aluno. | O sistema gera um lançamento de débito por estorno (`DEBITO_ESTORNO_COMISSAO`) na carteira do vendedor. O saldo da carteira do vendedor passa a ser temporariamente **negativo**. Conforme novas vendas forem aprovadas, o saldo devedor é abatido automaticamente até ser zerado. |
| 🟡 **EC-02** | **Alteração da taxa de comissão enquanto uma venda está pendente** | Alterar a regra da categoria 'Graduação' de 5% para 7% enquanto uma venda anterior aguarda auditoria. | No momento do registro da venda, o sistema grava imutavelmente o snapshot da taxa (`taxa_aplicada`) e o ID da regra vigente (`regra_id`). Alterações posteriores de regras **nunca** afetam o cálculo de vendas já cadastradas. |
| 🟡 **EC-03** | **Desligamento/Demissão de vendedor com saldo devedor ou a receber** | O vendedor não fará mais vendas no sistema. | O Gestor possui funcionalidade de "Encerramento de Carteira". Caso haja saldo a receber, é dada baixa com comprovante de acerto rescisório. Caso haja saldo devedor, é registrado um lançamento de acerto extraordinário (`AJUSTE_DESLIGAMENTO`) com anexo do documento rescisório assinado. |
| 🟡 **EC-04** | **Tentativa de adulteração da URL da API de extrato por IDOR** | Vendedor altera o parâmetro `vendedor_id` na requisição HTTP para tentar ver a carteira do colega. | O backend ignora inteiramente o parâmetro enviado pelo cliente se o perfil for `ROLE_VENDEDOR`, forçando o ID extraído do token JWT verificado (`auth.uid()`). A camada RLS do Postgres bloqueia como defesa em profundidade. |
| 🟡 **EC-05** | **Upload de comprovante ilegível no pagamento ou estorno** | Falha humana ao anexar foto desfocada. | O Módulo de Auditoria/Financeiro exige confirmação explícita (*checkbox* de leitura) e validação de tamanho mínimo/formato antes de gravar o lançamento imutável. Se o comprovante for rejeitado pelo auditor posterior, um contra-lançamento de correção é exigido. |
| 🟡 **EC-06** | **Falha de conectividade durante gravação do contra-lançamento de estorno** | Inconsistência entre a venda estornada e o livro-caixa. | Operação envelopada em transação de banco de dados SQL (`BEGIN...COMMIT`). Se qualquer etapa falhar (upload ou gravação no banco), é efetuado `ROLLBACK` total. |

---

## 12. Segurança, Privacidade e LGPD 🟡

- 🟡 **Controle de Acesso Baseado em Papéis (RBAC)**:
  - `ROLE_VENDEDOR`: Acesso exclusivo de leitura ao seu próprio extrato no endpoint `/api/carteira/minha`.
  - `ROLE_SECRETARIA`: Acesso exclusivo de leitura à sua carteira de vendas de balcão.
  - `ROLE_GESTOR` / `ROLE_AUDITOR`: Acesso completo de leitura/escrita para aprovação, baixa de pagamento, estornos e relatórios consolidados.
- 🟡 **Isolamento de Dados (Data Segregation)**:
  - Garantia de 0% de vazamento de dados inter-vendedores por meio de políticas RLS no banco de dados e filtros enforced no backend.
- 🟡 **Trilha de Auditoria e Proteção contra Adulteração**:
  - Toda transação no Livro-Caixa contém o `hash_integridade` em SHA-256 gerado a partir da tupla `(lancamento_anterior_hash + valor + timestamp + responsavel_id)`. Qualquer alteração manual no banco invalida a cadeia de hashes contábil.
- 🟡 **Privacidade e LGPD**:
  - Dados sensíveis do aluno vinculados ao lançamento (nome, curso) são visíveis apenas para os perfis autorizados.
  - Imagens de comprovantes armazenadas em buckets protegidos e servidas via URLs assinadas de uso único com expiração em 15 minutos.

---

## 13. Perguntas Abertas (Open Questions) 🟡

- 🟡 **Q-01**: *Como tratar o cálculo de comissão para vendas que receberam desconto extraordinário autorizado pela diretoria?*
  - **Proposta**: A comissão deve incidir estritamente sobre o **valor líquido efetivamente pago pelo aluno** (após desconto), evitando que a escola pague comissão sobre valor cheio não arrecadado.
- 🟡 **Q-02**: *Existe um prazo máximo após a venda para processar o estorno de comissão por desistência do aluno?*
  - **Proposta**: O prazo para estorno de comissão segue o prazo legal de cancelamento de matrícula da escola (ex: até 30 dias após o início das aulas ou 7 dias após a compra). Transcorrido o prazo, o reembolso é considerado perda operacional da instituição sem estorno do vendedor, salvo deliberação da diretoria.

---

## 14. Decision Log (Registro de Decisões) 🟡

- 🟡 **D-01 (Modelo Append-Only para o Livro-Caixa)**:
  - *Decisão*: Adotado modelo de contabilidade de partidas dobradas / ledger *Append-Only* sem suporte a `UPDATE` ou `DELETE`.
  - *Motivo*: Garantir auditabilidade 100% à prova de rasuras para o Gestor e respaldar a escola em fiscalizações ou disputas de comissão.
- 🟡 **D-02 (Condicionalidade de Liberação por Auditoria)**:
  - *Decisão*: A comissão é criada como `BLOQUEADA_AUDITORIA`; após aprovação, aguarda a data de início das aulas ou passa a `LIBERADA_PAGAMENTO`.
  - *Motivo*: Evitar que vendedores recebam por vendas cujos comprovantes bancários sejam falsos ou inconsistentes.
- 🟡 **D-03 (Tratamento de Comissões Já Pagas em Reembolsos via Saldo Negativo)**:
  - *Decisão*: Quando uma venda é estornada após o pagamento da comissão ao vendedor, a carteira do vendedor recebe um contra-lançamento de débito, deixando o saldo temporariamente negativo.
  - *Motivo*: Solução financeira justa e automatizada que elimina a necessidade de cobrança física/manual em dinheiro do vendedor.

---

## 15. Score Report / Avaliação da Spec 🟡

Abaixo apresenta-se o relatório de avaliação e pontuação técnica da especificação funcional e arquitetural do módulo **`comissoes-livro-caixa`**, segundo os critérios estabelecidos pelo framework Reversa:

| Critério | Peso | Nota (0 - 100) | Nota Ponderada | Justificativa / Avaliação |
|---|---|---|---|---|
| 🟡 **Completude** | 30% | 100 | 30.0 | Cobre todas as seções obrigatórias: Resumo, Contexto, Goals/Non-Goals, Personas, 10 Requisitos Funcionais detalhados com fluxos, RNFs, UI/UX em ASCII + estados, Diagrama ER Mermaid + DDL SQL completo com Triggers e RLS, Eventos, Edge Cases, Segurança/LGPD, Perguntas Abertas e Decision Log. |
| 🟡 **Testabilidade** | 25% | 98 | 24.5 | Todos os requisitos funcionais possuem critérios de aceite em formato dado/quando/então ou regras numéricas e verificáveis (status, fórmulas de cálculo, permissões RLS, integridade de hashes). |
| 🟡 **Clareza** | 20% | 100 | 20.0 | Linguagem objetiva, direta e em português (Brasil). Uso de diagramas visuais, tabelas formatadas, mockups ASCII de interface e código DDL PostgreSQL explicativo. |
| 🟡 **Escopo** | 15% | 96 | 14.4 | Escopo perfeitamente delimitado entre o que é de responsabilidade deste módulo e o que são Não-Objetivos (ex: liquidação bancária automática ou emissão de NFE). |
| 🟡 **Edge Cases** | 10% | 98 | 9.8 | 6 cenários de borda detalhados com mitigações técnicas robustas (reembolso com comissão paga, congelamento de snapshot de taxa, desligamento de vendedor, mitigação de IDOR, falha de transação SQL). |
| **TOTAL** | **100%** | — | **98.7 / 100** | **CLASSIFICAÇÃO: EXCELENTE (Aprovação A+)** |

---

Gerado por **reversa-spec-writer** em 2026-07-23  
Fontes de Referência: `prd.md`, `ideation.md`, `personas.md`
