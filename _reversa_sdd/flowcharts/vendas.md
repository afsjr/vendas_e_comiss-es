# Flowchart — Módulo `vendas`

> `POST /api/v1/vendas` · `backend/src/routes/vendas.rs::create`
> 🟢 CONFIRMADO do código · 🔴 divergências DDL em questions.md (L1)

```mermaid
flowchart TD
    A[POST /api/v1/vendas<br/>multipart] --> B[Parse campos:<br/>aluno_id, curso_id,<br/>valor_entrada, comprovante_file]
    B --> C{Campos obrigatórios<br/>presentes?}
    C -- não --> E1[400 MissingField/InvalidField]
    C -- sim --> D[Calcular SHA-256<br/>do comprovante]
    D --> F{Hash já existe<br/>em evidencias?}
    F -- sim --> E2[409 DUPLICATE_RECEIPT_HASH]
    F -- não --> G[Upload p/ Storage<br/>bucket comprovantes<br/>reqwest + service_key]
    G --> H{Upload ok?}
    H -- não --> E3[500 Upload failed]
    H -- sim --> I[Acquire conn +<br/>inject_rls_context]
    I --> J[Begin TX]
    J --> K[set_config jwt.claims<br/>SET LOCAL ROLE authenticated]
    K --> L[INSERT vendas<br/>status=PENDENTE_VALIDACAO]
    L --> M[INSERT evidencias_vendas<br/>sha256 + storage_path]
    M --> N[INSERT comissoes<br/>status=BLOQUEADA_AUDITORIA]
    N --> O[Commit TX]
    O --> P[201 Created<br/>id, status, sha256, criado_em]
```

🔴 O INSERT em `vendas` omite `criado_por` (NOT NULL); o INSERT em `comissoes` omite `beneficiario_id` e `valor_comissao` (NOT NULL). Nomes de coluna divergem do DDL.
