# Data Delta: Cadastro Unificado Aluno + Venda

> Identificador: `004-cadastro-unificado-aluno-venda`
> Data: `2026-09-10`

## Resumo

Sem mudanças no schema do banco de dados. A feature é puramente de frontend — reutiliza as tabelas `alunos`, `vendas`, `evidencias_vendas` e `comissoes` existentes, bem como a Edge Function `vendas` que já aceita `aluno_id` como parâmetro.

## Tabelas afetadas

| Tabela | Tipo de mudança | Detalhe |
|--------|----------------|---------|
| `alunos` | n/a | Já possui todos os campos necessários (nome, cpf, email, telefone, criado_por) |
| `vendas` | n/a | Já referencia `alunos(id)` e `cursos(id)` |
| `evidencias_vendas` | n/a | Já suporta upload de comprovante com SHA-256 |
| `comissoes` | n/a | Já é criada automaticamente pela Edge Function `vendas` |

## Índices existentes utilizados

- `idx_alunos_cpf ON alunos(cpf)` — usado na query de detecção de duplicidade

## Migrações necessárias

Nenhuma.

## Queries novas no frontend

```sql
-- Detecção de duplicidade por CPF (antes do submit)
SELECT id, nome, cpf FROM alunos WHERE cpf = $1;

-- Verificação de documentos pendentes (após cadastro)
SELECT tipo, storage_path FROM documentos_alunos WHERE aluno_id = $1;
```

Ambas usam tabelas e índices já existentes. Sem necessidade de novos grants ou policies RLS.
