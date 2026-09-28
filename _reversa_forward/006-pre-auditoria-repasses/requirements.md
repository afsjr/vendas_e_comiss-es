# Requirements: Pré-auditoria de repasses de Graduação

> Identificador: `006-pre-auditoria-repasses`
> Data: `2026-09-28`
> Pasta da extração reversa: `_reversa_sdd/`
> Confidência: 🟢 CONFIRMADO, 🟡 INFERIDO, 🔴 LACUNA / DÚVIDA

## 1. Resumo executivo

Disponibilizar ao GESTOR uma pré-auditoria (conferência automática preliminar à decisão humana) de comissão para cursos de **Graduação**, por meio do upload do **relatório de repasses** (arquivo CSV) e da conciliação dos alunos por CPF (Cadastro de Pessoas Físicas). Para cada lançamento pendente, o sistema informa se ele **já apareceu no relatório** e **a partir de qual competência o repasse da mensalidade começa a entrar para o polo**, marcando-o como pré-aprovado ou ainda sem repasse. A decisão final permanece humana (confirmação em lote). Quando não há relatório — ou para Técnico, Pós-Graduação e Cursos Livres — permanece a validação manual atual.

## 2. Contexto a partir do legado

| Fonte | Trecho relevante | Confidência |
|-------|------------------|-------------|
| `_reversa_sdd/decisions-gate.md#DEC-02` | Comissão é **valor fixo em R$** por curso (`valor_comissao_fixo`), não percentual. | 🟢 |
| `_reversa_sdd/decisions-gate.md#DEC-03` | Gatilho de liberação da comissão passa pela aprovação do auditor e pela data de início. | 🟢 |
| `_reversa_sdd/decisions-gate.md#ADR-002` | Mutações sensíveis são **Supabase Edge Functions**; leituras via client + RLS. | 🟢 |
| `_reversa_sdd/inventory.md#6` | Buckets privados (`comprovantes`, `documentos_alunos`, `contratos_pdf`); RLS por `app_metadata.app_role`. | 🟢 |
| `_reversa_sdd/data-dictionary.md#alunos` | `alunos.cpf` é `VARCHAR(11) UNIQUE`, apenas dígitos (texto claro) — chave de conciliação. | 🟢 |
| `_reversa_sdd/data-dictionary.md#cursos` | `cursos.categoria` ∈ `TECNICO`, `GRADUACAO`, `POS_GRADUACAO`, `CURSO_LIVRE`. | 🟢 |
| `_reversa_sdd/sdd/auditoria-apontamentos.md#NG-03` | Spec vigente diz que **não** haveria conciliação automatizada/OCR na V1 — esta feature revoga o NG-03 **apenas para Graduação com relatório**. | 🟡 |
| `_reversa_sdd/addenda/005-auditoria-primeiro-checklist-dashboard.md` | Fluxo vigente: a comissão só é liberada na confirmação da **1ª mensalidade** (`PRIMEIRA_MENSALIDADE_PAGA`); auditoria é a primeira etapa. | 🟢 |
| `_reversa_sdd/addenda/003-kanban-pos-venda.md#Fluxo` | Pós-venda: Vendedor → Auditor → Secretaria (contrato) → Financeiro (boleto/1ª mensalidade). | 🟢 |
| `supabase/migrations/20260909000000_postvenda_status.sql` | `status_venda_enum` ganhou `AGUARDANDO_FINANCEIRO`, `AGUARDANDO_PAGAMENTO_1M`, `PRIMEIRA_MENSALIDADE_PAGA`, `CANCELADA`; papel `FINANCEIRO`. | 🟢 |
| `src/lib/supabase.ts#uploadFile` | Padrão de upload já existe (buckets privados) e pode ser reutilizado. | 🟢 |

> Artefato-fonte analisado nesta rodada: `document (3).csv` — exportação real do relatório de repasses do polo LIMOEIRO/PE (`BP Polo 3005381`). Um segundo exemplo (`colaborar.pdf`) foi avaliado e **descartado como fonte automática** por não conter CPF (ver seção 10).

## 3. Personas e cenários de uso

| Persona | Objetivo | Cenário-chave |
|---------|----------|---------------|
| Roberto Gestor (Gestor/Auditor) | Conferir, em lote, quais vendas de Graduação já tiveram repasse iniciado antes de liberar comissão | Sobe o CSV do mês, o sistema concilia por CPF e marca cada lançamento como pré-aprovado (com competência inicial) ou sem repasse; ele confirma |
| Roberto Gestor (sem relatório) | Validar manualmente quando não há arquivo | Sem CSV, usa a fila de `/auditoria` como hoje |
| Equipe Vendedora (indireta) | Receber comissão com menos retrabalho | Tem a comissão pré-auditada automaticamente, reduzindo devoluções |

