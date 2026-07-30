# Adendo: Tela para criar novo usuário

> Identificador: 002-tela-criar-novo-usuario
> Data: 2026-07-30
> Cenário: legado

## Vigência
Vigente desde 2026-07-30.

## Resumo da entrega
Permitir o cadastro livre de novos usuários (com cargo padrão de VENDEDOR) e criar um painel administrativo para os GESTORES gerenciarem os cargos dos demais usuários. Foram concluídas **9 ações**.

## Impacto por artefato da extração

| Artefato | Seção | Tipo de impacto | Delta |
|----------|-------|-----------------|-------|
| `architecture.md` | Banco de Dados / DB Schema | componente-novo | Introduz a tabela `public.perfis` e trigger de sincronia com Auth |
| `architecture.md` | Frontend / Rotas | componente-novo | Adiciona rotas `/cadastro` (público) e `/admin/usuarios` (gestor) |
| `architecture.md` | Frontend / Core | componente-novo | Middleware global adicionado para bloquear rotas `/admin` para não-gestores |
| `data-dictionary.md` | Auth Roles | regra-nova | Adição do tipo/interface `Perfil` replicando o RLS documentado para o frontend |

## Regras sob vigilância
- W001 (Consulte `_reversa_forward/002-tela-criar-novo-usuario/regression-watch.md`)
- W002 (Consulte `_reversa_forward/002-tela-criar-novo-usuario/regression-watch.md`)

## Fontes
- `_reversa_forward/002-tela-criar-novo-usuario/requirements.md`
- `_reversa_forward/002-tela-criar-novo-usuario/legacy-impact.md`
- `_reversa_forward/002-tela-criar-novo-usuario/regression-watch.md`
- `_reversa_forward/002-tela-criar-novo-usuario/progress.jsonl`
