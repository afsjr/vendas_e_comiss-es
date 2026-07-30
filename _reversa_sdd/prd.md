# PRD: Sistema de Comissionamento e Vendas

> Selo 🟢 CONFIRMADO. Documento 100% sincronizado com a fonte canônica `decisions-gate.md`.

**Versão:** 1.1  
**Data:** 2026-07-23T14:50:00-03:00  
**Autor:** reversa-synchronizer  
**Status:** Aprovado / Sincronizado  

---

## 1. Problema

🟢 Informações de vendas, matrículas e comprovantes de pagamento da entrada inicial (matrícula/primeiro pagamento) de cursos (técnico, graduação, pós-graduação e cursos livres) ficam dispersas e vulneráveis em registros de papel (fichas, gavetas) e conversas de WhatsApp. Esse formato causa perda de dados, impossibilita a apuração ágil do faturamento de entradas pela gerência, gera desconfiança sobre o pagamento de comissões fixas aos vendedores/secretaria e inviabiliza a auditoria clara em casos de solicitação de reembolso.

### Quem sente
🟢 
- **Vendedor Comercial:** Dificuldade em registrar rapidamente a entrada inicial vendida sem esquecer; incerteza sobre aprovação do comprovante, cálculo da comissão em valor fixo (R$) e a liberação vinculada ao início das aulas.
- **Secretaria:** Retrabalho no atendimento presencial de balcão, acompanhamento de documentos faltantes do aluno (RG, CPF, Comprovante de Residência, Histórico) para regularização documental após emissão da minuta de contrato. Acesso estritamente isolado à sua própria produção.
- **Gestor / Auditor:** Insegurança ao autorizar pagamentos de comissão por falta de comprovantes auditáveis ou duplicados, falta de controle sobre o gatilho de início do curso (`data_inicio_curso <= data_atual`) e ausência de fechamento financeiro mensal consolidado.

---

## 2. Personas-alvo

🟢 Referência completa em [`personas.md`](./personas.md). Resumo alinhado com `decisions-gate.md`:

- **Marcos Vendedor (Vendedor Comercial):** Atende via WhatsApp/telefone. Quer apontamento mobile em menos de 3 toques com anexo de comprovante único referente à entrada inicial (1 comprovante = 1 venda, verificação por hash SHA-256) e consulta da sua carteira individual de comissões em valor fixo (R$).
- **Ana Secretaria (Secretaria):** Atende no balcão fixo (desktop). Registra matrículas e entradas iniciais, coleta comprovantes, controla o checklist de documentação do aluno e gera a minuta do contrato. Possui isolamento estrito de visibilidade RBAC/RLS (acessa unicamente as suas próprias vendas e matrículas, idêntico ao vendedor).
- **Roberto Gestor (Gestor / Auditor de Apontamentos):** Audita comprovantes (aprova `APROVADA` ou devolve `DEVOLVIDA_AJUSTE` com justificativa), visualiza o fechamento financeiro mensal e comissões que aguardam o início das aulas (`AGUARDANDO_INICIO_AULAS`) antes da liberação final (`LIBERADA_PAGAMENTO`).

---

## 3. Métricas de sucesso

🟢 Indicadores para avaliação de sucesso da solução após 3 meses de operação (alinhados a `decisions-gate.md` DEC-03 e DEC-07):

| Métrica | Unidade | Alvo | Prazo |
|---|---|---|---|
| 🟢 Adoção Digital de Apontamentos | % dos apontamentos | 100% no sistema (0% papel/WhatsApp) | 30 dias |
| 🟢 Tempo de Liberação da Comissão | Condição | Liberação após aprovação do auditor E data de início das aulas atingida (`data_inicio_curso <= data_atual`) | 15 dias após gatilho |
| 🟢 Taxa de Retenção de Evidências | % de vendas com comprovante | 100% das vendas auditáveis com imagem de comprovante único (1 venda = 1 comprovante via SHA-256) | Imediato |
| 🟢 Taxa de Emissão de Contrato | % de vendas com minuta gerada | 100% das vendas com minuta de contrato gerada | 30 dias |
| 🟢 Taxa de Regularização Documental | % de alunos com checklist completo | 100% dos alunos com checklist de documentos entregue sem pendências | 60 dias |

---

## 4. Escopo (in)

🟢 Funcionalidades e requisitos contidos no escopo do produto (V1):

