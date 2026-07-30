# Pesquisa Técnica e Decisões de Arquitetura (Investigation)

> Identificador: `001-implementar-v1-comissionamento`  
> Data: `2026-07-23`  
> Requirements: `_reversa_forward/001-implementar-v1-comissionamento/requirements.md`  

> ⚠️ **SUPERSEDED em 2026-07-27** — As conclusões de stack desta investigação (seções 2.1, 2.3 e 2.4, e o exemplo de código em 3.1) foram **supersedidas pela ADR-001/002** (`_reversa_sdd/decisions-gate.md` seção 4): a stack homologada é **TypeScript fim-a-fim** (Next.js + Supabase Edge Functions em Deno/TS), e o backend Rust/Axum + Typst CLI foi descartado como experimento. Este documento permanece como **registro pontual da investigação original**; para a stack vigente, consulte o `roadmap.md` revisado e o `decisions-gate.md` seção 4. As decisões de domínio (RLS nativo em 2.2, timezone em 2.5, imutabilidade contábil em 3.2) permanecem válidas.

---

## 1. Contexto e Objetivos da Pesquisa

Esta pesquisa analisa as alternativas técnicas e os padrões arquiteturais escolhidos para a implementação da V1 do **Sistema de Comissionamento e Vendas**. A análise fundamenta a stack homologada na `architecture-proposal.md` e garante aderência integral às decisões de negócio (`decisions-gate.md`).

---

## 2. Análise de Alternativas Avaliadas

### 2.1. Framework do Backend Core (Rust Axum vs Node.js Fastify)

- **Opção Escolhida:** **Rust (Axum + SQLx)**.
  - *Justificativa:* O backend candidato explícito em Rust garante consumo de memória previsível e latências consistentes. A segurança de tipos e o modelo de concorrência do Rust evitam *race conditions* no cálculo de comissões e no processamento concorrente do hash SHA-256 dos comprovantes.
  - *Alternativa Descartada:* Node.js (Fastify / NestJS). Descartado pela maior pegada de memória e risco de mutabilidade acidental em rotinas financeiras e de auditoria.

### 2.2. Modelo de Segurança e Autorização (PostgreSQL RLS Nativo vs Middleware de Aplicação)

- **Opção Escolhida:** **PostgreSQL RLS Nativo com Injeção Transacional via Supabase Auth**.
  - *Justificativa:* Atende perfeitamente à DEC-04 (isolamento idêntico entre Vendedor e Secretaria). Ao executar as queries sob a role `authenticated` (sem `BYPASSRLS`) com injeção de `set_config('request.jwt.claims', ...)`, o banco de dados garante o isolamento mesmo se um desenvolvedor esquecer de filtrar a query no código.
  - *Alternativa Descartada:* Validação exclusiva em middleware de aplicação. Descartado por representar risco de vazamento de dados em rotas novas ou mal configuradas.

### 2.3. Validação de Comprovante de Pagamento (Hash SHA-256 Server-Side vs Client-Side)

- **Opção Escolhida:** **Recálculo Server-Side no Backend Rust + Constraint Única de Banco (DEC-05)**.
  - *Justificativa:* O hash pré-calculado no PWA é apenas uma melhoria de UX. A validação autoritativa é realizada pelo Rust lendo o stream/buffer do arquivo enviado. A constraint `UNIQUE (sha256_checksum)` no PostgreSQL resolve nativamente corridas de upload simultâneo retornando HTTP `409 Conflict`.
  - *Alternativa Descartada:* Confiar apenas no hash enviado pelo cliente frontend. Descartado por vulnerabilidade de bypass por requisições HTTP forjadas.

### 2.4. Motor de Geração de Contratos em PDF (Typst CLI vs Puppeteer/Headless Chrome)

- **Opção Escolhida:** **Typst CLI compilado em Rust + Storage Privado**.
  - *Justificativa:* Typst gera minutas de contrato em PDF extremamente leves, com tipografia perfeita e em poucos milissegundos, consumindo mínimo de RAM. O PDF compilado é salvo no Supabase Storage Privado e entregue via Signed URL pré-assinada.
  - *Alternativa Descartada:* Puppeteer Headless Chrome. Descartado pelo consumo excessivo de memória (centenas de MBs por processo de navegação).

### 2.5. Timezone Operacional Padronizado (`America/Sao_Paulo` vs UTC)

- **Opção Escolhida:** **`America/Sao_Paulo` (UTC-3)**.
  - *Justificativa:* Homologado pelo usuário (HOM-20260723-001). Alinha exatamente o corte do fechamento financeiro mensal (DEC-06: 23:59:59 do último dia do mês) e a avaliação da trava de início das aulas (DEC-03) com o horário oficial brasileiro da operação.
  - *Alternativa Descartada:* UTC bruto. Descartado pelo risco de alocar vendas do último dia do mês (ex: 21h em SP = 00h UTC do dia 1º) no mês contábil errado.

---

## 3. Padrões de Implementação Recomendados

1. **Transaction Scoping em Rust/SQLx:**
   Sempre envelopar queries dependentes de RLS em uma transação SQL explicitando o escopo da sessão:
   ```rust
   let mut tx = pool.begin().await?;
   sqlx::query("SET LOCAL ROLE authenticated;").execute(&mut tx).await?;
   sqlx::query("SELECT set_config('request.jwt.claims', $1, true);")
       .bind(&jwt_claims_json)
       .execute(&mut tx)
       .await?;
   // Queries da aplicação...
   tx.commit().await?;
   ```
2. **Imutabilidade Contábil:**
   A tabela `livro_caixa_lancamentos` deve conter triggers SQL que disparam exceção caso um comando `UPDATE` ou `DELETE` seja executado.

---
*Documento de investigação elaborado para suporte técnico da V1.*
