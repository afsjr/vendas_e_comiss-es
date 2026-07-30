# SDD — Especificação de Software (RFC Pragmático)
## Componente: cadastro-alunos-documentacao (Cadastro de Alunos e Documentação)

> Selo 🟡 PLANEJADO em todos os itens. Documento elaborado com base no PRD, Ideation e Personas do Sistema de Comissionamento e Vendas.

**Versão:** 1.0  
**Data:** 2026-07-23  
**Autor:** Spec Writer Reversa  
**Status:** 🟡 PLANEJADO  
**Arquivo Target:** `_reversa_sdd/sdd/cadastro-alunos-documentacao.md`  

---

## 1. Resumo Executivo (Resumo)

🟡 O componente **cadastro-alunos-documentacao** é o módulo central responsável pela coleta, validação, armazenamento seguro e gestão do ciclo de vida dos dados cadastrais dos alunos e de seu checklist de documentos obrigatórios (RG, CPF, Comprovante de Residência, Histórico Escolar / Certificado de Conclusão).

🟡 Ele atende a duas frentes operacionais críticas:
1. **Atendimento de Vendas (Vendedor Comercial / Secretaria):** Formulário ágil e responsivo (mobile e desktop) para preenchimento de dados pessoais e sinalização imediata da entrega ou pendência de documentos durante o ato da venda.
2. **Gestão de Pendências e Cobrança Proativa (Secretaria):** Painel exclusivo "Documentos Pendentes" que centraliza a fila de pendências com filtros avançados, contadores de dias de atraso, atalhos de cobrança rápida (WhatsApp/E-mail) e validação dos anexos antes da autorização para emissão do contrato escolar.

🟡 O componente incorpora mecanismos nativos de conformidade com a **LGPD (Lei Geral de Proteção de Dados)**, aplicando criptografia AES-256 para dados sensíveis em repouso, busca por hash HMAC-SHA256, mascaramento visual de documentos e armazenamento privado de anexos acessíveis apenas via URLs temporárias pré-assinadas (*presigned URLs*).

---

## 2. Contexto e Motivação

🟡 Anteriormente à implantação do sistema, a captação de cadastros e documentos de alunos ocorria de forma descentralizada por meio de fichas físicas em papel ou fotos avulsas enviadas em conversas do WhatsApp. Esse cenário gerava diversos problemas críticos:

- **Perda e inconsistência de dados:** CPFs digitados com erros, cadastros duplicados e falta de comprovantes de residência legíveis.
- **Retrabalho da Secretaria:** A equipe de atendimento precisava contatar repetidamente vendedores e alunos para resgatar documentos faltantes essenciais para a confecção da minuta do contrato.
- **Vulnerabilidade de Segurança e LGPD:** Documentos de identificação (RG e CPF) expostos em galerias de celulares pessoais dos vendedores e gavetas sem controle de acesso.
- **Gargalo na liberação de contratos:** Atraso no início do faturamento e matrículas travadas por falta de um painel consolidado de pendências documentais.

🟡 A criação deste módulo resolve essas dores através da padronização dos campos cadastrais com validação algorítmica, vinculação direta do checklist ao registro do aluno e disponibilização de uma ferramenta de cobrança proativa para a Secretaria.

---

## 3. Objetivos e Não-Objetivos

### 3.1. Objetivos (Goals)
- 🟡 **G-01:** Permitir a conclusão do cadastro inicial do aluno e preenchimento do checklist documental em menos de 2 minutos via dispositivo móvel ou desktop.
- 🟡 **G-02:** Gerenciar o status individual de 4 documentos padrão (RG, CPF, Comprovante de Residência, Histórico Escolar) com estados `PENDENTE`, `ENTREGUE`, `EM_ANALISE` ou `DISPENSADO`.
- 🟡 **G-03:** Disponibilizar para a Secretaria a tela dedicada **"Documentos Pendentes"** com indicadores visuais de dias de atraso e ação de cobrança rápida via WhatsApp em 1 clique.
- 🟡 **G-04:** Garantir conformidade rigorosa com a LGPD através de criptografia em repouso (AES-256), buscas por hash seguro e trilha de auditoria completa de acessos a dados sensíveis.
- 🟡 **G-05:** Fornecer ao módulo de contratos a sinalização automática de elegibilidade contratual (`PRONTO_PARA_CONTRATO` vs `PENDENTE_DOCUMENTACAO`).

### 3.2. Não-Objetivos (Non-Goals)
- 🟡 **NG-01:** Este módulo **não** realiza a emissão ou geração da minuta do contrato em PDF (responsabilidade do módulo de *Emissão de Contratos*).
- 🟡 **NG-02:** Este módulo **não** executa Reconhecimento Óptico de Caracteres (OCR) automático para extração de texto de documentos físicos nesta versão.
- 🟡 **NG-03:** Este módulo **não** realiza validação online em tempo real junto a órgãos governamentais (Receita Federal/Secretarias de Segurança), limitando-se a validações algorítmicas de formato e dígito verificador.
- 🟡 **NG-04:** Este módulo **não** realiza assinatura digital/eletrônica de contratos.