## 4. Regras de negócio novas ou alteradas

1. **RN-01:** A pré-auditoria automática aplica-se **somente** a vendas cujo curso tenha `categoria = 'Graduação'`. 🟢
   - Origem no legado: `_reversa_sdd/data-dictionary.md#cursos`
   - Tipo: nova
2. **RN-02:** O polo é **único** (unidade institucional fixa). As colunas de polo/divisão do relatório (`BP Polo`, `Divisao`, `Denominacao da Divisao`) são armazenadas como **metadado de conferência**, não como entidade por unidade. 🟡
   - Tipo: nova
3. **RN-03:** A conciliação lançamento ↔ relatório usa **`CPF Aluno`** (11 dígitos) como chave, casando com `alunos.cpf`. O curso do relatório (`Codigo Curso`) é exibido apenas para conferência, sem mapeamento por enquanto. 🟢
   - Origem no legado: `_reversa_sdd/data-dictionary.md#alunos`
   - Tipo: nova
4. **RN-04:** O status de conciliação de um aluno é `APARECEU` ou `NAO_APARECEU`. A **1ª mensalidade repassada** é identificada pela linha de operação `R101` (Mensalidade) com `Mensalidade = 1` e `Valor_Repasse > 0`; a **competência de início do repasse** (competência = mês de referência da mensalidade) é a `Data Competencia` dessa linha de parcela 1. 🟢
   - Tipo: nova
5. **RN-05:** A conciliação lê as operações `R101` (Mensalidade), `R103` (Parc AP), `R201` (PMT) e demais créditos/estornos (`R060`, `R080`, `R020`, `R215`) para compor o resumo, mas **somente a parcela 1 da mensalidade (`R101`, `Mensalidade = 1`) habilita a comissão**; valores negativos (estornos) nunca habilitam. 🟢
   - Tipo: nova
6. **RN-06:** O resultado da pré-auditoria é uma recomendação (`pré-aprovado` ou `sem repasse`); **nada é liberado sem a confirmação humana do GESTOR** (revisão em lote). A **confirmação marca a comissão como `LIBERADA_PAGAMENTO` diretamente**. 🟢
   - Origem no legado: `_reversa_sdd/addenda/005-auditoria-primeiro-checklist-dashboard.md`
   - Tipo: alterada (o NG-03 da spec de auditoria deixa de valer para Graduação com relatório)
7. **RN-07:** Na ausência de relatório, ou para cursos de Técnico/Pós-Graduação/Cursos Livres, ou para formatos não suportados (PDF ou planilha), aplica-se a **validação manual** pela tela `/auditoria` vigente. 🟢
   - Origem no legado: `_reversa_sdd/addenda/005-auditoria-primeiro-checklist-dashboard.md`
   - Tipo: nova (fallback)
8. **RN-08:** Cada importação e cada resultado de conciliação são **rastreáveis e imutáveis** (append-only), com autor, hash SHA-256 do arquivo e data/hora. Persiste-se o **resultado por venda e o resumo por aluno**, sem armazenar todas as linhas brutas do arquivo. 🟢
   - Origem no legado: `supabase/migrations/001_schema.sql` (padrão `livro_caixa_lancamentos` append-only)
   - Tipo: nova
9. **RN-09:** Quando o mesmo CPF tiver **mais de uma venda de Graduação**, o item é marcado como **ambíguo** e encaminhado à decisão manual, sem pré-aprovação automática. 🟢
   - Tipo: nova
10. **RN-10:** Nesta rodada, apenas o formato **CSV** entra na conciliação automática; XLSX e PDF ficam fora. 🟢
   - Tipo: nova
11. **RN-11:** A funcionalidade é **exclusiva do perfil `GESTOR`**; Vendedor, Secretaria, Auditor e Financeiro não acessam (bloqueio server-side, não apenas UI). 🟢
   - Origem no legado: `_reversa_sdd/decisions-gate.md#DEC-04`
   - Tipo: nova
12. **RN-12:** A fila de pré-auditoria lista **apenas lançamentos de Graduação pendentes de liberação de comissão** (comissão ainda não `LIBERADA_PAGAMENTO` nem `PAGA`). 🟢
   - Tipo: nova

