# Requirements: Listagem de Alunos com CPF mascarado e trilha de auditoria

> Identificador: `005-listar-alunos-cpf-auditoria`
> Data: `2026-09-25`
> Pasta da extração reversa: `_reversa_sdd/`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA / DÚVIDA

## 1. Resumo executivo

Disponibilizar uma tela de listagem/consulta de alunos cadastrados onde o CPF pode ser conferido e corrigido com segurança. Vendedores e Secretaria visualizam o CPF mascarado (os 4 dígitos do meio ocultos com `***`); o Gestor visualiza o CPF completo e é o único que pode corrigi-lo. Toda correção é registrada em uma trilha de auditoria imutável (append-only), com valor anterior, valor novo, autor e data/hora.

## 2. Contexto a partir do legado

| Fonte | Trecho relevante | Confidência |
|-------|------------------|-------------|
| `_reversa_sdd/inventory.md#6` | RLS ativa em `alunos` baseada em `app_metadata.app_role`; tabela `alunos` referencia vendas com `ON DELETE RESTRICT`. | 🟢 |
| `_reversa_sdd/sdd/cadastro-alunos-documentacao.md#RF-06` | Mascaramento de dados: perfil Vendedor visualiza CPF mascarado em telas de listagem. | 🟡 |
| `_reversa_sdd/sdd/cadastro-alunos-documentacao.md#RN-01` | Cadastro exige CPF válido (formato e dígito verificador); CPF é único. | 🟡 |
| `_reversa_sdd/sdd/autenticacao-controle-acesso.md#RF-08` | Registro imutável de logs de auditoria, sem `UPDATE`/`DELETE`. | 🟡 |
| `_reversa_sdd/decisions-gate.md#DEC-04` | Vendedor e Secretaria acessam somente a própria produção (isolamento). | 🟢 |
| `_reversa_sdd/code-analysis.md#frontend-alunos` | Existem `/alunos/novo` e `/alunos/[id]`, mas **não** há tela de listagem de alunos. | 🟢 |
| `_reversa_sdd/addenda/004-cadastro-unificado-aluno-venda.md` | `alunos.cpf` é `VARCHAR(11) UNIQUE` em texto claro; vínculo cross-vendedor por CPF permitido. | 🟢 |

> Observação: a spec `cadastro-alunos-documentacao.md` 🟡 descreve criptografia AES-256 e coluna `cpf_hash`, mas o código legado 🟢 armazena `alunos.cpf` em texto claro (`001_schema.sql`). Esta feature ancorará no comportamento real (texto claro + `UNIQUE`) e não introduz criptografia nesta rodada.

## 3. Personas e cenários de uso

| Persona | Objetivo | Cenário-chave |
|---------|----------|---------------|
| Marcos Vendedor | Conferir dados dos seus alunos sem expor o CPF completo | Abre a listagem, busca por nome e vê o CPF mascarado (`123.****.8900`). |
| Ana Secretaria | Consultar alunos para dar andamento documental | Busca aluno por nome/e-mail e confere o CPF mascarado. |
| Roberto Gestor | Auditar e corrigir CPFs incorretos | Vê o CPF completo, identifica um CPF inválido, corrige e o sistema registra a mudança na trilha. |
| Auditoria interna | Rastrear quem mudou cada CPF | Consulta a trilha imutável com valor anterior/novo, autor e data. |

## 4. Regras de negócio novas ou alteradas

1. **RN-01:** Na consulta/listagem, o CPF é exibido **mascarado** para `VENDEDOR` e `SECRETARIA`, ocultando os **4 dígitos do meio** com `***` (ex.: `123.****.8900`). 🟡
   - Tipo: nova
2. **RN-02:** O `GESTOR` visualiza o CPF **completo** na listagem e no detalhe do aluno. 🟡
   - Tipo: nova
3. **RN-03:** Somente o `GESTOR` pode **corrigir** o CPF. Vendedor/Secretaria não têm ação de edição. 🟢
   - Origem no legado: `_reversa_sdd/decisions-gate.md#DEC-04`
   - Tipo: nova
4. **RN-04:** A correção de CPF exige CPF **válido** (dígito verificador) e **único**; tentar gravar um CPF já existente em outro aluno é bloqueado. 🟢
   - Origem no legado: `_reversa_sdd/sdd/cadastro-alunos-documentacao.md#RN-01`
   - Tipo: alterada (o campo passa a ser editável pelo Gestor)
5. **RN-05:** Toda alteração de CPF gera um registro **imutável** (append-only) com `valor_anterior`, `valor_novo`, `autor_id` e data/hora; a trilha não permite `UPDATE` nem `DELETE`. 🟢
   - Origem no legado: `_reversa_sdd/sdd/autenticacao-controle-acesso.md#RF-08`
   - Tipo: nova
6. **RN-06:** A listagem sinaliza CPFs com **dígito verificador inválido** (dados legados), para o Gestor localizar e corrigir. 🟡
   - Tipo: nova

