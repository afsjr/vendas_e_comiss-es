# Proposta de Stack e Arquitetura V1 — Sistema de Comissionamento e Vendas

> **Status:** 🟢 Homologada para V1 (PL-01)  
> **Data:** 2026-07-23  
> **Fonte Canônica de Regras de Negócio:** [`_reversa_sdd/decisions-gate.md`](../_reversa_sdd/decisions-gate.md)  
> **Aviso de Conformidade:** Nenhuma decisão de negócio foi alterada. Todos os requisitos arquiteturais derivam estritamente de DEC-01 a DEC-07.

---

## 1. Visão Geral e Alinhamento com o Gate de Decisões

Esta proposta apresenta a arquitetura de referência para a V1 do **Sistema de Comissionamento e Vendas**. O objetivo é garantir um sistema robusto, performático, seguro e auditável, respeitando integralmente as decisões homologadas no `decisions-gate.md`:

- **DEC-01 (Escopo de Pagamento V1):** Apenas a entrada inicial (matrícula/1º pagamento) e seu comprovante em imagem são registrados.
- **DEC-02 (Regra de Comissão):** Valor fixo em R$ (`valor_comissao_fixo`) cadastrado por curso.
- **DEC-03 (Gatilho de Pagamento):** Comissão liberada (`LIBERADA_PAGAMENTO`) exclusivamente se `status_venda == APROVADA` E `data_inicio_curso <= data_atual`.
- **DEC-04 (Escopo Secretaria):** Perfil Secretaria possui o mesmo isolamento estrito de RLS que o Vendedor Comercial (acesso restrito à própria produção).
- **DEC-05 (Comprovante Único via SHA-256):** 1 Comprovante = 1 Venda. Trava estrita no backend/banco por hash SHA-256 de arquivo de imagem.
- **DEC-06 (Ciclo de Fechamento Financeiro):** Fechamento mensal (corte no último dia às 23:59:59) e registros imutáveis no Livro-Caixa (`append-only`).
- **DEC-07 (Métricas Separadas):** Indicadores distintos para Emissão de Contrato (% com minuta) e Regularização Documental (% com checklist 100%).

---

## 2. Arquitetura de Referência e Comparativo de Stacks

### 2.1. Stack Recomendada (Principal e Unificada)

Para a V1, recomenda-se uma infraestrutura coesa baseada em componentes com alta integração:

- **Frontend / PWA:** Next.js (App Router, TypeScript, Tailwind CSS, PWA / Service Worker) hospedado na **Vercel**.
  - Interface responsiva com suporte a captura de fotos/comprovantes em campo e cache local de rascunhos.
- **Backend API Core:** **Rust (Axum + SQLx)** rodando em container Docker no **Fly.io**.
  - Candidato explícito para o backend. Fornece tipagem estrita no tratamento de concorrência, consumo de memória previsível e execução rápida na validação de hash e regras de negócio.
- **Banco de Dados & Autenticação:** **PostgreSQL 16 no Supabase** + **Supabase Auth / GoTrue** (com emissão de Tokens JWT).
  - Políticas de Row Level Security (RLS) aplicadas nativamente no PostgreSQL, garantindo que mesmo requisições diretas ao banco obedeçam às regras de isolamento (DEC-04).
- **Storage Privado:** **Supabase Storage Privado** (S3-compatible) com acesso exclusivo via **Signed URLs temporárias** (expiração de 15 minutos).
  - Nenhum bucket ou arquivo é acessível publicamente.
- **Geração de PDF:** Módulo compilado em **Rust** utilizando o utilitário **Typst CLI** (embarcado no container do backend).
  - O PDF da minuta do contrato gerado é gravado diretamente no Storage Privado e entregue ao usuário através de uma Signed URL pré-assinada.
- **Observabilidade Mínima:** Logs estruturados em JSON (`tracing` crate em Rust) integrados com **Sentry** (erros) e **OpenTelemetry**.

---

### 2.2. Stack Alternativa (Isolada)

Como alternativa de menor curva de aprendizado inicial para a equipe:
- **Frontend:** React + Vite PWA.
- **Backend:** Node.js (TypeScript com Fastify & Kysely/Prisma).
- **Banco de Dados & Auth:** PostgreSQL gerenciado em AWS RDS + Auth0.
- **Storage Privado:** AWS S3 Privado com IAM Policies e Presigned URLs.
- **Geração de PDF:** Microserviço Node.js com `pdf-lib` rodando em AWS Lambda.

---

### 2.3. Matriz de Trade-offs e Classificação da Informação

