# Requirements: Cadastro Unificado Aluno + Venda

> Identificador: `004-cadastro-unificado-aluno-venda`
> Data: `2026-09-10`
> Pasta da extração reversa: `_reversa_sdd/`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA / DÚVIDA

## 1. Resumo executivo

Unificação dos formulários de cadastro de aluno (`/alunos/novo`) e lançamento de venda (`/vendas/novo`) num único fluxo. O vendedor cadastra o aluno, seleciona o curso, informa o valor da entrada e anexa o comprovante de pagamento em uma única tela, eliminando a necessidade de navegar entre duas páginas separadas. A venda é criada automaticamente junto com o cadastro do aluno, mantendo a integrity referencial e o fluxo de auditoria existente.

## 2. Contexto a partir do legado

| Fonte | Trecho relevante | Confidência |
|-------|------------------|-------------|
| `_reversa_sdd/inventory.md#2` | Sistema possui frontend em Next.js (App Router) e backend via Supabase Edge Functions (PostgreSQL). | 🟢 |
| `_reversa_sdd/inventory.md#6` | Tabela `vendas` referencia `alunos(id)` e `cursos(id)` com ON DELETE RESTRICT. Trigger `trg_prevent_vendas_data_mutation` bloqueia alteração de `aluno_id`, `curso_id`, `valor_entrada` e `criado_por` após criação. | 🟢 |
| `_reversa_sdd/inventory.md#9` | Módulos: `frontend-alunos` (cadastro/documentação) e `apontamento-vendas-cotacoes` (registro de venda com comprovante). | 🟢 |
| `_reversa_sdd/sdd/apontamento-vendas-cotacoes.md#RF-02` | Conversão de cotação em venda exige: Aluno, Curso, Valor Pago, Meio de Pagamento, Evidência em Imagem, Checklist de Documentos. | 🟡 |
| `_reversa_sdd/sdd/cadastro-alunos-documentacao.md#RF-01` | Cadastro de aluno exige: Nome Completo, CPF, Data de Nascimento, Telefone/WhatsApp, E-mail. Validação de CPF e dados de responsável para menores. | 🟡 |
| `_reversa_sdd/addenda/001-implementar-v1-comissionamento.md` | V1 entregue: Edge Function `vendas` cria venda + evidência + comissão atomicamente. SHA-256 anti-fraude. | 🟢 |

## 3. Personas e cenários de uso

| Persona | Objetivo | Cenário-chave |
|---------|----------|---------------|
| Marcos Vendedor | Cadastrar novo aluno e registrar a primeira venda num único passo | Acessa uma única tela, preenche dados do aluno, seleciona curso, informa valor e anexa comprovante — tudo de uma vez. |
| Ana Secretaria | Cadastrar aluno de balcão com venda simultânea | No atendimento presencial, cadastra o aluno e lança a venda com comprovante sem trocar de tela. |
| Roberto Gestor | Acompanhar vendas com dados completos | Visualiza no dashboard que a venda foi criada junto com o cadastro, sem inconsistências entre telas. |

## 4. Regras de negócio novas ou alteradas

1. **RN-01:** O cadastro de um aluno novo pode, opcionalmente, incluir o lançamento da primeira venda vinculada. 🟡
   - Tipo: nova
2. **RN-02:** Quando a venda é incluída no cadastro, todos os campos obrigatórios da venda (curso, valor_entrada, data_inicio_curso, comprovante) devem ser preenchidos. 🟡
   - Tipo: nova
3. **RN-03:** O cadastro de aluno sem venda continua funcionando isoladamente (o fluxo atual `/alunos/novo` não é removido). 🟡
   - Tipo: nova
4. **RN-04:** A criação do aluno e da venda deve ser atômica — ou ambas são criadas com sucesso, ou nenhuma é criada. A orquestração fica no frontend: cria o aluno e, em seguida, chama a Edge Function `vendas`; se a venda falhar, o frontend remove o aluno recém-criado (compensação). 🟢
   - Tipo: nova
5. **RN-05:** O upload do comprovante segue o mesmo padrão anti-fraude (SHA-256, bucket `comprovantes`) já implementado na Edge Function `vendas`. 🟢
   - Origem no legado: `_reversa_sdd/sdd/apontamento-vendas-cotacoes.md#RF-02`
   - Tipo: nova