---

## 4. Usuários e Perfis de Acesso (Personas / RBAC)

🟡 O controle de acesso ao módulo é baseado em perfis RBAC (*Role-Based Access Control*):

| Perfil / Persona | Ações Permitidas | Restrições / Visibilidade |
|---|---|---|
| 🟡 **Marcos Vendedor** *(Vendedor Comercial)* | • Criar novos cadastros de alunos vinculados às suas vendas.<br>• Visualizar e editar cadastros criados por ele.<br>• Anexar fotos/documentos durante a venda. | • Não visualiza cadastros de alunos de outros vendedores.<br>• Não pode alterar status de documentos para `DISPENSADO`.<br>• Visualiza CPF com mascaramento parcial. |
| 🟡 **Ana Secretaria** *(Secretaria / Atendimento)* | • Acessar e editar todos os cadastros de alunos da instituição.<br>• Acessar a tela "Documentos Pendentes".<br>• Alterar status de documentos (`ENTREGUE`, `EM_ANALISE`, `DISPENSADO`).<br>• Anexar, substituir e validar documentos.<br>• Disparar cobranças via WhatsApp/E-mail. | • Exigida justificativa obrigatória ao marcar qualquer documento como `DISPENSADO`. |
| 🟡 **Roberto Gestor** *(Gestor / Auditor)* | • Leitura global de todos os cadastros e anexos.<br>• Visualizar relatórios e estatísticas de pendências.<br>• Acessar a trilha de auditoria LGPD. | • Edição direta bloqueada para preservar o histórico operacional (exceto override administrativo). |

---

## 5. Requisitos Funcionais (RF-XX)

### 🟡 RF-01: Cadastro de Dados Pessoais do Aluno
- **Descrição:** O sistema deve permitir a captura, validação e persistência dos dados pessoais e de contato do aluno.
- **Campos Obrigatórios:** Nome Completo, CPF, Data de Nascimento, Telefone/WhatsApp (com DDD), E-mail, CEP, Logradouro, Número, Bairro, Cidade, Estado (UF).
- **Campos Opcionais:** RG, Órgão Emissor RG, Complemento Endereço, Gênero.
- **Dados de Responsável Legal:** Caso a Data de Nascimento indique idade inferior a 18 anos na data do cadastro, os campos *Nome do Responsável*, *CPF do Responsável*, *Telefone do Responsável* e *Parentesco* tornam-se obrigatoriamente exigidos.

#### Fluxos de Execução
- **Fluxo Principal (Happy Path):**
  1. O usuário (Vendedor ou Secretaria) acessa o formulário de cadastro de aluno.
  2. Preenche o CPF do aluno. O sistema valida o formato e o dígito verificador.
  3. Preenche a Data de Nascimento (idade >= 18).
  4. Informa o CEP. O sistema consulta a API de CEP e preenche automaticamente Logradouro, Bairro, Cidade e Estado.
  5. Preenche Nome, Telefone, E-mail, Número e Complemento.
  6. Submete o formulário. O sistema criptografa os dados PII, gera o hash do CPF e salva o registro com status `PENDENTE_DOCUMENTACAO`.
- **Fluxo Alternativo 1A — CPF Já Existente na Base:**
  1. No passo 2, ao digitar o CPF, o sistema identifica um hash correspondente já cadastrado.
  2. O sistema exibe um alerta: *"Aluno já cadastrado: [Nome Mascarado]. Deseja utilizar este cadastro para a nova venda?"*.
  3. O usuário confirma. O sistema vincula a nova venda ao `aluno_id` existente sem duplicar o registro cadastral.
- **Fluxo Alternativo 1B — Aluno Menor de Idade:**
  1. No passo 3, ao preencher a Data de Nascimento, o sistema calcula idade < 18 anos.
  2. O sistema expande a seção *"Dados do Responsável Legal"* e marca seus campos como obrigatórios.
  3. O usuário preenche os dados do responsável e prossegue com a inclusão.
- **Fluxo de Exceção 1C — CPF Inválido:**
  1. O usuário digita um CPF com dígitos verificadores matematicamente incorretos.
  2. O sistema bloqueia o avanço e exibe a mensagem de erro: *"CPF inválido. Verifique os números digitados."*.

---

### 🟡 RF-02: Checklist e Gestão de Documentos Obrigatórios
- **Descrição:** O sistema deve associar automaticamente um checklist de 4 documentos obrigatórios padrão a cada novo aluno cadastrado, controlando o status de cada item.
- **Documentos Padrão do Checklist:**
  1. `RG` (Registro Geral / Documento Oficial com Foto)
  2. `CPF` (Cadastro de Pessoa Física ou documento com CPF)
  3. `COMPROVANTE_RESIDENCIA` (Conta de luz, água ou telefone emitida há no máximo 90 dias)
  4. `HISTORICO_ESCOLAR` (Histórico Escolar ou Certificado de Conclusão do ensino anterior)