## 5. Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de aceite | Confidência |
|----|-----------|------------|--------------------|-------------|
| RF-01 | Tela de pré-auditoria com upload do relatório de repasses (CSV) | Must | O GESTOR anexa o CSV; o sistema valida extensão/tamanho e aceita o arquivo | 🟢 |
| RF-02 | Parser robusto do CSV | Must | Lê arquivo com BOM, encoding Latin-1, delimitador `;`, ignora cabeçalhos repetidos, interpreta `R$ 1.234,56`, datas `dd/mm/aa` e competência `MÊS/AAAA` | 🟢 |
| RF-03 | Conciliação por CPF | Must | Para cada CPF distinto do arquivo, localiza as vendas de Graduação correspondentes em `alunos`/`vendas`/`comissoes` | 🟢 |
| RF-04 | Resultado por lançamento | Must | Exibe `APARECEU` (com a parcela da 1ª mensalidade, competência de início e valor de repasse) ou `NAO_APARECEU`; sem parcela 1 com repasse, permanece `NAO_APARECEU` | 🟢 |
| RF-05 | Revisão em lote e confirmação humana | Must | O GESTOR seleciona vários itens e confirma; a confirmação marca a comissão como `LIBERADA_PAGAMENTO` e gera registro de auditoria com autor e data/hora | 🟢 |
| RF-06 | Fallback de validação manual | Must | Sem relatório, ou em formato não suportado, os lançamentos ficam marcados para validação manual na `/auditoria` atual | 🟢 |
| RF-07 | Trilha imutável de importação e resultados | Must | Importações e resultados são append-only, com `sha256` do arquivo, autor e timestamp | 🟡 |
| RF-08 | Controle de acesso restrito a GESTOR | Must | Requisição de perfil diferente de GESTOR é recusada no servidor (não apenas oculta na UI) | 🟢 |
| RF-09 | Consulta do histórico de importações | Should | O GESTOR lista importações anteriores com competência, totais e status | 🟡 |
| RF-10 | Marcação de ambiguidade | Must | CPF com mais de uma venda de Graduação é sinalizado como ambíguo para decisão manual | 🟢 |

## 6. Requisitos Não Funcionais

| Tipo | Requisito | Evidência ou justificativa | Confidência |
|------|-----------|----------------------------|-------------|
| Segurança | Upload, parsing e gravação da conciliação ocorrem no servidor (nunca no cliente), com verificação de permissão server-side e acesso restrito a `GESTOR` | `_reversa_sdd/decisions-gate.md#ADR-002` | 🟢 |
| Integridade | Resultado da conciliação é append-only; nunca sobrescreve importação anterior | padrão `livro_caixa_lancamentos` (`001_schema.sql`) | 🟢 |
| Desempenho | Importar e conciliar o relatório (≈300 linhas/≈150 KB) em menos de 5 s no 95º percentil | volume observado no exemplo real | 🟡 |
| Privacidade | CPF tratado como dado sensível; visibilidade restrita ao GESTOR | `_reversa_sdd/sdd/cadastro-alunos-documentacao.md#RF-06` | 🟡 |
| Observabilidade | Registrar log de importação (autor, arquivo, contagem de linhas, erros de parsing) | padrão de trilha de auditoria do projeto | 🟡 |
| Compatibilidade | Parser tolerante a linhas malformadas (curso vazio, tipo `0`) sem abortar a importação | observado em `document (3).csv` | 🟢 |

## 7. Critérios de Aceitação