## 5. Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-01 | Formulário unificado de cadastro + venda | Must | Uma única tela contém os campos de cadastro de aluno (Nome, CPF, E-mail, Telefone) E os campos de venda (Curso, Valor de Entrada, Data de Início, Comprovante). O envio cria o aluno e, na sequência, a venda via Edge Function `vendas`, com compensação do aluno em caso de falha. | 🟢 |
| RF-02 | Validação de CPF no unificado | Must | O CPF deve ser validado (formato e dígito verificador) antes do envio, idêntico ao fluxo atual de `/alunos/novo`. | 🟢 |
| RF-03 | Detecção de aluno duplicado por CPF | Must | Checagem client-side no blur do CPF + validação server-side no submit (constraint UNIQUE de `alunos.cpf`). Se o CPF já existir, exibe alerta com o nome mascarado e permite vincular a venda ao aluno existente; ao confirmar, os dados do aluno aparecem em modo somente leitura. Vínculo permitido mesmo para aluno criado por outro vendedor (a venda pertence ao usuário logado). | 🟢 |
| RF-04 | Seleção de curso com exibição de dados | Must | O seletor de curso exibe nome e categoria. Valores de comissão não são exibidos nesta etapa. | 🟡 |
| RF-05 | Upload de comprovante | Must | O formulário inclui upload de arquivo (imagem/PDF) com preview, validação de tamanho (≤5MB) e envio para o bucket `comprovantes`. | 🟢 |
| RF-06 | Modo sem venda (cadastro isolado) | Must | Um checkbox ou toggle permite ao vendedor optar por cadastrar o aluno SEM incluir venda. Neste modo, os campos de venda ficam ocultos e apenas o cadastro do aluno é criado. | 🟡 |
| RF-07 | Feedback de sucesso | Must | Após envio bem-sucedido com venda, exibe confirmação com dados resumidos (nome do aluno, curso, valor). Após envio sem venda, exibe confirmação de cadastro do aluno. | 🟡 |
| RF-08 | Rota unificada acessível | Must | A nova rota `/cadastro-unificado` está disponível no menu lateral para VENDEDOR e SECRETARIA, sem remover as rotas antigas (`/alunos/novo`, `/vendas/novo`) nem conflitar com `/cadastro` (signup). | 🟢 |
| RF-09 | Sinalização de documentos pendentes | Should | Ao cadastrar um aluno novo, a tela exibe checklist fixo (RG, CPF, Comprovante de Residência, Histórico) com os pendentes inferidos pela ausência de registros em `documentos_alunos`, sem exigir anexo e sem criar linhas. | 🟢 |

## 6. Requisitos Não Funcionais

| Tipo | Requisito | Evidência ou justificativa | Confidência |
|------|-----------|----------------------------|-------------|
| Usabilidade | Redução de etapas: cadastro + venda em ≤ 5 minutos | Elimina navegação entre duas telas; meta de usabilidade do `apontamento-vendas-cotacoes.md` (≤ 3 toques para venda) | 🟡 |
| Integridade | Transação atômica aluno + venda | Padrão já usado na Edge Function `vendas` (INSERT venda + evidência + comissão em transação) | 🟢 |
| Segurança | RLS preservado: vendedor só enxerga seus próprios lançamentos | Padrão confirmado em `inventory.md#6` e `code-analysis.md` | 🟢 |
| Performance | Tempo de carregamento do formulário < 2s | Formulário carrega lista de cursos e validações client-side | 🟡 |

## 7. Critérios de Aceitação

```gherkin
Cenário: Vendedor cadastra aluno novo com venda em um passo
  Dado que o vendedor está autenticado com perfil VENDEDOR
  Quando acessa a tela de cadastro unificado
  E preenche Nome, CPF, E-mail, Telefone do aluno
  E seleciona um curso, informa valor de entrada e data de início
  E anexa um comprovante de pagamento
  E clica em "Cadastrar e Registrar Venda"
  Então o aluno é criado no banco
  E a venda é criada vinculada ao aluno e ao curso
  E o comprovante é armazenado no bucket comprovantes
  E a comissão é criada com status BLOQUEADA_AUDITORIA
  E uma mensagem de sucesso é exibida

Cenário: Vendedor cadastra aluno com CPF já existente
  Dado que o vendedor preenche um CPF que já existe na base
  Quando o sistema detecta o CPF duplicado
  Então exibe alerta "Aluno já cadastrado"
  E oferece opção de vincular a venda ao aluno existente
  E ao confirmar, a venda é criada para o aluno existente sem duplicar cadastro

Cenário: Vendedor cadastra aluno sem incluir venda
  Dado que o vendedor ativa o modo "Apenas cadastro"
  E preenche apenas os dados do aluno (Nome, CPF, E-mail, Telefone)
  E clica em "Cadastrar Aluno"
  Então apenas o aluno é criado no banco
  E nenhuma venda é registrada

Cenário: Validação de campos obrigatórios da venda
  Dado que o vendedor está no modo com venda ativado
  Quando tenta enviar sem preencher curso, valor ou comprovante
  Então o sistema bloqueia o envio e destaca os campos faltantes

Cenário: Falha na criação atomica
  Dado que ocorre um erro ao inserir a venda no banco
  Quando o sistema detecta a falha
  Então o cadastro do aluno também é desfeito (rollback)
  E uma mensagem de erro amigável é exibida

Cenário: Cadastro de aluno novo exibe documentos pendentes
  Dado que o vendedor está no modo "Apenas cadastro"
  Quando o aluno é cadastrado com sucesso
  Então o sistema exibe indicadores visuais dos documentos pendentes (RG, Comprovante de Residência, Histórico)
  E não exige anexo dos documentos no ato do cadastro
```