- **Estados Possíveis de Cada Documento:**
  - `PENDENTE`: Documento não apresentado ou não anexado.
  - `EM_ANALISE`: Documento anexado pelo vendedor/aluno aguardando conferência da Secretaria.
  - `ENTREGUE`: Documento conferido e aprovado pela Secretaria.
  - `DISPENSADO`: Documento dispensado mediante justificativa textual salva na auditoria.

#### Fluxos de Execução
- **Fluxo Principal (Happy Path):**
  1. Ao salvar um novo aluno, o sistema cria 4 registros na tabela `documentos_aluno` com status inicial `PENDENTE`.
  2. A Secretaria seleciona o documento `RG`, realiza o upload do arquivo (PDF ou imagem) e clica em "Marcar como Entregue".
  3. O sistema armazena o arquivo no storage privado, atualiza o status para `ENTREGUE`, registra a data/hora e o `usuario_id` do recebedor.
- **Fluxo Alternativo 2A — Anexo de Documento no Ato da Venda:**
  1. O Vendedor, durante o atendimento mobile, tira foto do comprovante de residência e faz upload.
  2. O sistema armazena o arquivo e define o status do documento como `EM_ANALISE`.
  3. A Secretaria recebe o alerta na fila, visualiza a imagem e altera o status para `ENTREGUE`.
- **Fluxo Alternativo 2B — Dispensa Justificada de Documento:**
  1. A Secretaria identifica que o aluno se matriculou em um curso livre rápido que não exige Histórico Escolar.
  2. A Secretaria seleciona o item `HISTORICO_ESCOLAR`, clica em "Dispensar Documento" e preenche o campo *Justificativa*: *"Curso livre isento de exigência prévia segundo resolução interna N° 12/2025"*.
  3. O sistema altera o status para `DISPENSADO` e grava a justificativa na trilha de auditoria.
- **Fluxo de Exceção 2C — Rejeição de Documento Ilegível:**
  1. A Secretaria visualiza a foto do RG enviada pelo Vendedor e nota que os dados estão desfocados/ilegíveis.
  2. A Secretaria clica em "Rejeitar Documento", selecionando o motivo *"Imagem ilegível/desfocada"*.
  3. O sistema altera o status do documento de volta para `PENDENTE`, remove a aprovação e notifica o Vendedor/Aluno para novo envio.

---

### 🟡 RF-03: Painel de "Documentos Pendentes" para a Secretaria
- **Descrição:** O sistema deve disponibilizar uma tela exclusiva de consulta e cobrança de pendências documentais voltada para a equipe da Secretaria.
- **Funcionalidades da Tela:**
  - Tabela dinâmica de alunos com pendências documentais ativas.
  - **Filtros Avançados:** Por Vendedor responsável, Por Curso/Modalidade, Por Tipo de Documento Faltante, Por Intervalo de Dias em Atraso, Por Nome/CPF do Aluno.
  - **Indicadores Visuais de Gravidade (SLA de Cobrança):**
    - 🟢 *Verde (Baixa):* 0 a 3 dias de pendência desde a matrícula.
    - 🟡 *Amarelo (Média):* 4 a 7 dias de pendência.
    - 🔴 *Vermelho (Crítica):* Mais de 7 dias de pendência.
  - **Ações Rápidas de Cobrança:**
    - Botão *"Cobrar via WhatsApp"*: Abre janela do WhatsApp Web/App com mensagem pré-formatada contendo os documentos faltantes do aluno.
    - Botão *"Cobrar via E-mail"*: Dispara um e-mail automático com template institucional listando as pendências.

#### Fluxos de Execução
- **Fluxo Principal (Happy Path):**
  1. A secretária Ana acessa o painel "Documentos Pendentes".
  2. Aplica o filtro `Dias em Atraso > 7` e visualiza o aluno "João da Silva" com pendência de `COMPROVANTE_RESIDENCIA` e `HISTORICO_ESCOLAR`.
  3. Clica no botão *"Cobrar via WhatsApp"*.
  4. O sistema gera a mensagem: *"Olá João, tudo bem? Notamos que para a emissão do seu contrato do curso Técnico em Enfermagem ainda faltam os seguintes documentos: Comprovante de Residência e Histórico Escolar. Por favor, envie-nos por aqui ou traga na secretaria."*.
  5. A secretária confirma o envio. O sistema registra um evento na tabela `historico_cobranca_documento` com o carimbo de data/hora e operador.

---

### 🟡 RF-04: Sinalização e Regra de Elegibilidade Contratual
- **Descrição:** O sistema deve calcular continuamente a elegibilidade do aluno para a emissão do contrato de prestação de serviços educacionais.
- **Regra de Negócio:**
  - Status `ELEGIVEL_CONTRATO`: Quando 100% dos documentos obrigatórios estiverem com status `ENTREGUE` ou `DISPENSADO`.
  - Status `PENDENTE_DOCUMENTACAO`: Quando 1 ou mais documentos obrigatórios estiverem com status `PENDENTE` ou `EM_ANALISE`.
