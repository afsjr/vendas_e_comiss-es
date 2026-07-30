# Requirements: V1 do Sistema de Comissionamento e Vendas

> Identificador: `001-implementar-v1-comissionamento`  
> Data: `2026-07-23`  
> Pasta da extração reversa: `_reversa_sdd/`  
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA / DÚVIDA

---

## 1. Resumo executivo

A V1 do Sistema de Comissionamento e Vendas automatiza a gestão comercial e financeira de matrículas de alunos, substituindo fichas em papel e contatos via WhatsApp. O sistema disponibiliza um PWA responsivo para apontamentos de vendas e cotações, cadastro de alunos, auditoria de comprovantes, apuração de comissões fixas, emissão de minutas de contrato e relatórios mensais do Livro-Caixa, garantindo imutabilidade contábil e segurança via RLS no banco de dados.

---

## 2. Contexto a partir do legado

| Fonte | Trecho relevante | Confidência |
|-------|------------------|-------------|
| `_reversa_sdd/decisions-gate.md#1-decisoes-de-negocio-homologadas` | Decisões homologadas DEC-01 a DEC-07 (Entrada inicial V1, Comissão fixa em R$, Trava de início de aulas, RLS Vendedor/Secretaria, Hash SHA-256 único, Fechamento mensal e Indicadores separados). | 🟢 |
| `_reversa_sdd/prd.md#3-requisitos-funcionais` | Especificação de requisitos de produto para vendas, auditoria e comissionamento. | 🟢 |
| `_reversa_sdd/sdd/autenticacao-controle-acesso.md` | Matriz de permissões RBAC e políticas de acesso por perfil. | 🟢 |
| `_reversa_sdd/sdd/apontamento-vendas-cotacoes.md` | Fluxo de lançamento de vendas e anexação de comprovantes. | 🟢 |
| `_reversa_sdd/sdd/comissoes-livro-caixa.md` | Máquina de estados das comissões e lançamentos no livro-caixa. | 🟢 |
| `.reversa/architecture-proposal.md#41-modelo-executavel-de-rls` | Arquitetura homologada: Next.js/Vercel (PWA), Supabase Edge Functions (Deno/TS), Supabase Cloud (PostgreSQL 16 com RLS, Auth, Storage Privado) e PDF via biblioteca TS. | 🟢 |
| `_reversa_sdd/decisions-gate.md#4-decisoes-de-arquitetura-adrs` | ADR-001/002: stack TypeScript fim-a-fim (Next.js + Edge Functions); backend Rust descartado como experimento. | 🟢 |

---

## 3. Personas e cenários de uso

| Persona | Objetivo | Cenário-chave |
|---------|----------|---------------|
| **Vendedor Comercial** | Apontar vendas com entrada inicial e gerar minutas de contrato. | Registra venda do curso no PWA, envia foto do comprovante e acompanha status de comissão. |
| **Secretaria** | Cadastrar alunos, validar documentação e registrar matrículas diretas. | Registra matricula de aluno no balcão com isolamento estrito à sua própria produção. |
| **Auditor Financeiro** | Conferir comprovantes de pagamento e aprovar/devolver vendas. | Revisa o comprovante anexado via URL temporária e aprova a venda para liberação de comissão. |
| **Gestor Comercial** | Acompanhar métricas consolidadas e fechamento financeiro mensal. | Visualiza o dashboard de faturamento, taxa de contratos emitidos e relatórios do Livro-Caixa. |

---

## 4. Regras de negócio novas ou alteradas