| Camada | Stack Principal (Rust + Supabase/RLS) | Stack Alternativa (Node.js + AWS) | Classificação da Informação |
|---|---|---|---|
| **Backend Core** | Segurança de memória, baixo consumo de RAM, compilação estática. | Desenvolvimento ágil em JS/TS, maior ecossistema de bibliotecas. | **Fato** (Candidato Rust explícito nas especificações) |
| **Isolamento RBAC/RLS** | RLS nativo no PostgreSQL atrelado às claims do JWT propagadas pelo Rust. | Checagem de permissão centralizada no middleware do Node.js. | **Fato** (DEC-04 exige isolamento garantido na camada de dados) |
| **Geração de Minutas PDF** | Typst CLI compilado (rápido, saída vetorial limpa, salva no Storage Privado). | Puppeteer/pdf-lib em Lambda (maior footprint de memória por execução). | **Hipótese** (A validar volume de emissão de contratos na V1) |
| **Timezone Operacional** | Definição única aplicável a cortes de mês, início de aulas e logs. | Dependência do fuso horário da máquina de hospedagem. | **Decisão Pendente** (Requer homologação humana entre UTC ou America/Sao_Paulo) |

---

## 3. Arquitetura da Solução (Diagrama Mermaid)

```mermaid
flowchart TB
    subgraph ClientLayer ["Camada de Cliente (PWA)"]
        VendedorPWA["PWA Vendedor / Secretaria<br/>(Next.js no Vercel)"]
        AuditorPWA["PWA Auditor / Gestor<br/>(Next.js no Vercel)"]
    end

    subgraph AuthLayer ["Autenticação & Controle de Acesso"]
        AuthServer["Supabase Auth / GoTrue<br/>(JWT com sub e app_metadata.app_role)"]
    end

    subgraph APILayer ["Backend API Core (Rust / Axum no Fly.io)"]
        API_Vendas["Módulo de Vendas<br/>(Validação Server-Side SHA-256)"]
        API_Auditoria["Módulo de Auditoria<br/>(Máquina de Estados)"]
        API_Comissoes["Engine de Comissões<br/>(Trava data_inicio_curso <= HOJE)"]
        API_PDF["Gerador de PDF (Typst)<br/>(Emissão de Minuta)"]
    end

    subgraph DataLayer ["Camada de Dados & Storage (Supabase Cloud)"]
        DB_Vendas[("PostgreSQL 16<br/>(RLS Nativo sem BYPASSRLS + Constraints SHA-256)")]
        DB_Comissoes[("PostgreSQL 16<br/>(Tabela comissoes)")]
        DB_LivroCaixa[("PostgreSQL 16<br/>(livro_caixa_lancamentos Append-Only)")]
        StoragePrivate[("Supabase Storage Privado<br/>(Comprovantes, Docs & PDFs)")]
    end

    VendedorPWA -->|1. Obter JWT| AuthServer
    AuditorPWA -->|1. Obter JWT| AuthServer

    VendedorPWA -->|2. POST /vendas com Payload + Buffer Imagem| API_Vendas
    API_Vendas -->|3. Recalcula SHA-256 Server-Side & Checa Duplicidade| DB_Vendas
    API_Vendas -->|4. Salva no Storage Privado| StoragePrivate
    API_Vendas -->|5. SET LOCAL ROLE authenticated + set_config request.jwt.claims| DB_Vendas

    AuditorPWA -->|6. POST /auditoria/aprovar| API_Auditoria
    API_Auditoria -->|7. Atualiza Status Venda & Transiciona Comissão| DB_Comissoes

    API_Comissoes -->|8. Reavalia Trava data_inicio_curso <= HOJE| DB_Comissoes
    API_Comissoes -->|9. Registra Lançamento no Fechamento Mensal| DB_LivroCaixa

    VendedorPWA -->|10. POST /vendas/:id/gerar-contrato| API_PDF
    API_PDF -->|11. Compila PDF & Salva no Storage| StoragePrivate
    StoragePrivate -->|12. Retorna Signed URL Temporária (15 min)| VendedorPWA

    classDef default fill:#1e293b,stroke:#475569,color:#f8fafc;
    classDef highlight fill:#0369a1,stroke:#0ea5e9,color:#f8fafc;
    classDef security fill:#991b1b,stroke:#ef4444,color:#f8fafc;
    class API_Vendas,API_Auditoria,API_Comissoes,API_PDF highlight;
    class DB_Vendas,DB_Comissoes,DB_LivroCaixa,AuthServer security;
```

---

## 4. Responsabilidades e Detalhamento Técnico