- 🟢 **Apontamento Rápido de Entrada Inicial:** Interface otimizada (mobile/desktop) para cadastro de venda/matrícula focado exclusivamente na entrada inicial (matrícula/primeiro pagamento) de 1 venda = 1 aluno + 1 curso.
- 🟢 **Anexo Obrigatório de Evidências com Validação Anti-Duplicidade:** Upload de foto/print do comprovante com carimbo digital (*timestamp*) e restrição estrita de 1 Comprovante = 1 Venda via verificação de hash SHA-256 da imagem (DEC-05).
- 🟢 **Módulo de Auditoria de Apontamentos:** Tela da gestão para aprovação (`APROVADA`) ou devolução (`DEVOLVIDA_AJUSTE`) de vendas com pendência de comprovante.
- 🟢 **Cálculo Automático de Comissão com Valor Fixo por Curso:** Regras de comissão baseadas em valor fixo em R$ (`valor_comissao_fixo`), definido diretamente no cadastro de cada curso (DEC-02).
- 🟢 **Gatilho Duplo de Liberação de Comissão:** Comissão habilitada para pagamento (`LIBERADA_PAGAMENTO`) apenas quando preencher cumulativamente: (a) status da venda = `APROVADA` pelo auditor AND (b) data de início do curso atingida (`data_inicio_curso <= data_atual`). Vendas aprovadas com data futura mantêm comissão no status `AGUARDANDO_INICIO_AULAS` (DEC-03).
- 🟢 **Painel "Minha Carteira" com RLS por Perfil (Vendedor e Secretaria):** Extrato de comissões individualizado com isolamento total de privacidade por RLS: Vendedor e Secretaria enxergam unicamente a sua própria produção (DEC-04).
- 🟢 **Checklist e Indicador de Regularização Documental:** Registro e acompanhamento da entrega de RG, CPF, Comprovante de Residência e Histórico Escolar do aluno, alimentando a *Taxa de Regularização Documental* (DEC-07).
- 🟢 **Emissão de Minuta de Contrato com Ressalva:** Pré-preenchimento automático dos dados do contrato e plano da entrada inicial, permitindo emissão com ressalva documental para não travar a venda, alimentando a *Taxa de Emissão de Contrato* (DEC-07).
- 🟢 **Livro-Caixa e Fechamento Financeiro Mensal:** Registro imutável (*append-only*) de lançamentos de receitas (entradas) e débitos (estornos/reembolsos por cancelamento), com ciclo de apuração e fechamento financeiro mensal com corte no último dia do mês às 23:59:59 (DEC-06).
- 🟢 **Dashboard Gerencial e Relatórios Mensais:** Visão consolidada para a gestão com faturamento de entradas, comissões apuradas no ciclo mensal, acompanhamento D-1 e status das auditorias.

---

## 5. Não-objetivos (out)

🟢 Itens expressamente FORA do escopo da versão V1:

- 🟢 **Gestão de Parcelas e Recebíveis Futuros (V1):** O sistema V1 gerencia unicamente a entrada inicial (matrícula/primeiro pagamento). Controles de mensalidades futuras, parcelamento de cursos, carnês, réguas de cobrança ou inadimplência recorrente estão fora da V1 (DEC-01).
- 🟢 **Regras Percentuais ou Faixas Dinâmicas de Comissão:** Não há comissão em porcentagem ou escalas dinâmicas por volume; apenas valor fixo em R$ definido por curso (DEC-02).
- 🟢 **Reutilização de Comprovantes / Vendas Múltiplas:** Proibida a reutilização do mesmo comprovante em mais de uma venda (1 comprovante = 1 venda, bloqueado por hash SHA-256) (DEC-05). Vendas aninhadas (múltiplos cursos/alunos no mesmo apontamento) não são suportadas.
- 🟢 **Emissão de Nota Fiscal Eletrônica (NFE):** Integração automática com prefeituras ou SEFAZ não será desenvolvida na V1.
- 🟢 **Gateway de Pagamento / Processamento de Cartão/Pix no App:** O sistema não processa cobranças diretamente; apenas registra o pagamento externo efetuado e auditado por imagem.
- 🟢 **Edição ou Exclusão Retroativa de Lançamentos:** Imutabilidade total do Livro-Caixa e histórico de vendas; correções são realizadas via contra-lançamentos/estornos (`CANCELADA_ESTORNADA`).

---

## 6. Restrições

🟢 Restrições operacionais, tecnológicas e legais:

| Tipo | Descrição |
|---|---|
| 🟢 Técnica | Aplicação Web responsiva com atalho estilo PWA (alta acessibilidade mobile sem necessidade de lojas App Store/Play Store). |
| 🟢 Compliance / LGPD | Conformidade integral com a LGPD: criptografia de dados sensíveis de alunos (CPF/RG), controle de acesso por perfil e guarda segura de comprovantes com URLs assinadas. |
| 🟢 Privacidade / RBAC | Isolamento estrito por RLS: Vendedores e Secretaria enxergam **apenas seus próprios lançamentos e comissões** (DEC-04). Apenas Gestores/Auditores possuem visão consolidada da unidade. |
| 🟢 Validação de Imagem | Restrição técnica de hash SHA-256 único por arquivo de comprovante enviado (1 comprovante = 1 venda - DEC-05). |
| 🟢 Fechamento Financeiro | Ciclo mensal rígido com corte no último dia de cada mês às 23:59:59 para apuração e pagamento de comissões liberadas (DEC-06). |