1. **RN-01 (Escopo de Pagamento V1 - DEC-01):** O sistema registra apenas a entrada inicial (matrícula/primeiro pagamento) e seu comprovante em imagem. Controle de parcelamento e boletos futuros fica fora da V1. 🟢
2. **RN-02 (Regra de Comissão Fixa - DEC-02):** Cada curso possui um valor fixo em R$ (`valor_comissao_fixo`) cadastrado na tabela de cursos, substituindo percentuais dinâmicos. 🟢
3. **RN-03 (Gatilho de Liberação de Comissão - DEC-03):** A comissão é transicionada para `LIBERADA_PAGAMENTO` exclusivamente se `status_venda == APROVADA` E `data_inicio_curso <= HOJE`. 🟢
4. **RN-04 (Isolamento RLS da Secretaria - DEC-04):** O perfil Secretaria enxerga apenas suas próprias vendas e matrículas, possuindo exatamente a mesma regra de isolamento por RLS que o Vendedor Comercial. 🟢
5. **RN-05 (Comprovante Único por Hash SHA-256 - DEC-05):** 1 Comprovante = 1 Venda. A Edge Function valida conclusivamente o hash SHA-256 dos bytes do comprovante no server-side (`crypto.subtle`), e o PostgreSQL rejeita duplicidades via constraint única (`unique_hash_sha256`). 🟢
6. **RN-06 (Fechamento Mensal e Imutabilidade - DEC-06):** Fechamento financeiro mensal (corte no último dia às 23:59:59). Registros na tabela `livro_caixa_lancamentos` são estritamente *append-only* (triggers impedem `UPDATE` e `DELETE`). 🟢
7. **RN-07 (Métricas Separadas - DEC-07):** Exibição de 2 indicadores distintos no dashboard: (1) Taxa de Emissão de Contrato (% com minuta) e (2) Taxa de Regularização Documental (% com checklist 100%). 🟢

---

## 5. Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| **RF-01** | Apontamento de Venda e Cotação | Must | Permite registro de venda com dados do aluno, curso selecionado e valor de entrada inicial no PWA. | 🟢 |
| **RF-02** | Validação Server-Side de Comprovante SHA-256 | Must | A Edge Function recalcula o SHA-256 do comprovante (bytes buscados do Storage Privado via service role) e bloqueia envios duplicados com HTTP `409 Conflict`. | 🟢 |
| **RF-03** | Cadastro e Checklist de Documentos do Aluno | Must | Registra RG, CPF, Comprovante de Residência e Histórico, permitindo emissão de contrato com ressalva documental. | 🟢 |
| **RF-04** | Auditoria e Devolução de Apontamentos | Must | Auditor pode aprovar (`APROVADA`) ou devolver (`DEVOLVIDA_AJUSTE`) com justificativa obrigatória. | 🟢 |
| **RF-05** | Engine de Comissões e Trava de Aulas | Must | Transiciona comissão para `LIBERADA_PAGAMENTO` somente após aprovação do auditor E atingida a data de início do curso. | 🟢 |
| **RF-06** | Livro-Caixa Imutável (*Append-Only*) | Must | Grava pagamentos de comissão e estornos como novos lançamentos auditáveis sem alteração de registros passados. | 🟢 |
| **RF-07** | Geração de Minuta de Contrato em PDF | Must | Edge Function em TS gera o PDF (biblioteca compatível com Deno), armazena no Storage Privado e retorna Signed URL temporária (15 min). | 🟢 |
| **RF-08** | Dashboard Gerencial Mensal | Should | Exibe faturamento por curso, comissões apuradas, taxa de minutas geradas e taxa de regularização documental. | 🟢 |

---

## 6. Requisitos Não Funcionais