## 5. Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-01 | Tela de listagem de alunos com busca por nome, e-mail e CPF | Must | Lista com nome, CPF (mascarado/completo conforme papel), e-mail, vendedor responsável e data de cadastro; busca filtra os resultados. | 🟢 |
| RF-02 | Mascaramento de CPF por papel | Must | `VENDEDOR`/`SECRETARIA` veem `123.****.8900`; `GESTOR` vê `123.456.789-00`. | 🟡 |
| RF-03 | Indicação de CPF inválido | Should | A listagem marca visualmente o aluno cujo CPF não passa no dígito verificador. | 🟡 |
| RF-04 | Correção de CPF pelo Gestor | Must | O Gestor abre o aluno, edita o CPF; o sistema valida formato/verificador e unicidade antes de salvar. | 🟢 |
| RF-05 | Registro imutável da alteração | Must | Cada correção gera uma linha na trilha de auditoria com valor anterior, novo, autor e data/hora. | 🟢 |
| RF-06 | Consulta da trilha de auditoria | Should | Gestor (e Auditor) conseguem ver o histórico de alterações de CPF de um aluno. | 🟡 |
| RF-07 | Controle de acesso por papel | Must | Vendedor/Secretaria não têm ação de edição de CPF; a tentativa é bloqueada no servidor. | 🟢 |

## 6. Requisitos Não Funcionais

| Tipo | Requisito | Evidência ou justificativa | Confidência |
|------|-----------|----------------------------|-------------|
| Segurança | Escrita de CPF só pelo Gestor, validada no servidor (não apenas na UI) | Padrão de mutação server-side do projeto | 🟢 |
| Auditoria | Trilha append-only sem políticas de `UPDATE`/`DELETE` | `_reversa_sdd/sdd/autenticacao-controle-acesso.md#RF-08` | 🟢 |
| Privacidade | Mascaramento de CPF para perfis não autorizados (LGPD) | `_reversa_sdd/sdd/cadastro-alunos-documentacao.md#RF-06` | 🟡 |
| Desempenho | Listagem/busca com p95 < 300ms para a base atual | Padrão de busca por nome/e-mail (índices existentes) | 🟡 |

## 7. Critérios de Aceitação

```gherkin
Cenário: Vendedor consulta a listagem e vê CPF mascarado
  Dado que o vendedor está autenticado com perfil VENDEDOR
  Quando acessa a listagem de alunos
  Então os CPFs são exibidos no formato "123.****.8900"
  E não há ação de editar CPF

Cenário: Gestor vê CPF completo e corrige um CPF inválido
  Dado que o gestor está autenticado com perfil GESTOR
  Quando abre um aluno com CPF inválido
  Então o CPF completo é exibido
  E ao salvar um CPF válido e único o sistema grava a alteração
  E registra a mudança na trilha de auditoria com valor anterior, novo e autor

Cenário: Correção para CPF já existente é bloqueada
  Dado que o gestor tenta salvar um CPF que já pertence a outro aluno
  Quando confirma a alteração
  Então o sistema bloqueia e informa que o CPF já está cadastrado

Cenário: Vendedor tenta corrigir CPF e é barrado no servidor
  Dado que o vendedor está autenticado
  Quando tenta acionar a correção de CPF por requisição direta
  Então o servidor recusa com acesso negado
```

## 8. Prioridade MoSCoW

| Item | MoSCoW | Justificativa |
|------|--------|---------------|
| RF-01 Listagem | Must | Objetivo central: ver alunos cadastrados |
| RF-02 Mascaramento | Must | Requisito de privacidade explícito do usuário |
| RF-04 Correção pelo Gestor | Must | Necessário para sanar CPFs errados |
| RF-05 Trilha imutável | Must | Exigência explícita de rastreabilidade |
| RF-03 Indicação de inválido | Should | Ajuda o Gestor a achar erros, mas não bloqueia |
| RF-06 Consulta da trilha | Should | Transparência; pode vir em seguida |
| RF-07 Bloqueio server-side | Must | Segurança do mascaramento não pode depender só da UI |

## 9. Esclarecimentos

> Nenhuma sessão de dúvidas registrada ainda. Rode `/reversa-clarify` quando houver `[DÚVIDA]` pendente.

## 10. Lacunas

- 🔴 [DÚVIDA] Qual o escopo de visibilidade da listagem por papel? Vendedor/Secretaria veem **apenas os próprios alunos** (DEC-04 e spec) ou **todos** (comportamento atual da policy de SELECT em `alunos`)?
- 🔴 [DÚVIDA] Formato exato da máscara: proponho `ddd.****.dddd` (3 primeiros + 4 asteriscos + 4 últimos, ocultando os 4 dígitos do meio). Confirma?
- 🔴 [DÚVIDA] A correção de CPF exige **motivo** obrigatório? Onde o Gestor consulta o histórico: na página do aluno, em `/auditoria` ou em tela própria?

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-25 | Versão inicial gerada por `/reversa-requirements` | reversa |
