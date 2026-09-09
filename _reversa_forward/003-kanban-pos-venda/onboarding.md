# Onboarding: Kanban de Pós-Venda

> Identificador: `003-kanban-pos-venda`
> Data: `2026-09-09`
> Objetivo: passo a passo executável para validar a feature pela primeira vez num ambiente local/Staging Supabase.

## Pré-requisitos

- Supabase local (CLI) com as migrations aplicadas ou projeto remoto de teste.
- `supabase functions serve` rodando (novo `postvenda-mover` + alterados).
- Frontend `next dev` apontando para o Supabase de teste.
- Usuários com papéis: 1 VENDEDOR, 1 SECRETARIA, 1 FINANCEIRO, 1 AUDITOR/GESTOR.

## Passo a passo

1. **Preparar papéis**
   - Stop in: cadastro ou `/admin/usuarios` → criar usuários com papel SECRETARIA e FINANCEIRO (`atualizarRole` deve agora sincronizar `app_metadata.app_role` — confirme re-login para o JWT carregar o papel novo).
   - Verifique que o JWT do FINANCEIRO carrega `app_metadata.app_role = "FINANCEIRO"` (console do navegador / `useUser`).

2. **Aplicar migrations**
   - `supabase db reset` (ou aplicar os 2 arquivos novos) e confirmar no `001_schema` que as policies novas convivem com as antigas (rodar script de seed).

3. **Criar venda (VENDEDOR)**
   - Logar como VENDEDOR → "Nova Venda" → cadastrar aluno, curso, valor e evidência. A venda nasce `PENDENTE_VALIDACAO`.
   - Confira aparecer na coluna "Aguardando Contrato" do Kanban (visão SECRETARIA).

4. **Fluxo Secretaria**
   - Logar como SECRETARIA → "Pós-Venda" → coluna "Aguardando Contrato".
   - Tentar mover SEM upload: o botão deve estar desabilitado (trava visual).
   - Receber o contrato PDF (testar arquivo em `/tmp`) → upload no bucket `contratos_pdf` → mover para "Financeiro".
   - Testar "Cancelar" com motivo e "Devolver ao Vendedor" com motivo — ambos gravam histórico.

5. **Fluxo Financeiro**
   - Logar como FINANCEIRO → "Pós-Venda" → coluna "Aguardando Financeiro".
   - Mover para "Aguardando 1ª Mensalidade" preenchendo `boleto_referencia` (ex. código fake).
   - Testar "Devolver à Secretaria" com motivo — volta para `PENDENTE_VALIDACAO` com histórico de quem devolveu.
   - Na coluna "Aguardando 1ª Mensalidade": fazer upload do comprovante de pagamento (bucket `comprovantes`, path próprio) → mover para "1ª Mensalidade Paga".

6. **Auditoria final**
   - Logar como AUDITOR/GESTOR → "Auditoria". A fila deve mostrar só vendas em `PRIMEIRA_MENSALIDADE_PAGA`.
   - Tentar aprovar uma venda `PENDENTE_VALIDACAO` direto (manualmente invocando a função): deve falhar com `INVALID_STATE` (trava RN-02).
   - Aprovar a venda do fluxo acima → status `APROVADA`, comissão segue `AGUARDANDO_INICIO_AULAS`/`LIBERADA_PAGAMENTO` conforme `data_inicio_curso`.

7. **Gate do agendador**
   - Simular cron `liberar-comissoes-diaria`: comissões de vendas sem `PRIMEIRA_MENSALIDADE_PAGA` **não** podem ir para `LIBERADA_PAGAMENTO` mesmo com `data_inicio_curso` vencida.

8. **Cancelamento / estorno**
   - Criar outra venda, levar até `AGUARDANDO_PAGAMENTO_1M` e cancelar pela SECRETARIA → venda `CANCELADA`, comissão `ESTORNADA`.

## Verificações esperadas

| Verificação | Resultado esperado |
|-------------|--------------------|
| Botão de mover sem trava | Desabilitado |
| Trava sem upload | Resposta da API `400/TRABVA_BLOQUEADA` (ou similar) |
| Histórico de cada passo | Linha em `vendas_historico_status` com `mudado_por` = usuário logado e `motivo` quando aplicável |
| Aprovação precoce | Bloqueada (INVALID_STATE) |
| Liberação mensal precoce | Comissão permanece travada |
| Papel FINANCEIRO sem acesso à "Auditoria" | Rota/Menu ausentes; chamada direta à função retorna 401 |

## Rollback

- Para reverter: remover a migration nova (reenviar `db reset`) e remover a página `/postvenda`. O `status_venda_enum` extra não pode ser `DROP VALUE`; em ambiente real, recriar o tipo.