| Tipo | Requisito | Evidência ou justificativa | Confidência |
|------|-----------|----------------------------|-------------|
| **Segurança / RLS** | RLS nativo no PostgreSQL aplicado ao client Supabase (leitura) e à Edge Function (mutações), sem privilégio `BYPASSRLS`. Claim protegida `app_metadata.app_role` lida via `request.jwt.claims`. Service role usada apenas nas Edge Functions server-side. | `_reversa_sdd/decisions-gate.md#4-decisoes-de-arquitetura-adrs` | 🟢 |
| **Privacidade / Storage** | Comprovantes e documentos armazenados em Supabase Storage Privado, acessíveis exclusivamente por Signed URLs com tempo de expiração de 15 minutos. | `.reversa/architecture-proposal.md#21-stack-recomendada` | 🟢 |
| **Arquitetura & Hosting** | Frontend PWA Next.js na Vercel, mutações sensíveis em Supabase Edge Functions (Deno/TS), PostgreSQL 16 no Supabase Cloud (ADR-001/002). | `_reversa_sdd/decisions-gate.md#4-decisoes-de-arquitetura-adrs` | 🟢 |
| **Padronização Temporal** | Aplicação estrita do Timezone Operacional `America/Sao_Paulo` (UTC-3) em cortes mensais de fechamento (DEC-06), avaliações diárias de início de aulas (DEC-03) e relatórios de gestão. | `.reversa/architecture-proposal.md#5-tempo-de-negocio` | 🟢 |

---

## 7. Critérios de Aceitação

```gherkin
Cenário: Tentar cadastrar venda com comprovante já utilizado
  Dado que um comprovante de imagem possui o hash SHA-256 "a1b2c3d4..." já existente no banco
  Quando o Vendedor tenta enviar um novo apontamento com o mesmo arquivo de imagem
  Então a Edge Function recalcula o SHA-256 server-side (bytes do Storage)
  E a transação é rejeitada com HTTP 409 Conflict por violação da constraint unique_hash_sha256.

Cenário: Garantir isolamento RLS de Vendedor e Secretaria
  Dado que o Vendedor A está autenticado com app_role "VENDEDOR" no JWT
  Quando o Vendedor A tenta fazer SELECT ou INSERT de vendas em nome do Vendedor B
  Então o PostgreSQL aplica a política RLS com USING e WITH CHECK via request.jwt.claims
  E a operação falha ou retorna 0 registros.

Cenário: Liberação de comissão mediante trava de início das aulas
  Dado que a venda V001 foi aprovada pelo auditor (status_venda == APROVADA)
  E a data de início do curso é futura (data_inicio_curso > HOJE)
  Quando a engine de comissão processa a venda
  Então o status_comissao é definido como AGUARDANDO_INICIO_AULAS
  E transiciona para LIBERADA_PAGAMENTO somente quando a data de início for atingida (data_inicio_curso <= HOJE).

Cenário: Garantia de imutabilidade do Livro-Caixa
  Dado um lançamento financeiro gravado na tabela livro_caixa_lancamentos
  Quando um usuário ou serviço tenta executar um UPDATE ou DELETE no registro
  Então o trigger de banco rejeita a operação com erro de imutabilidade contábil.
```

---

## 8. Prioridade MoSCoW

| Item | MoSCoW | Justificativa |
|------|--------|---------------|
| **RF-01, RF-02, RF-04, RF-05** | Must | Funcionalidades vitais do fluxo de vendas, auditoria e comissionamento. |
| **RNF (RLS + SHA-256 Server-Side)** | Must | Requisitos inegociáveis de segurança e integridade de dados. |
| **RF-03, RF-06, RF-07** | Must | Essenciais para a regularização contratual, documental e financeira V1. |
| **RF-08 (Dashboard Gerencial)** | Should | Importante para a visão gerencial, dependente da massa de dados das vendas. |

---

## 9. Esclarecimentos

> Nenhuma sessão de dúvidas registrada ainda. Rode `/reversa-clarify` quando houver `[DÚVIDA]` pendente.

---

## 10. Lacunas

> Nenhuma lacuna pendente. O fuso horário `America/Sao_Paulo` (UTC-3) foi homologado como decisão confirmada para fechamentos mensais, avaliações diárias e relatórios.

---

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-07-23 | Versão inicial consolidada para a V1 (PL-00) | reversa |
| 2026-07-23 | Atualização pós REV-20260723-004: confirmação do timezone America/Sao_Paulo (🟢) | reversa |
| 2026-07-27 | Revisão de stack para TypeScript (ADR-001/002): RF-02/RF-07/RNF/RLS e critérios de aceite reescritos de Rust/Axum para Supabase Edge Functions. | reversa |