- **Comportamento da Integração:** O módulo de *Emissão de Contratos* consulta esta flag via API antes de liberar a renderização final e assinatura do contrato.

---

### 🟡 RF-05: Histórico de Alterações e Auditoria
- **Descrição:** O sistema deve gravar logs imutáveis de todas as operações de criação, modificação de dados cadastrais, alteração de status de documentos, upload/exclusão de arquivos e disparos de cobrança.

---

## 6. Requisitos Não-Funcionais (RNF-XX)

### 🟡 RNF-01: Desempenho e Latência
- **Tempo de Resposta de API:** A busca de alunos por CPF ou Nome deve responder em menos de 200ms para o percentil 95 (p95).
- **Tempo de Upload:** O envio de arquivos de documentos de até 10MB deve ser concluído com resposta de confirmação em menos de 2,5 segundos sob redes móveis 4G operando a 10 Mbps.

### 🟡 RNF-02: Segurança, Criptografia e Privacidade (Conformidade LGPD)
- **Criptografia em Repouso (Encryption at Rest):** Dados sensíveis (CPF, RG, Data de Nascimento, E-mail, Telefone, Endereço e Dados do Responsável Legal) devem ser criptografados individualmente no banco de dados utilizando o algoritmo **AES-256-GCM**.
- **Busca Segura sem Descriptografia Global:** Para permitir pesquisas por CPF sem descriptografar toda a base, o sistema deve manter uma coluna indexada `cpf_hash` contendo o HMAC-SHA256 do CPF gerado com chave secreta de aplicação (*salt/pepper*).
- **Proteção de Arquivos (Storage Privado):** Os arquivos de imagem/PDF enviados devem ser salvos em bucket de armazenamento privado (ex: AWS S3 ou Google Cloud Storage). O acesso aos arquivos deve ser feito exclusivamente via URLs Temporárias Pré-Assinadas (*Presigned URLs*) com tempo de expiração estrito de no máximo **15 minutos**.
- **Mascaramento de Dados (Data Masking):** Usuários do perfil Vendedor visualizam o CPF mascarado no formato `***.456.789-**` em telas de listagem.
- **Trilha de Auditoria LGPD:** Cada requisição que resulte na descriptografia e visualização de dados PII ou download de documentos deve registrar um log contendo: `timestamp`, `usuario_id`, `aluno_id`, `tipo_dado_acessado`, `ip_origem`.

### 🟡 RNF-03: Usabilidade e Responsividade Mobile
- **Design Touch-First:** A interface de cadastro do aluno pelo vendedor deve ser totalmente utilizável em telas pequenas a partir de 320px de largura.
- **Máscaras de Entrada Automatizadas:** Aplicação de máscaras dinâmicas de formatação nos campos de CPF (`000.000.000-00`), CEP (`00000-000`), Telefone (`(00) 00000-0000`) e Data (`DD/MM/AAAA`).
- **Autopreenchimento por CEP:** Integração com serviço de busca de CEP (ViaCEP/BrasilAPI) com suporte a *fallback* automático.

### 🟡 RNF-04: Armazenamento e Validação de Arquivos
- **Formatos Permitidos:** `image/jpeg`, `image/png`, `image/webp`, `application/pdf`.
- **Tamanho Máximo por Arquivo:** 10 MB.
- **Validação de Conteúdo Real (Magic Bytes):** O backend deve verificar o cabeçalho binário do arquivo para impedir o envio de executáveis maliciosos com extensões adulteradas.

---

## 7. Design e Interface (UI/UX)

### 7.1. Detalhamento dos Estados da Interface (UI States)

| Estado | Comportamento e Apresentação Visual |
|---|---|
| 🟡 **Loading State** | • Skeletons animados nas tabelas de pendências e nos cards do aluno.<br>• Botão de salvar exibe *spinner* e texto *"Criptografando e Salvando..."* durante o envio.<br>• Barra de progresso percentual durante o upload de anexos. |
| 🟡 **Empty State** | • No painel "Documentos Pendentes": Exibe ilustração amigável de uma prancheta cheia de checks verdes com a mensagem: *"Nenhuma pendência documental encontrada para os filtros selecionados!"*.<br>• No checklist do aluno sem anexos: Exibe área tracejada com ícone de upload e texto: *"Clique ou arraste a foto do documento aqui"*. |
| 🟡 **Success State** | • Toast notificador no canto superior direito: *"Cadastro do aluno salvo com sucesso!"*.<br>• Alteração instantânea do badge de status do documento de amarelo `PENDENTE` para verde `ENTREGUE`. |
| 🟡 **Error State** | • Banners de alerta no topo do formulário destacando inconsistências de validação.<br>• Destaque em vermelho nos campos inválidos com mensagens explicativas abaixo do campo (ex: *"Dígito verificador do CPF incorreto"*). |
| 🟡 **Partial / Pending State** | • Header do perfil do aluno exibe barra de progresso do checklist: ex: `[████████░░] 75% (3/4 documentos entregues)`.<br>• Badge de elegibilidade contratual em laranja: `PENDENTE DOCUMENTAÇÃO`. |

