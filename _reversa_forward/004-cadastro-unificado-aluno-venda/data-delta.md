# Data Delta: Cadastro Unificado Aluno + Venda

> Identificador: `004-cadastro-unificado-aluno-venda`
> Data: `2026-09-15`

## Resumo

Nenhuma tabela ou coluna nova. A feature reutiliza `alunos`, `vendas`, `evidencias_vendas` e `comissoes`, bem como a Edge Function `vendas`. O único delta de banco é uma **policy RLS de DELETE em `alunos`**, necessária para viabilizar a compensação do aluno recém-criado quando a venda falha (D-04/D-05 do `roadmap.md`).

> Atualização importante em relação ao plano de 2026-09-10: o texto "sem mudanças de schema" não se sustenta mais. `alunos` tem RLS habilitado em `001_schema.sql` **sem policy de DELETE**; sem a migration abaixo, o `DELETE` do frontend afeta 0 linhas e deixa o cadastro órfão.

## Migração necessária

`supabase/migrations/<timestamp>_alunos_delete_owner_orphan.sql`

```sql
-- Feature 004-cadastro-unificado-aluno-venda
-- Permite ao criador remover um aluno SEM venda (compensação do cadastro unificado).
-- Aluno que já possui qualquer venda permanece indeletável.
CREATE POLICY "Alunos deletable by creator when orphan" ON public.alunos
FOR DELETE USING (
  criado_por = auth.uid()
  AND NOT EXISTS (
    SELECT 1 FROM public.vendas v WHERE v.aluno_id = public.alunos.id
  )
);
```

### Justificativa de segurança

- `criado_por = auth.uid()` impede que um usuário apague aluno alheio.
- `NOT EXISTS (... vendas ...)` preserva a invariante de auditoria: qualquer aluno que já entrou em uma venda é imutável na prática.
- Não concede UPDATE nem DELETE amplo; o restante das policies de `alunos` fica intacto.
- `vendas` continua sem policy de DELETE (imutabilidade mantida por `trg_prevent_vendas_data_mutation`).

## Tabelas afetadas

| Tabela | Tipo de mudança | Detalhe |
|--------|----------------|---------|
| `alunos` | policy-nova (RLS DELETE) | Ver migration acima |
| `vendas` | n/a | Já referencia `alunos(id)`/`cursos(id)`; colunas de pós-venda da feature 003 permanecem nulas na criação |
| `evidencias_vendas` | n/a | Já suporta comprovante com SHA-256 UNIQUE |
| `comissoes` | n/a | Já é criada pela Edge Function `vendas` |
| `documentos_alunos` | n/a | Apenas leitura (SELECT) para inferir pendências; nenhum INSERT |

## Campos usados (sem alteração)

- `alunos`: `nome`, `cpf` (UNIQUE), `email`, `telefone`, `is_whatsapp`, `criado_por`.
- `documentos_alunos`: `aluno_id`, `tipo`, `storage_path`.
- `vendas`: `aluno_id`, `curso_id`, `valor_entrada`, `data_inicio_curso`, `status`, `criado_por`.

## Índices existentes utilizados

- `idx_alunos_cpf ON alunos(cpf)` — detecção de duplicidade.
- `idx_documentos_alunos_aluno_id ON documentos_alunos(aluno_id)` — checklist de pendências.
- `idx_vendas_aluno_id ON vendas(aluno_id)` — suporte ao `NOT EXISTS` da policy de DELETE.

## Queries novas no frontend

```sql
-- 1. Detecção de duplicidade por CPF (blur + submit)
SELECT id, nome FROM alunos WHERE cpf = $1;

-- 2. Checklist de documentos pendentes (após cadastro)
SELECT tipo FROM documentos_alunos WHERE aluno_id = $1;

-- 3. Compensação (somente se a venda falhar)
DELETE FROM alunos WHERE id = $1;   -- permitido só via policy D-05
```

Nenhum novo GRANT é necessário. A policy nova adiciona a operação `DELETE` apenas sob as condições descritas.
