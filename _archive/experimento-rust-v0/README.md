# Arquivo: Experimento Rust/Axum V0

> Data: 2026-07-27 · Referência: ADR-001

## Contexto de Arquivamento

Esta pasta contém código experimental de V0 da stack backend/frontend que foi descontinuado em favor da stack TypeScript homologada (ADR-001/ADR-002).

### Por que arquivado?

1. **Backend Rust (`backend/`):**
   - Divergências críticas com o DDL canônico (`supabase/migrations/001_schema.sql`)
   - Modelo de comissão (percentual) vs. especificação (valor fixo)
   - Nomes de colunas/tabelas inconsistentes (e.g., `status_venda` vs `status`, `percentual_comissao` vs `valor_comissao_fixo`)
   - **Não compila** contra o schema PostgreSQL de produção
   - Referencia ADR-001 como record do experimento que não deve ser descartado — preservado aqui

2. **Frontend Next.js antigo (`frontend/`):**
   - Duplicação com novo scaffold em `src/` (ambos Next.js 14 PWA)
   - Gerado antes da decisão arquitetural ADR-001/002 ser finalizada
   - Stack TypeScript centralizada em `src/` é a canonical implementation

3. **Scripts SQL (`scripts/`):**
   - `seed_cursos.sql` referencia colunas obsoletas (`valor_curso`, `data_inicio_curso`, `ativo`)
   - Enum values (`'Técnico'`, etc.) violam CHECK constraint do DDL atual
   - Gerado contra schema antigo, incompatível com `001_schema.sql`

## Localização da Stack Ativa

- **Backend:** `supabase/functions/` (Edge Functions, Deno/TypeScript)
- **Frontend:** `src/` (Next.js 14 App Router, PWA)
- **Schema:** `supabase/migrations/001_schema.sql` (fonte canônica)
- **Implementação:** `_reversa_forward/001-implementar-v1-comissionamento/`

## Como Desarchivar?

Se precisar ressuscitar qualquer parte deste experimento, copie de volta para a raiz do projeto e integre manualmente contra a stack TypeScript atual. Não recomendado sem arquitetura explícita.

## Decisão Técnica

Veja `_reversa_sdd/decisions-gate.md` seção ADR-001 e ADR-002 para a justificativa formal da stack TypeScript fim-a-fim.

---

**Mantido como record de decisão arquitetural, conforme ADR-001.**