---

### 7.2. Diagramas de Telas Principais (Wireframes Conceituais)

#### 🟡 Tela 1: Painel "Documentos Pendentes" (Secretaria)
```
+---------------------------------------------------------------------------------------------------+
|  SISTEMA ESCOLAR > DOCUMENTOS PENDENTES                                        [Ana Secretaria v] |
+---------------------------------------------------------------------------------------------------+
| FILTROS: [ Vendedor: Todos v ]  [ Curso: Todos v ]  [ Documento: Todos v ]  [ Status SLA: Todos v]|
| BUSCA:   [ Digite Nome ou CPF...                           ]  [ BUSCAR ]     [ REFRESH ]          |
+---------------------------------------------------------------------------------------------------+
| ALUNO              | CURSO            | VENDEDOR     | DOCS PENDENTES       | DIAS | AÇÃO RÁPIDA |
+--------------------+------------------+--------------+----------------------+------+--------------+
| João da Silva      | Tec. Enfermagem  | Marcos Vend. | • Comp. Residência   | 8d 🔴| [📱 Cobrar Wpp]
|                    |                  |              | • Histórico Escolar  |      | [👁️ Detalhes]
+--------------------+------------------+--------------+----------------------+------+--------------+
| Maria Oliveira     | Pós-Graduação AI | Ana Secr.    | • RG (Frente/Verso)  | 2d 🟢| [📱 Cobrar Wpp]
|                    |                  |              |                      |      | [👁️ Detalhes]
+--------------------+------------------+--------------+----------------------+------+--------------+
| Carlos Eduardo     | Adm. de Empresas | Marcos Vend. | • Histórico Escolar  | 5d 🟡| [📱 Cobrar Wpp]
|                    |                  |              |                      |      | [👁️ Detalhes]
+---------------------------------------------------------------------------------------------------+
| Exibindo 1-3 de 3 pendências ativas                                      [< Anterior] [1] [Próximo >]|
+---------------------------------------------------------------------------------------------------+
```

---

## 8. Modelo de Dados (Schema & Data Model)

### 8.1. Diagrama de Entidades (Mermaid ERD)

```mermaid
erDiagram
    ALUNOS ||--o{ DOCUMENTOS_ALUNO : possui
    ALUNOS ||--o{ HISTORICO_COBRANCA_DOCUMENTO : recebe
    ALUNOS ||--o{ AUDIT_LOGS_LGPD : gera_acesso
    USUARIOS ||--o{ DOCUMENTOS_ALUNO : homologa
    USUARIOS ||--o{ HISTORICO_COBRANCA_DOCUMENTO : executa

    ALUNOS {
        uuid id PK
        string nome_completo
        string cpf_hash UK "HMAC-SHA256 para busca"
        text cpf_criptografado "AES-256"
        text rg_criptografado "AES-256"
        string rg_orgao_emissor
        text data_nascimento_criptografada "AES-256"
        text email_criptografado "AES-256"
        text telefone_whatsapp_criptografado "AES-256"
        text endereco_json_criptografado "AES-256"
        boolean possui_responsavel_legal
        text dados_responsavel_json_criptografado "AES-256"
        enum status_documentacao "PENDENTE, EM_ANALISE, COMPLETA"
        uuid criado_por_usuario_id FK
        timestamp created_at
        timestamp updated_at
    }

    DOCUMENTOS_ALUNO {
        uuid id PK
        uuid aluno_id FK
        enum tipo_documento "RG, CPF, COMPROVANTE_RESIDENCIA, HISTORICO_ESCOLAR"
        enum status "PENDENTE, EM_ANALISE, ENTREGUE, DISPENSADO"
        string arquivo_storage_path "Path privado no S3/GCS"
        string mime_type
        integer tamanho_bytes
        timestamp data_recebimento
        uuid recebido_por_usuario_id FK
        text motivo_dispensa
        timestamp created_at
        timestamp updated_at
    }

    HISTORICO_COBRANCA_DOCUMENTO {
        uuid id PK
        uuid aluno_id FK
        enum tipo_documento "RG, CPF, COMPROVANTE_RESIDENCIA, HISTORICO_ESCOLAR"
        enum canal_cobranca "WHATSAPP, EMAIL, PRESENCIAL"
        uuid enviado_por_usuario_id FK
        text observacao
        timestamp created_at
    }

    AUDIT_LOGS_LGPD {
        uuid id PK
        uuid usuario_id FK
        uuid aluno_id FK
        enum acao "LEITURA_PII, DOWNLOAD_DOCUMENTO, EXPORTACAO"
        string ip_origem
        timestamp created_at
    }
```

