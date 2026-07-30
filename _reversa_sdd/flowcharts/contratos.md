# Flowchart — Módulo `contratos`

> `POST /api/v1/vendas/:id/gerar-contrato` · `backend/src/routes/contratos.rs::gerar`

```mermaid
flowchart TD
    A[POST /vendas/:id/gerar-contrato] --> B{role in VENDEDOR,SECRETARIA?}
    B -- não --> X1[403 FORBIDDEN]
    B -- sim --> C[acquire conn +<br/>inject_rls_context]
    C --> D[SELECT ContratoData<br/>vendas JOIN alunos<br/>JOIN cursos JOIN usuarios]
    D --> E{venda existe?}
    E -- não --> X2[404 NOT_FOUND]
    E -- sim --> F[Criar dir temporário<br/>contrato_{uuid}]
    F --> G[Gerar template Typst<br/>generate_typst_template]
    G --> H[spawn_blocking:<br/>typst compile -> PDF]
    H --> I{typst ok?}
    I -- não --> X3[500 erro Typst<br/>limpa tmp]
    I -- sim --> J[Ler PDF bytes]
    J --> K[Upload PDF p/ Storage<br/>bucket contratos_pdf]
    K --> L{upload ok?}
    L -- não --> X4[502 BAD_GATEWAY]
    L -- sim --> M[Gerar signed URL<br/>expiresIn 3600s]
    M --> N{sign ok?}
    N -- não --> P1[200 uploaded_no_signed_url]
    N -- sim --> P2[200 pdf_signed_url]
    P1 --> Q[Limpa dir temporário]
    P2 --> Q
```

🟡 Template hardcoded em Rust (não lê `backend/templates/`, vazio — L3). 🔴 Query refere colunas/tabela `usuarios` inexistentes no DDL (L1).
