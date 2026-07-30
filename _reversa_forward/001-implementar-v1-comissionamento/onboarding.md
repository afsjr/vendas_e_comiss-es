# Roteiro de Onboarding e Validação da V1

> Identificador: `001-implementar-v1-comissionamento`  
> Data: `2026-07-23`  
> Objetivo: Guia passo a passo executável para teste e validação humana da V1.

---

## 1. Pré-requisitos

1. Navegador moderno (Chrome, Edge ou Safari com PWA habilitado).
2. Credenciais de teste cadastradas no Supabase Auth para os quatro perfis de teste:
   - **Vendedor:** `vendedor1@escola.com` (role: `"VENDEDOR"`)
   - **Secretaria:** `secretaria1@escola.com` (role: `"SECRETARIA"`)
   - **Auditor:** `auditor1@escola.com` (role: `"AUDITOR"`)
   - **Gestor:** `gestor1@escola.com` (role: `"GESTOR"`)

---

## 2. Passo a Passo de Teste E2E

### Passo 1: Autenticação e Verificação do Isolamento RLS
1. Acesse o PWA da aplicação e faça login como `vendedor1@escola.com`.
2. Verifique se o painel exibe apenas a listagem das vendas criadas por este usuário.

### Passo 2: Apontamento de Venda e Teste Anti-Duplicidade SHA-256 (DEC-05)
1. Clique em **"Novo Apontamento de Venda"**.
2. Preencha os dados do Aluno, selecione o Curso (ex: "Curso de Especialização Técnica") e informe o valor da entrada inicial.
3. Anexe uma foto de comprovante (`comprovante_teste.png`) e envie.
4. **Teste de Duplicidade:** Tente cadastrar um *segundo* apontamento anexando exatamente o mesmo arquivo `comprovante_teste.png`.
   - *Resultado Esperado:* O sistema deve barrar o envio com mensagem de erro HTTP `409 Conflict` ("Este comprovante já foi utilizado em outra venda").

### Passo 3: Auditoria Financeira e Liberação de Comissão
1. Faça logout e entre como `auditor1@escola.com`.
2. Acesse a aba **"Pendentes de Auditoria"** e localize a venda recém-criada.
3. Clique em **"Visualizar Comprovante"**. Verifique que a imagem abre em uma aba protegida através de Signed URL temporária.
4. Clique em **"Aprovar Venda"**.
5. Verifique o status da comissão:
   - Se a `data_inicio_curso` for **futura**, o status deve mudar para `AGUARDANDO_INICIO_AULAS` (DEC-03).
   - Se a `data_inicio_curso` for **passada ou hoje**, o status transiciona para `LIBERADA_PAGAMENTO`.

### Passo 4: Emissão de Minuta de Contrato em PDF
1. Entre como `vendedor1@escola.com` ou `secretaria1@escola.com`.
2. Localize a venda aprovada e clique em **"Gerar Minuta de Contrato"**.
3. A Edge Function `gerar-contrato` (TS) gera a minuta em PDF e a retorna via Signed URL. Faça o download e confirme os dados impressos.

### Passo 5: Fechamento do Livro-Caixa e Imutabilidade Contábil (DEC-06)
1. Faça login como `gestor1@escola.com`.
2. Acesse o menu **"Livro-Caixa & Fechamento Mensal"**.
3. Verifique se o relatório agrupa as comissões pagas pelo mês de competência corrente no fuso `America/Sao_Paulo`.

---
*Roteiro de Onboarding elaborado para homologação da V1.*