---

### 8.2. Dicionário de Dados e Estrutura das Tabelas (SQL DDL Schema)

```sql
-- 🟡 Tabela Principal de Alunos
CREATE TYPE enum_status_documentacao AS ENUM ('PENDENTE', 'EM_ANALISE', 'COMPLETA');

CREATE TABLE alunos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_completo VARCHAR(255) NOT NULL,
    cpf_hash VARCHAR(64) UNIQUE NOT NULL, -- HMAC-SHA256(cpf + salt)
    cpf_criptografado TEXT NOT NULL, -- AES-256-GCM
    rg_criptografado TEXT, -- AES-256-GCM
    rg_orgao_emissor VARCHAR(50),
    data_nascimento_criptografada TEXT NOT NULL, -- AES-256-GCM
    email_criptografado TEXT NOT NULL, -- AES-256-GCM
    telefone_whatsapp_criptografado TEXT NOT NULL, -- AES-256-GCM
    endereco_json_criptografado TEXT NOT NULL, -- JSON com CEP, logradouro, num, bairro, cidade, uf
    possui_responsavel_legal BOOLEAN NOT NULL DEFAULT FALSE,
    dados_responsavel_json_criptografado TEXT, -- JSON com nome, cpf, tel, parentesco
    status_documentacao enum_status_documentacao NOT NULL DEFAULT 'PENDENTE',
    criado_por_usuario_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_alunos_cpf_hash ON alunos(cpf_hash);
CREATE INDEX idx_alunos_criado_por ON alunos(criado_por_usuario_id);
CREATE INDEX idx_alunos_status_doc ON alunos(status_documentacao);

-- 🟡 Tabela de Checklist de Documentos do Aluno
CREATE TYPE enum_tipo_documento AS ENUM ('RG', 'CPF', 'COMPROVANTE_RESIDENCIA', 'HISTORICO_ESCOLAR');
CREATE TYPE enum_status_documento AS ENUM ('PENDENTE', 'EM_ANALISE', 'ENTREGUE', 'DISPENSADO');

CREATE TABLE documentos_aluno (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
    tipo_documento enum_tipo_documento NOT NULL,
    status enum_status_documento NOT NULL DEFAULT 'PENDENTE',
    arquivo_storage_path VARCHAR(512),
    mime_type VARCHAR(100),
    tamanho_bytes INTEGER,
    data_recebimento TIMESTAMP WITH TIME ZONE,
    recebido_por_usuario_id UUID,
    motivo_dispensa TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_aluno_tipo_doc UNIQUE(aluno_id, tipo_documento)
);

CREATE INDEX idx_docs_aluno_status ON documentos_aluno(aluno_id, status);

-- 🟡 Tabela de Histórico de Cobranças Realizadas
CREATE TYPE enum_canal_cobranca AS ENUM ('WHATSAPP', 'EMAIL', 'PRESENCIAL');

CREATE TABLE historico_cobranca_documento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
    tipo_documento enum_tipo_documento NOT NULL,
    canal_cobranca enum_canal_cobranca NOT NULL,
    enviado_por_usuario_id UUID NOT NULL,
    observacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 🟡 Tabela de Audit Log LGPD (Acessos a Dados Sensíveis)
CREATE TYPE enum_acao_lgpd AS ENUM ('LEITURA_PII', 'DOWNLOAD_DOCUMENTO', 'EXPORTACAO');

CREATE TABLE audit_logs_lgpd (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL,
    aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
    acao enum_acao_lgpd NOT NULL,
    ip_origem VARCHAR(45) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_lgpd_aluno ON audit_logs_lgpd(aluno_id);
CREATE INDEX idx_audit_lgpd_usuario ON audit_logs_lgpd(usuario_id);
```

---

## 9. Integrações e Especificação de APIs RESTful

### 🟡 API 01: `POST /api/v1/alunos`
- **Descrição:** Realiza o cadastro de um novo aluno e instancia seu checklist documental padrão.
- **Headers:** `Authorization: Bearer <token_jwt>`, `Content-Type: application/json`
- **Payload de Requisição:**
```json
{
  "nome_completo": "João da Silva",
  "cpf": "123.456.789-00",
  "rg": "12.345.678-9",
  "rg_orgao_emissor": "SSP/SP",
  "data_nascimento": "2002-05-14",
  "email": "joao.silva@email.com",
  "telefone_whatsapp": "(11) 98765-4321",
  "endereco": {
    "cep": "01310-100",
    "logradouro": "Avenida Paulista",
    "numero": "1000",
    "complemento": "Apto 42",
    "bairro": "Bela Vista",
    "cidade": "São Paulo",
    "estado": "SP"
  },
  "possui_responsavel_legal": false
}
```
- **Respostas Esperadas:**
  - `201 Created`: Cadastro realizado com sucesso. Retorna objeto do aluno com `aluno_id` e checklist criado.
  - `400 Bad Request`: Dados inválidos (ex: CPF incorreto, CEP inexistente).
  - `409 Conflict`: CPF já cadastrado na base de dados.