---

## 7. Dependências externas

🟢 Serviços e bibliotecas necessários:

- 🟢 **Serviço de Armazenamento de Arquivos/Imagens:** Storage seguro com suporte a hashing SHA-256 e visualização temporária/assinada de comprovantes e documentos.
- 🟢 **Mecanismo de Geração de Documentos (PDF):** Biblioteca para renderização da minuta de contrato pré-preenchido com dados da entrada inicial.

---

## 8. Riscos

🟢 Riscos identificados e estratégias de mitigação:

| Risco | Impacto | Probabilidade | Mitigação proposta |
|---|---|---|---|
| 🟢 Resistência da equipe em abandonar o papel/WhatsApp | Alto | Média | Interface simples de no máximo 3 toques no celular; condicionar a liberação de comissão ao registro auditado no sistema. |
| 🟢 Reutilização indevida do mesmo comprovante em múltiplas vendas | Alto | Média | Validação estrita por hash SHA-256 da imagem no upload, impedindo duplicidade no banco de dados (DEC-05). |
| 🟢 Pagamento de comissão antes do início efetivo do curso | Alto | Média | Trava de liberação dupla: a comissão exige status `APROVADA` e a chegada da `data_inicio_curso <= data_atual` (ficando em `AGUARDANDO_INICIO_AULAS` até lá - DEC-03). |
| 🟢 Envio de imagens ilegíveis de comprovantes | Médio | Alta | Módulo de auditoria com função de `DEVOLVIDA_AJUSTE`, exigindo justificativa do auditor e reanexo pelo vendedor/secretaria. |
| 🟢 Vazamento ou acesso indevido a documentos de alunos (RG/CPF) | Alto | Baixa | Armazenamento privado com acesso via URLs assinadas e RLS estrito onde Secretaria e Vendedor só veem seus próprios registros (DEC-04). |

---

## 9. Critérios de aceite (alto nível)

🟢 Especificação comportamental básica em formato Dado/Quando/Então:

- 🟢 **Dado** que o Vendedor ou a Secretaria realizou a venda da entrada inicial (matrícula), **Quando** cadastra os dados e anexa a imagem do comprovante de pagamento, **Então** o sistema valida o hash SHA-256 (garantindo que 1 comprovante = 1 venda), grava o registro com status `PENDENTE_VALIDACAO` e carimbo digital de data/hora.
- 🟢 **Dado** que a Secretaria cadastra o aluno e preenche o plano da entrada inicial, **Quando** clica em "Gerar Contrato", **Então** o sistema renderiza a minuta do contrato (impactando a *Taxa de Emissão de Contrato*), independente de pendências no checklist de RG/CPF/Histórico (que alimentam a *Taxa de Regularização Documental*).
- 🟢 **Dado** que a Secretaria acessa o sistema, **Quando** navega pela lista de vendas, alunos ou carteira, **Então** ela enxerga exclusivamente os registros gerados por ela própria (isolamento RBAC/RLS idêntico ao vendedor).
- 🟢 **Dado** que o Auditor analisa uma venda com comprovante legível, **Quando** clica em "Aprovar Venda", **Então** o status da venda passa para `APROVADA`. Se a data de início do curso for futura (`data_inicio_curso > data_atual`), a comissão assume o status `AGUARDANDO_INICIO_AULAS`.
- 🟢 **Dado** que a data atual atinge ou ultrapassa a data de início do curso (`data_inicio_curso <= data_atual`) de uma venda `APROVADA`, **Quando** a rotina de comissão avalia o registro, **Então** a comissão assume o status `LIBERADA_PAGAMENTO` com o valor fixo em R$ (`valor_comissao_fixo`) para o próximo fechamento mensal.
- 🟢 **Dado** que o Auditor recusa uma evidência inconsistente ou ilegível, **Quando** clica em "Devolver para Ajuste", **Então** o status da venda muda para `DEVOLVIDA_AJUSTE`, a comissão permanece `BLOQUEADA_AUDITORIA` e o lançador me notificado para reanexar o comprovante.

---

## Pendências de cobertura

🟢 Nenhuma pendência identificada. O PRD está 100% alinhado com o documento de decisões canônicas `decisions-gate.md` (DEC-01 a DEC-07).

---

Gerado/Sincronizado por reversa-synchronizer em 2026-07-23T14:50:00-03:00  
Fontes: `decisions-gate.md`, `ideation.md`, `personas.md`
