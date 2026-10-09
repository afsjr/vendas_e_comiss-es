# Onboarding: como testar a Visibilidade e baixa de pagamento de comissões (feature 010)

> Identificador: `010-baixa-pagamento-comissoes`
> Data: `2026-10-09`
> Objetivo: um humano testar a feature pela primeira vez do zero.

## 1. Pré-requisitos

- Node.js ≥ 18.17 e dependências instaladas (`npm install`).
- Projeto Supabase configurado (`.env.local` com `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
- Migrações aplicadas (`supabase db push`), incluindo `add_comissoes_data_pagamento` e `registrar_pagamento_comissoes`.
- Edge Function `relatorio-repasse` publicada.
- Usuários por papel: ao menos um `GESTOR`, um `AUDITOR`, um `FINANCEIRO`, um `VENDEDOR` e um `SECRETARIA`.
- Dados de teste: comissões em `LIBERADA_PAGAMENTO` e ao menos uma já `PAGA`, de vendedores diferentes.

## 2. Subir o ambiente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

## 3. Roteiro de verificação

### 3.1 Gestor: visão por vendedor

1. Faça login como `GESTOR`.
2. Abra **Comissões** (`/comissoes`).
3. Confirme a lista por vendedor com curso, valor, situação e data de referência (data da venda e início do curso).
4. Confirme os totais "a receber" (`LIBERADA_PAGAMENTO`) e "pago" (`PAGA`).

### 3.2 Filtros

1. Selecione um período (mês atual / anterior / intervalo) e uma situação.
2. Confirme que a lista e os totais refletem o recorte.

### 3.3 Baixa de pagamento

1. Selecione comissões em `LIBERADA_PAGAMENTO`.
2. Acione "marcar como pago" e confirme.
3. Verifique: status vira `PAGA`, `data_pagamento` é registrada e aparece um lançamento em `livro_caixa_lancamentos`.
4. Tente baixar novamente a mesma comissão: deve ser recusada (idempotência).

### 3.4 Alerta de fechamento (dia 22)

1. Com a data do sistema ≥ dia 22, confirme o alerta de fechamento e a opção de fechamento prévio.
2. Confirme que antes do dia 22 o alerta não aparece.

### 3.5 Relatório de repasse (PDF)

1. Escolha período e vendedor (ou todos) e a situação.
2. Gere o relatório e baixe o PDF.
3. Confira: comissões (vendedor, curso, valor, datas), totais por vendedor e total geral; cabeçalho com período, data e autor.

### 3.6 Acesso por papel

1. Faça login como `VENDEDOR`: `/comissoes` deve redirecionar com aviso "acesso negado".
2. Faça login como `SECRETARIA`: também sem acesso a comissões.
3. Faça login como `AUDITOR` e `FINANCEIRO`: acesso liberado.

### 3.7 Estados de tela

1. Período sem comissões: estado vazio com totais zerados.
2. Comissão sem data de início do curso: linha destacada; a baixa é permitida com aviso.
3. Erro de consulta: mensagem com ação de tentar novamente.

## 4. Testes automatizados

```bash
deno test --allow-read tests/comissoes_pagamento.test.ts
```

Cobrem: agrupamento por vendedor, totais a receber/pagos, filtro de período e situação, e destaque de comissões sem data de início.

## 5. Rollback

- Frontend: ocultar `/comissoes` e o item de menu; a rota deixa de existir.
- Banco: a coluna `data_pagamento` é aditiva (não quebra leitura); a função `registrar_pagamento_comissoes` pode ser removida.
- Sem perda de dados: lançamentos no livro-caixa permanecem (append-only).

## 6. Histórico de alterações

| Data | Alteração | Autor |
|------|-----------|-------|
| 2026-10-09 | Versão inicial gerada por `/reversa-plan` | reversa |
