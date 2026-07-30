# Contrato de Interface: API V1 Vendas & Auditoria

> Identificador: `001-implementar-v1-comissionamento`  
> Protocolo: Invocação de Supabase Edge Functions (Deno/TS) — JSON e upload de comprovante via Supabase Storage  
> Host base: `https://<project-ref>.supabase.co/functions/v1` (Edge Functions)  
> Autenticação: Bearer Token (JWT Supabase Auth no header `Authorization: Bearer <access_token>`, validado pelo Supabase)  
> Revisado em `2026-07-27` para a stack TypeScript (ADR-001/002). Substitui o backend Rust/Axum no Fly.io.

> **Modelo de invocação:** cada mutação sensível é uma Edge Function própria. O comprovante de pagamento é enviado primeiro ao Supabase Storage (bucket privado `comprovantes`) via Signed Upload URL gerada pelo client Supabase, e a Edge Function recebe a referência (`storage_path` + bytes para recálculo do hash), validando o SHA-256 server-side antes do INSERT transacional.

---

## 1. Endpoints (Edge Functions)

### 1.1. `POST /vendas` — Apontamento de Venda com Comprovante

- **Ator:** Vendedor ou Secretaria (`app_metadata.app_role` IN `"VENDEDOR"`, `"SECRETARIA"`).
- **Content-Type:** `application/json`
- **Pré-condição:** o comprovante já foi enviado pelo client Supabase ao bucket privado `comprovantes` via Signed Upload URL (storage path conhecido pelo frontend).
- **Request Parameters:**
  - `aluno_id` (string, UUID): ID do aluno cadastrado.
  - `curso_id` (string, UUID): ID do curso.
  - `valor_entrada` (number): Valor do primeiro pagamento/matrícula.
  - `comprovante_storage_path` (string): Caminho do objeto no bucket `comprovantes`. A Edge Function busca os bytes via service role e recalcula o SHA-256 server-side (DEC-05).
- **Response `201 Created`:**
  ```json
  {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "status_venda": "PENDENTE_VALIDACAO",
    "sha256_checksum": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "criado_em": "2026-07-23T15:30:00-03:00"
  }
  ```
- **Response `409 Conflict` (DEC-05):**
  ```json
  {
    "code": "DUPLICATE_RECEIPT_HASH",
    "message": "Este comprovante de pagamento já foi utilizado em outro apontamento."
  }
  ```

---

### 1.2. `POST /auditoria-aprovar` — Aprovação de Venda (DEC-03)

- **Ator:** Auditor Financeiro (`app_metadata.app_role == "AUDITOR"`).
- **Content-Type:** `application/json`
- **Request Body:** `{ "venda_id": "<uuid>" }`
- **Regra Dinâmica:** O status da comissão retornado é calculado dinamicamente com base na data oficial de início das aulas (`data_inicio_curso`) do curso cadastrado:
  - Se `data_inicio_curso > HOJE`, transiciona para `AGUARDANDO_INICIO_AULAS`.
  - Se `data_inicio_curso <= HOJE`, transiciona para `LIBERADA_PAGAMENTO`.
- **Response `200 OK` (Cenário Aulas Futuras):**
  ```json
  {
    "venda_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "status_venda": "APROVADA",
    "status_comissao": "AGUARDANDO_INICIO_AULAS",
    "mensagem": "Venda aprovada com sucesso. Comissão aguardando inicio oficial das aulas."
  }
  ```
- **Response `200 OK` (Cenário Aulas Iniciadas):**
  ```json
  {
    "venda_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "status_venda": "APROVADA",
    "status_comissao": "LIBERADA_PAGAMENTO",
    "mensagem": "Venda aprovada e aulas iniciadas. Comissão liberada para pagamento."
  }
  ```

---

### 1.3. `POST /auditoria-devolver` — Devolução de Venda para Ajuste

- **Ator:** Auditor Financeiro (`app_metadata.app_role == "AUDITOR"`).
- **Content-Type:** `application/json`
- **Request Body:**
  ```json
  {
    "venda_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "motivo_devolucao": "Comprovante ilegivel. O valor da imagem diverge da entrada informada."
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "venda_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "status_venda": "DEVOLVIDA_AJUSTE",
    "status_comissao": "BLOQUEADA_AUDITORIA",
    "motivo_devolucao": "Comprovante ilegivel. O valor da imagem diverge da entrada informada."
  }
  ```
- **Response `400 Bad Request`:**
  ```json
  {
    "code": "INVALID_REJECTION_REASON",
    "message": "O motivo da devolução eh obrigatorio e deve conter no minimo 10 caracteres."
  }
  ```

---

### 1.4. `POST /fechamento-mensal` — Fechamento Mensal e Livro-Caixa (DEC-06)

- **Ator:** Gestor Financeiro (`app_metadata.app_role == "GESTOR"`).
- **Content-Type:** `application/json`
- **Request Body:**
  ```json
  {
    "mes_competencia": "2026-07"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "mes_competencia": "2026-07",
    "total_comissoes_pagas": 14500.00,
    "quantidade_lancamentos": 29,
    "status": "FECHADO_SUCESSO"
  }
  ```

---

### 1.5. `POST /gerar-contrato` — Emissão de Minuta PDF

- **Ator:** Vendedor ou Secretaria.
- **Content-Type:** `application/json`
- **Request Body:** `{ "venda_id": "<uuid>" }`
- **Response `200 OK`:**
  ```json
  {
    "venda_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "pdf_signed_url": "https://supabase.co/storage/v1/object/sign/contratos_pdf/minuta_v001.pdf?token=eyJ...",
    "expires_at": "2026-07-23T15:45:00-03:00"
  }
  ```

---

## 2. Padrões de Segurança & Timeouts

- **Timeouts:** Timeout padrão de requisição de 10 segundos.
- **Idempotência:** Requisições `POST /vendas` utilizam o hash SHA-256 do arquivo como chave natural de idempotência para previnir duplo envio.
- **Fuso Horário:** Respostas contêm timestamps formatados com offset explícito de fuso horário `America/Sao_Paulo` (`-03:00`).

---
*Contrato de interface externa para a V1 com suporte a devolução e fechamento financeiro.*