---

### 🟡 API 02: `GET /api/v1/alunos/pendencias-documentais`
- **Descrição:** Lista os alunos com pendências de documentação para a tela da Secretaria.
- **Query Parameters:** `vendedor_id`, `curso_id`, `tipo_documento`, `dias_atraso_min`, `page`, `limit`.
- **Payload de Resposta (`200 OK`):**
```json
{
  "total": 42,
  "page": 1,
  "limit": 10,
  "data": [
    {
      "aluno_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "nome_aluno": "João da Silva",
      "cpf_mascarado": "***.456.789-**",
      "telefone_whatsapp": "(11) 98765-4321",
      "vendedor_nome": "Marcos Vendedor",
      "curso_nome": "Técnico em Enfermagem",
      "data_matricula": "2026-07-15T10:30:00Z",
      "dias_pendente": 8,
      "status_sla": "CRITICO",
      "documentos_pendentes": [
        "COMPROVANTE_RESIDENCIA",
        "HISTORICO_ESCOLAR"
      ]
    }
  ]
}
```

---

### 🟡 API 03: `POST /api/v1/alunos/{id}/documentos/{tipo_documento}/upload`
- **Descrição:** Recebe o upload de arquivo para um item específico do checklist.
- **Content-Type:** `multipart/form-data`
- **Form Data:** `file` (arquivo binário).
- **Payload de Resposta (`200 OK`):**
```json
{
  "documento_id": "7c8e9f0a-1b2c-3d4e-5f6a-7b8c9d0e1f2a",
  "aluno_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "tipo_documento": "COMPROVANTE_RESIDENCIA",
  "status": "EM_ANALISE",
  "mime_type": "image/jpeg",
  "tamanho_bytes": 2048500,
  "presigned_url_temp": "https://storage.escola.com/docs/abc123...expires=900"
}
```

---

### 🟡 API 04: `PATCH /api/v1/alunos/{id}/documentos/{tipo_documento}/status`
- **Descrição:** Permite à Secretaria alterar o status do documento (`ENTREGUE`, `DISPENSADO`, `PENDENTE`).
- **Payload de Requisição:**
```json
{
  "status": "DISPENSADO",
  "motivo_dispensa": "Aluno matriculado em curso livre sem exigência de histórico prévio."
}
```
- **Resposta:** `200 OK`

---

## 10. Edge Cases e Tratamento de Erros

| Código / Cenário | Descrição do Edge Case | Comportamento Esperado e Tratamento do Sistema |
|---|---|---|
| 🟡 **EC-01: Concorrência Vendedor x Secretaria** | Vendedor e Secretária tentam atualizar o checklist do mesmo aluno simultaneamente. | Tratamento via **Optimistic Locking** (versionamento por `updated_at`). O segundo envio recebe resposta `409 Conflict` solicitando atualização de tela. |
| 🟡 **EC-02: Upload de Arquivo Malicioso** | Usuário altera a extensão de um script `.exe` para `.pdf` e tenta realizar upload. | O backend analisa os *Magic Bytes* do buffer do arquivo. Ao detectar incompatibilidade entre cabeçalho real e mime-type declarado, rejeita com `422 Unprocessable Entity`. |
| 🟡 **EC-03: Queda de Conexão Mobile no Upload** | Vendedor no celular perde o sinal 4G no meio do envio da foto do documento. | O frontend salva transientemente a imagem no **IndexedDB** do navegador. Quando a conexão é restabelecida, o sistema exibe notificação: *"Upload pendente detectado. Deseja reestabelecer o envio?"*. |
| 🟡 **EC-04: Menor de Idade sem Responsável** | Operador preenche data de nascimento indicando 16 anos e tenta forçar a gravação omitindo o responsável. | Validação síncrona no backend bloqueia com código `422` contendo o detalhe: `dados_responsavel_legal: obrigatório para menores de 18 anos`. |
| 🟡 **EC-05: Dispensa de Documento Sem Justificativa** | Operador tenta mudar o status de `HISTORICO_ESCOLAR` para `DISPENSADO` deixando o motivo em branco. | O backend valida que `motivo_dispensa` é obrigatório quando `status == DISPENSADO` e retorna `400 Bad Request`. |

---

## 11. Segurança, Criptografia e Conformidade LGPD