## 8. Prioridade MoSCoW

| Item | MoSCoW | Justificativa |
|------|--------|---------------|
| RF-01 Formulário unificado | Must | Objetivo central da feature: eliminar navegação entre duas telas |
| RF-02 Validação de CPF | Must | Requisito herdado do cadastro atual, não pode ser perdido |
| RF-03 Detecção de duplicidade | Must | Evita cadastros duplicados que quebram integridade |
| RF-04 Seleção de curso com dados | Should | Melhora experiência mas não é bloqueante |
| RF-05 Upload de comprovante | Must | Requisito obrigatório para criação de venda (anti-fraude) |
| RF-06 Modo sem venda | Must | Flexibilidade para quando o aluno já existe ou venda será feita depois |
| RF-07 Feedback de sucesso | Should | UX importante mas não bloqueante |
| RF-08 Rota unificada no menu | Must | Acesso à funcionalidade depende de estar no menu |
| RF-09 Sinalização documentos pendentes | Should | Melhora visibilidade mas não é bloqueante |

## 9. Esclarecimentos

### Sessão 2026-09-10

- **Q:** A rota unificada deve substituir completamente as rotas `/alunos/novo` e `/vendas/novo`, ou ambas devem coexistir com a nova?
  **R:** Manter as duas antigas funcionando e adicionar a nova rota como terceira opção.
- **Q:** Quando o aluno já existe e o vendedor vincula a venda, o formulário deve pré-preencher os dados do aluno (somente leitura) ou permitir edição?
  **R:** Pré-preencher os dados do aluno em modo somente leitura (bloqueado).
- **Q:** O checklist de documentos obrigatório deve ser cobrado no ato do cadastro unificado?
  **R:** Apenas sinalizar quais documentos estão pendentes, sem exigir anexo agora.
- **Q:** Quais dados do curso devem ser exibidos no seletor?
  **R:** Apenas Nome e Categoria. Não exibir valor de comissão nesta etapa, pois as comissões podem ser variáveis.

### Sessão 2026-09-15

- **Q:** Onde deve viver a transação atômica de aluno + venda (RN-04) — nova Edge Function, orquestração no frontend ou RPC?
  **R:** Orquestração no frontend (opção b): cria o aluno e, em seguida, chama a Edge Function `vendas` existente. Se a criação da venda falhar, o frontend executa a compensação removendo o aluno recém-criado. Sem nova Edge Function nem RPC nesta feature.
- **Q:** Qual rota usar para a tela unificada, já que `/cadastro` é o signup público?
  **R:** `/cadastro-unificado`. Rota nova, sem conflito com `/cadastro` (signup) nem com `/alunos/novo` e `/vendas/novo`, que continuam existindo.
- **Q:** Quando e como detectar/alertar CPF duplicado (RF-03)?
  **R:** Defesa em profundidade com baixa fricção: checagem client-side no blur do campo CPF (consulta a `alunos`) para avisar antes do preenchimento completo e validação server-side no submit, tratando a constraint UNIQUE de `alunos.cpf`. No alerta, o nome do aluno existente é exibido mascarado; ao optar por vincular, os dados completos aparecem em modo somente leitura.
- **Q:** Vincular venda a aluno criado por outro vendedor é permitido?
  **R:** Sim (opção a). A venda passa a pertencer ao vendedor logado (`criado_por` da venda) e o aluno mantém o `criado_por` original. Não há transferência de titularidade do aluno.
- **Q:** Como sinalizar documentos pendentes sem exigir anexo, se `documentos_alunos.storage_path` é NOT NULL?
  **R:** Checklist fixo na UI (RG, CPF, Comprovante de Residência, Histórico), inferido pela ausência de registros em `documentos_alunos` para o aluno. Nenhuma linha é criada e nenhum anexo é exigido no cadastro.

## 10. Lacunas

> Nenhuma lacuna pendente. As dúvidas de implementação da sessão 2026-09-15 estão resolvidas acima.

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-10 | Versão inicial gerada por `/reversa-requirements` | reversa |
| 2026-09-10 | `/reversa-clarify`: 4 dúvidas resolvidas (rotas antigas mantidas, dados do aluno em read-only no vínculo, documentos sinalizados sem exigência, sem exibir comissão no seletor) | reversa-clarify |
| 2026-09-15 | `/reversa-clarify`: 5 dúvidas resolvidas (atomicidade por orquestração no frontend, rota `/cadastro-unificado`, detecção de CPF no blur + submit, vínculo cross-vendedor permitido, checklist de documentos inferido) | reversa-clarify |
