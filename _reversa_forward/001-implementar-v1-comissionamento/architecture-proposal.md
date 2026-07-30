# Proposta de Arquitetura - Sistema de Comissionamento e Vendas V1

## 1. Overview Geral

Sistema de gestão de vendas e comissionamento para instituição educacional, com foco em auditoria, segurança de dados e rastreabilidade completa. Stack: TypeScript End-to-End (Next.js 14 + Supabase Edge Functions/Deno), PostgreSQL 16.

## 2. Storage Privado (Supabase Storage)

### 2.1 Buckets

```
├── comprovantes/
│   └── {venda_uuid}/{file_uuid}.pdf
├── documentos_alunos/
│   └── {aluno_uuid}/{tipo}/{file_uuid}.pdf
└── contratos_pdf/
    └── {venda_uuid}/{contrato_uuid}.pdf
```

### 2.2 Signed URLs

- **Validade**: 15 minutos
- **Gerador**: Edge Function `gerar-contrato` ou endpoint de download
- **Escopo**: Usuário autenticado via JWT
- **Rate limiting**: 10 requisições por minuto por usuário (opcional)

### 2.3 RLS Strategy no Storage

- **comprovantes/**: VENDEDOR faz UPLOAD, AUDITOR/GESTOR fazem SELECT, DELETE bloqueado
- **documentos_alunos/**: VENDEDOR/SECRETARIA fazem UPLOAD, AUDITOR/GESTOR fazem SELECT, DELETE bloqueado
- **contratos_pdf/**: Apenas Edge Function faz INSERT (service role), usuários fazem SELECT, DELETE bloqueado

## 3. Data Model

### 3.1 Entidades Principais

- **Cursos**: Referência estática, categorias, comissão fixa
- **Alunos**: Dados PII (CPF único), documentação rastreável
- **Vendas**: Transação educacional, status auditável, imutabilidade cadastral
- **Comissões**: Vinculada 1..1 com Venda, status com trava de início de aulas
- **Livro de Caixa**: Append-only, imutável, rastreia crédito/débito

### 3.2 Fluxo de Status

```
Venda: PENDENTE_VALIDACAO → APROVADA (ou DEVOLVIDA_AJUSTE)
Comissão: AGUARDANDO_INICIO_AULAS → LIBERADA_PAGAMENTO → PAGA
```

## 4. Edge Functions

### 4.1 Funções Síncronas

- **vendas**: POST criar venda, GET listar com filtros
- **auditoria-aprovar**: POST transiciona PENDENTE_VALIDACAO → APROVADA
- **auditoria-devolver**: POST transiciona APROVADA → DEVOLVIDA_AJUSTE com motivo
- **gerar-contrato**: GET gera PDF, armazena, retorna signed URL (15 min)

### 4.2 Funções Agendadas (Scheduled)

- **fechamento-mensal**: Cron 1º dia mês, 00:05 UTC-3
- **liberar-comissoes-diaria**: Cron diária 10:00 UTC-3, varredura AGUARDANDO_INICIO_AULAS

## 5. Segurança & Compliance

### 5.1 Autenticação

- JWT via Supabase Auth
- Claim `app_metadata.app_role`: VENDEDOR, SECRETARIA, AUDITOR, GESTOR
- Rate limiting em endpoints sensíveis

### 5.2 Auditoria

- `vendas_historico_status`: toda mudança de status
- `livro_caixa_lancamentos`: append-only, imutável
- Logs de acesso a documentos (opcional)

### 5.3 Data Sensitivity

- CPF criptografado em repouso (opcional)
- Documentos em storage privado com signed URLs efêmeras
- Nunca expor valores em APIs públicas

## 6. Fluxo de Integração Front-end

```
PWA (Next.js 14) ──JWT──> Supabase Auth
                  ├──RLS──> PostgreSQL
                  ├─────> Storage
                  └──HTTP──> Edge Functions
```

**Offline-first (opcional):**
- Service Worker com cache de cursos
- Fila de requisições offline

## 7. Backlog Futuro

- [ ] Webhook de confirmação de pagamento
- [ ] Relatório visual em tempo real (analytics)
- [ ] Exportar livro de caixa para ERP
- [ ] 2FA para AUDITOR/GESTOR
- [ ] Assinatura digital de contratos (DocuSign/similar)