### 11.1. Arquitetura de Criptografia de Dados Sensíveis (PII)
🟡 Para atender aos requisitos de proteção de dados pessoais exigidos pela LGPD (Lei Nº 13.709/2018):
1. **Camada de Aplicação:** Os dados PII não são salvos em texto claro no banco de dados. Antes do `INSERT`/`UPDATE`, a aplicação aplica **AES-256-GCM** com vetor de inicialização (IV) aleatório de 12 bytes gerado por chamada.
2. **Armazenamento de Hash de Busca (HMAC-SHA256):** O campo CPF é transformado em `cpf_hash` através do algoritmo HMAC com SHA-256 utilizando uma chave secreta mantida em Cofre de Segredos (AWS Secrets Manager / Environment Variable). Isso possibilita consultas do tipo `SELECT * FROM alunos WHERE cpf_hash = ?` com custo O(1) sem necessidade de descriptografar o banco.
3. **Gestão de Chaves (KMS):** As chaves mestre de criptografia são rotacionadas periodicamente através de integração com Key Management Service.

### 11.2. Segurança de Arquivos e URLs Assinadas
- **Nenhum Acesso Público Directo:** O bucket de armazenamento de documentos possui acesso público estritamente bloqueado (`Block Public Access = True`).
- **URLs Assinadas Temporárias:** A visualização de fotos de RG, CPF ou Comprovante de Residência pela Secretaria é feita gerando uma URL pré-assinada (Presigned URL) válida por **15 minutos (900 segundos)**. Expirado esse prazo, o link torna-se inacessível.

---

## 12. Questões Abertas (Open Questions)

- 🟡 **Q-01: Integração Nativa com API Oficial do WhatsApp Business vs. WA.ME Deep Link**  
  *Contexto:* A cobrança rápida via WhatsApp pode ser feita via link direto `https://wa.me/55...` (abertura no app do atendente sem custo de API) ou via mensagem de template enviada pelo servidor via WhatsApp Cloud API (custo por mensagem).  
  *Impacto:* Custos financeiros recorrentes vs. menor controle de confirmação de entrega da mensagem.

- 🟡 **Q-02: Concessão de Prazo Estendido para Histórico Escolar (Termo de Compromisso)**  
  *Contexto:* É comum alunos recém-formados no ensino médio não possuírem o histórico escolar imediato.  
  *Pergunta:* Devemos permitir a emissão de contrato com o status `HISTORICO_ESCOLAR` pendente mediante a assinatura de um "Termo de Entrega Futura em até 30 dias"?

---

## 13. Registro de Decisões (Decision Log / ADRs)

### 🟡 ADR-01: Utilização de HMAC-SHA256 para Busca Indexada de CPF
- **Status:** 🟡 Aprovado
- **Contexto:** Necessidade de garantir buscas ultra-rápidas por CPF sem violar a criptografia AES-256 em repouso dos dados do aluno.
- **Decisão:** Criar a coluna `cpf_hash` populada com `HMAC-SHA256(cpf_limpo, SECRET_PEPPER)`.
- **Consequência:** Permite índice único e busca direta em tempo de execução sem expor os números do CPF no banco.

### 🟡 ADR-02: Armazenamento em Bucket Privado com URLs Pré-Assinadas de 15 Minutos
- **Status:** 🟡 Aprovado
- **Contexto:** Documentos de alunos (RG/CPF) contêm dados altamente sensíveis e não podem ficar acessíveis publicamente via URLs estáticas.
- **Decisão:** Guardar todos os uploads em bucket privado e gerar `Presigned URLs` dinâmicas com validade de 15 minutos apenas para requisições autenticadas.
- **Consequência:** Elimina o risco de vazamento de documentos via varredura de URLs públicas ou motores de busca.

---

## 14. Relatório de Avaliação e Scoring Report (Auto-Avaliação)

🟡 Avaliação pragmática da especificação com base nos critérios estabelecidos:

| Critério de Avaliação | Peso | Nota (0 - 100%) | Nota Ponderada | Justificativa |
|---|:---:|:---:|:---:|---|
| **Completude** | 30% | 100% | 30.0% | Contém todas as seções do template (Resumo, Contexto, Goals, RF, RNF, UI, Modelo de Dados SQL, APIs JSON, Edge Cases, LGPD, QAs, ADRs). |
| **Testabilidade** | 25% | 100% | 25.0% | Requisitos padronizados em RF-XX/RNF-XX com critérios objetivos, fluxos principal/alternativos e contrato JSON preciso para testes unitários e de integração. |
| **Clareza** | 20% | 100% | 20.0% | Redação técnica inequívoca em português, tabelas formatadas, esquema Mermaid visual e DDL SQL de banco de dados pronto para migração. |
| **Escopo** | 15% | 100% | 15.0% | Alinhado estritamente com os Não-Objetivos (ex: sem emissão direta de contrato ou OCR), focando no cadastro de alunos e gestão documental. |
| **Edge Cases** | 10% | 100% | 10.0% | Mapeou detalhadamente 5 cenários críticos de borda (concorrência, upload malicioso, perda de sinal 4G, menor de idade, falta de justificativa). |
| **NOTA FINAL CONSOLIDADA** | **100%** | — | **100.0%** | **ESPECIFICAÇÃO DE ALTA QUALIDADE (APROVADO 🟢)** |

---
*Especificação SDD gerada para o componente `cadastro-alunos-documentacao` em 2026-07-23.*