```gherkin
Cenário: GESTOR importa o relatório e vê a conciliação
  Dado que o gestor está autenticado com perfil GESTOR
  Quando sobe o CSV de repasses de Graduação
  Então o sistema interpreta todas as linhas válidas
  E apresenta cada lançamento como "apareceu" ou "ainda não apareceu"

Cenário: 1ª mensalidade repassada
  Dado um aluno de Graduação com uma linha de Mensalidade (R101) de parcela 1 e Valor_Repasse > 0
  Quando a conciliação roda
  Então o lançamento é marcado como APARECEU
  E a competência de início é a Data Competencia dessa parcela 1

Cenário: Parcela posterior aparece antes da 1ª
  Dado que o relatório traz apenas parcelas maiores que 1, sem parcela 1 com repasse
  Quando a conciliação roda
  Então o lançamento é marcado como NAO_APARECEU
  E fica disponível para validação manual

Cenário: CPF com mais de uma venda de Graduação
  Dado um CPF que possui mais de uma venda de Graduação
  Quando a conciliação roda
  Então o item é marcado como ambíguo
  E é encaminhado para decisão manual

Cenário: Lançamento ainda sem repasse
  Dado um aluno de Graduação cujo CPF não aparece no relatório
  Quando a conciliação roda
  Então o lançamento é marcado como NAO_APARECEU
  E fica disponível para validação manual

Cenário: Arquivo com cabeçalhos repetidos e encoding Latin-1
  Dado um CSV exportado com BOM, delimitador ";" e cabeçalho repetido a cada página
  Quando o parser processa o arquivo
  Então os cabeçalhos repetidos são ignorados
  E os acentos e valores "R$" são interpretados corretamente

Cenário: Sem relatório disponível
  Dado que não há CSV importado para o período
  Quando o gestor acessa a fila
  Então os lançamentos de Graduação são encaminhados para validação manual completa

Cenário: Fila restrita a Graduação pendente
  Dado um lançamento de Graduação cuja comissão já foi liberada ou paga
  Quando o gestor abre a fila de pré-auditoria
  Então esse lançamento não aparece na fila

Cenário: Perfil não autorizado
  Dado um usuário autenticado com perfil diferente de GESTOR
  Quando tenta acessar a tela ou o endpoint de pré-auditoria
  Então o servidor recusa com acesso negado

Cenário: Confirmação em lote libera e gera trilha
  Dado que o gestor revisou a lista de lançamentos pré-auditados
  Quando seleciona vários itens e confirma em lote
  Então a comissão de cada item confirmado passa para LIBERADA_PAGAMENTO
  E cada item recebe um registro de auditoria com autor e data/hora
  E nenhum item é confirmado sem ação explícita do gestor

Cenário: Reimportação não sobrescreve histórico
  Dado que já existe uma importação anterior para a mesma competência
  Quando o gestor sobe um novo arquivo
  Então uma nova importação é registrada
  E os resultados anteriores permanecem preservados

Cenário: Arquivo sem linhas válidas
  Dado um arquivo sem nenhuma linha de repasse interpretável
  Quando o parser conclui a leitura
  Então o sistema informa que não há dados conciliáveis
  E não cria resultados de conciliação

Cenário: Consulta do histórico de importações
  Dado que existem importações registradas
  Quando o gestor acessa o histórico
  Então vê cada importação com competência, autor, data, totais e status

Cenário: Formato não suportado cai em validação manual
  Dado um arquivo em formato diferente do esperado
  Quando o gestor tenta importá-lo
  Então o sistema recusa a conciliação automática
  E orienta a validação manual dos lançamentos
```

## 8. Prioridade MoSCoW

| Item | MoSCoW | Justificativa |
|------|--------|---------------|
| RF-01 Upload CSV | Must | Entrada do fluxo |
| RF-02 Parser robusto | Must | Sem ele a conciliação falha no arquivo real |
| RF-03/RF-04 Conciliação e resultado | Must | Objetivo central da feature |
| RF-05 Confirmação humana | Must | A confirmação libera a comissão (`LIBERADA_PAGAMENTO`) e registra trilha |
| RF-06 Fallback manual | Must | Garante operação sem relatório |
| RF-07 Trilha imutável | Must | Governança e auditoria |
| RF-08 Restrição a GESTOR | Must | Perfil único de acesso definido |
| RF-09 Histórico de importações | Should | Conveniência, não bloqueia |
| RF-10 Ambiguidade | Must | Evita pré-aprovar CPF com múltiplas vendas |

## 9. Esclarecimentos

### Sessão 2026-09-28

- **Q:** Quando o GESTOR confirma em lote, o que a confirmação altera no ciclo de comissão?
  **R:** A confirmação marca a comissão como `LIBERADA_PAGAMENTO` diretamente.
- **Q:** O que persistir da importação do relatório?
  **R:** Resultados por venda + resumo por aluno; não armazenar todas as linhas brutas do arquivo.
- **Q:** Quais formatos entram nesta rodada?
  **R:** Somente CSV; XLSX e PDF ficam fora.
- **Q:** Como determinar que a 1ª mensalidade foi repassada?
  **R:** Pela linha de Mensalidade (`R101`) com `Mensalidade = 1` e `Valor_Repasse > 0`.
- **Q:** Quando o mesmo CPF tiver mais de uma venda de Graduação, como conciliar?
  **R:** Marcar como ambíguo e encaminhar para decisão manual.
- **Q:** Qual o filtro de escopo da fila de pré-auditoria?
  **R:** Apenas lançamentos de Graduação pendentes de liberação de comissão (comissão ainda não `LIBERADA_PAGAMENTO` nem `PAGA`).

## 10. Lacunas

> Nenhuma lacuna em aberto. Todos os pontos foram resolvidos nas sessões de esclarecimento.

## 11. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-09-28 | Versão inicial gerada por `/reversa-requirements` | reversa |
| 2026-09-28 | Sessão de esclarecimentos: parcela 1 da mensalidade, liberação direta da comissão, persistência de resultados, CSV-only e marcação de ambiguidade | reversa-clarify |
| 2026-09-28 | Segunda sessão: escopo da fila restrito a Graduação pendente de liberação de comissão | reversa-clarify |