### 4.1. Modelo Executável de RLS com Rust + Supabase (DEC-04)

Para garantir que o modelo de **Supabase Auth + PostgreSQL RLS** seja totalmente executável via Backend Rust sem qualquer risco de contorno de RLS, aplicam-se as seguintes regras estritas:

#### A. Claim de Aplicação Protegida (`app_metadata.app_role`)
- **Separação de Privilégios:** O papel de negócio do usuário (`"VENDEDOR"`, `"SECRETARIA"`, `"AUDITOR"`, `"GESTOR"`) é armazenado exclusivamente no objeto protegido `app_metadata.app_role` do Supabase Auth.
- **Imutabilidade:** Essa claim é gerenciada **apenas via Supabase Admin API / Service Role**. O usuário final não possui autorização para modificar `app_metadata` (diferente de `user_metadata`, que é editável pelo próprio cliente).

#### B. Conexão do Backend Rust sem `BYPASSRLS` e Injeção Transacional
- **Role de Conexão:** A role de conexão utilizada pelo pool do Rust (SQLx) **NÃO possui a flag `BYPASSRLS` nem `SUPERUSER`**. A aplicação conecta utilizando a role `authenticated` (ou uma role customizada de aplicação sem privilégio de bypass).
- **Propagação de Contexto por Transação:** A cada requisição atendida pelo backend Rust, o handler executa explicitamente os comandos `SET LOCAL` dentro do bloco transacional SQL antes de interagir com as tabelas:
  ```sql
  BEGIN;
  -- Força o papel da sessão a obedecer o RLS nativo do Supabase
  SET LOCAL ROLE authenticated;
  -- Injeta o payload JSON completo do JWT validado na variável de sessão
  SELECT set_config('request.jwt.claims', $1, true);
  
  -- Exemplo: queries da aplicação...
  COMMIT;
  ```
  *(O parâmetro `$1` é a string JSON do payload JWT validado contendo `sub`, `app_metadata`, etc.)*

#### C. Leitura de Claims via `jsonb` e Política SQL Completa
- A leitura das claims no PostgreSQL é realizada convertendo a string de sessão para `jsonb`: `(current_setting('request.jwt.claims', true)::jsonb)`.
- **Policy SQL Canônica com `USING` e `WITH CHECK`:**
  ```sql
  CREATE POLICY vendas_isolation_policy ON vendas
      FOR ALL
      TO authenticated
      USING (
          (
              (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'app_role') IN ('VENDEDOR', 'SECRETARIA')
              AND criado_por = ((current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid)
          )
          OR (
              (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'app_role') IN ('AUDITOR', 'GESTOR')
          )
      )
      WITH CHECK (
          (
              (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'app_role') IN ('VENDEDOR', 'SECRETARIA')
              AND criado_por = ((current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid)
          )
          OR (
              (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'app_role') IN ('AUDITOR', 'GESTOR')
          )
      );
  ```

#### D. Suíte de Testes de Integração Obrigatórios para RLS
Na fase de implementação, a suíte de testes de integração automatizados (`tests/rls_integration.rs`) deve obrigatoriamente executar e validar:
1. **Teste de Injeção de `criado_por` por Vendedor/Secretaria:** Tentativa de `INSERT` ou `UPDATE` por um usuário com `app_role` = `"VENDEDOR"` atribuindo `criado_por` com o UUID de outro usuário deve falhar imediatamente com erro de violação de RLS (disparado pela cláusula `WITH CHECK`).
2. **Isolamento de Leitura:** Tentativa de `SELECT` por um Vendedor/Secretaria em registros cujos `criado_por` pertencem a terceiros deve retornar exatamente 0 registros.
3. **Escopo Global do Auditor/Gestor:** Usuários com `app_role` igual a `"AUDITOR"` ou `"GESTOR"` devem conseguir visualizar os registros de todos os vendedores, mas somente o Auditor possui permissão para transicionar o estado para `APROVADA` ou `DEVOLVIDA_AJUSTE`.

---

### 4.2. Fluxo Server-Side de Upload e Validação SHA-256 (DEC-05)

O hash SHA-256 pré-calculado no PWA serve unicamente para otimização de UX (evitar envio de arquivos duplicados antes do upload). A integridade do sistema é garantida pelo backend:

1. **Recepção do Stream no Backend:** O backend Rust recebe o payload Multipart com os metadados da venda e o buffer binário do comprovante de pagamento.
2. **Recálculo Server-Side do Hash:** O backend calcula conclusivamente o hash SHA-256 a partir dos bytes reais recebidos:
   ```rust
   let sha256_checksum = format!("{:x}", sha2::Sha256::digest(&file_bytes));
   ```
3. **Checagem de Duplicidade:** O backend consulta o banco pela constraint única (`unique_hash_sha256`). Caso o hash já exista na tabela `evidencias_vendas`, a transação é abortada imediatamente e é retornado HTTP `409 Conflict` (1 Comprovante = 1 Venda).
4. **Armazenamento e Commit:** Somente após passar na checagem de duplicidade o arquivo é enviado ao Supabase Storage Privado e a venda é persistida na tabela `vendas`.

---

### 4.3. Máquina de Estados da Comissão & Gatilho (DEC-03)

- **Status da Comissão (`status_comissao`):** `BLOQUEADA_AUDITORIA` $\rightarrow$ `AGUARDANDO_INICIO_AULAS` $\rightarrow$ `LIBERADA_PAGAMENTO` $\rightarrow$ `PAGA` | `ESTORNADA`.
- **Gatilho de Liberação:**
  - A comissão só atinge `LIBERADA_PAGAMENTO` se `status_venda == APROVADA` E `data_inicio_curso <= HOJE`.
  - A transição entre `AGUARDANDO_INICIO_AULAS` e `LIBERADA_PAGAMENTO` é avaliada diariamente por um worker agendado no backend Rust ou na aprovação de auditoria se as aulas já tiverem iniciado.

---

### 4.4. Imutabilidade do Livro-Caixa Append-Only (DEC-06)

A tabela `livro_caixa_lancamentos` armazena exclusivamente lançamentos imutáveis:
- Triggers no PostgreSQL bloqueiam comandos `UPDATE` e `DELETE`.
- Estornos de comissões por cancelamento de venda geram novos registros de débito (contra-lançamento com valor negativo), garantindo auditabilidade contábil total.

---

## 5. Tempo de Negócio (Timezone Operacional)

- **Decisão Homologada:** O timezone operacional do sistema é **`America/Sao_Paulo` (UTC-3)**.
- **Impacto da Padronização:** O fuso horário escolhido será aplicado de forma estrita e unificada em:
  1. Fechamento mensal do Livro-Caixa (DEC-06: corte às 23:59:59 do último dia do mês no fuso cadastrado).
  2. Avaliação diária da trava de início das aulas (DEC-03: `data_inicio_curso <= HOJE`).
  3. Registros de timestamps de auditoria e logs do sistema.

---

## 6. Riscos, Dependências Externas e Decisões Pendentes

### 6.1. Riscos Identificados
1. **Concorrência de Uploads Simultâneos:** Tentativa de upload do mesmo comprovante por dois usuários ao mesmo tempo. *Mitigação:* Trada nativamente pela constraint única `UNIQUE (sha256_checksum)` no banco, retornando `409 Conflict`.
2. **Tempo de Build de Containers Rust:** Builds em CI/CD podem demorar sem cache. *Mitigação:* Utilização do `cargo-chef` em Docker Multi-Stage Build.

### 6.2. Decisões que Requerem Aprovação Humana (Orquestrador)
1. **Stack e timezone homologados:** Next.js/Vercel + Rust Axum/SQLx/Fly.io + Supabase Cloud/Auth/Storage + Typst; `America/Sao_Paulo` como timezone de negócio.

---

## 7. Plano de Fundação V1 (Máximo de 5 Passos — Não Implementado)

1. **Passo 1 — Schema PostgreSQL & RLS Canonical:** Criar tabelas, enums, constraint SHA-256 única, triggers append-only e políticas RLS com `USING` e `WITH CHECK` usando `request.jwt.claims::jsonb -> 'app_metadata' ->> 'app_role'`.
2. **Passo 2 — Core API Rust (Axum + SQLx):** Configurar servidor Axum, validação JWT do Supabase Auth e middleware de injeção de claims da sessão Postgres via `SET LOCAL ROLE authenticated` e `set_config('request.jwt.claims', ...)`.
3. **Passo 3 — Módulo de Upload & Recálculo SHA-256:** Implementar endpoint com leitura de stream, recálculo server-side do SHA-256 e gravação no Supabase Storage Privado.
4. **Passo 4 — Engine de Auditoria & Liberação de Comissões:** Implementar máquina de estados com a trava `data_inicio_curso <= HOJE` e registros no Livro-Caixa.
5. **Passo 5 — PWA Setup & Integração de PDF:** Inicializar Next.js PWA no Vercel com formulários de vendas e gerador de minuta em Rust via Signed URLs.

---
*Documento revisado conforme parecer REV-20260723-002.*
