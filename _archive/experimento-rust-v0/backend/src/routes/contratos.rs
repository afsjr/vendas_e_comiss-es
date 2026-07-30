use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde_json::{json, Value};
use std::process::Command;
use tracing;
use uuid::Uuid;

use crate::middleware::auth::AuthUser;
use crate::AppState;

#[derive(Debug, sqlx::FromRow)]
struct ContratoData {
    venda_id: Uuid,
    aluno_id: Uuid,
    curso_id: Uuid,
    aluno_nome: String,
    aluno_cpf: Option<String>,
    curso_nome: String,
    data_inicio_curso: Option<chrono::NaiveDate>,
    valor_total: Option<f64>,
    forma_pagamento: Option<String>,
    vendedor_nome: Option<String>,
}

pub async fn gerar(
    State(state): State<AppState>,
    user: AuthUser,
    Path(id): Path<Uuid>,
) -> (StatusCode, Json<Value>) {
    if user.role != "VENDEDOR" && user.role != "SECRETARIA" {
        return (
            StatusCode::FORBIDDEN,
            Json(json!({"error": "Acesso negado"})),
        );
    }

    let mut conn = match state.db.acquire().await {
        Ok(c) => c,
        Err(e) => {
            tracing::error!(error = %e, "acquire connection for contrato");
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "Erro de conexão com o banco"})),
            );
        }
    };

    if let Err(e) = crate::middleware::rls::inject_rls_context(&mut conn, &user).await {
        tracing::error!(error = %e, "rls injection in contrato");
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "Erro de segurança na operação"})),
        );
    }

    let data = match sqlx::query_as::<_, ContratoData>(
        r#"
        SELECT
            v.id              AS venda_id,
            a.id              AS aluno_id,
            cr.id             AS curso_id,
            a.nome            AS aluno_nome,
            a.cpf             AS aluno_cpf,
            cr.nome           AS curso_nome,
            cr.data_inicio_curso,
            v.valor_total,
            v.forma_pagamento,
            u.nome            AS vendedor_nome
        FROM vendas v
        JOIN alunos a  ON v.aluno_id   = a.id
        JOIN cursos cr ON v.curso_id   = cr.id
        JOIN usuarios u ON v.vendedor_id = u.id
        WHERE v.id = $1
        "#,
    )
    .bind(id)
    .fetch_optional(&mut *conn)
    .await
    {
        Ok(Some(d)) => d,
        Ok(None) => {
            return (
                StatusCode::NOT_FOUND,
                Json(json!({"error": "Venda não encontrada"})),
            )
        }
        Err(e) => {
            tracing::error!(error = %e, "buscar dados do contrato");
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "Erro ao buscar dados da venda"})),
            );
        }
    };

    let tmp_dir = std::env::temp_dir().join(format!("contrato_{}", Uuid::new_v4()));
    let typ_path = tmp_dir.join("contrato.typ");
    let pdf_path = tmp_dir.join("contrato.pdf");

    if let Err(e) = tokio::fs::create_dir_all(&tmp_dir).await {
        tracing::error!(error = %e, "criar diretório temporário");
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "Erro ao criar diretório temporário"})),
        );
    }

    let typ_content = generate_typst_template(&data);
    if let Err(e) = tokio::fs::write(&typ_path, typ_content).await {
        tracing::error!(error = %e, "escrever template typst");
        let _ = tokio::fs::remove_dir_all(&tmp_dir).await;
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "Erro ao gerar documento"})),
        );
    }

    let typ_path_clone = typ_path.clone();
    let pdf_path_clone = pdf_path.clone();

    let _status = match tokio::task::spawn_blocking(move || {
        Command::new("typst")
            .arg("compile")
            .arg(&typ_path_clone)
            .arg(&pdf_path_clone)
            .status()
    })
    .await
    {
        Ok(Ok(s)) if s.success() => s,
        Ok(Ok(s)) => {
            tracing::error!(exit_code = ?s.code(), "typst CLI exited with error");
            let _ = tokio::fs::remove_dir_all(&tmp_dir).await;
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "Typst CLI retornou erro ao compilar"})),
            );
        }
        Ok(Err(e)) => {
            tracing::error!(error = %e, "falha ao executar typst CLI");
            let _ = tokio::fs::remove_dir_all(&tmp_dir).await;
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "Erro ao executar Typst. Verifique se está instalado."})),
            );
        }
        Err(e) => {
            tracing::error!(error = %e, "typst task panicked");
            let _ = tokio::fs::remove_dir_all(&tmp_dir).await;
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "Erro interno ao gerar PDF"})),
            );
        }
    };

    let pdf_bytes = match tokio::fs::read(&pdf_path).await {
        Ok(b) => b,
        Err(e) => {
            tracing::error!(error = %e, "ler PDF gerado");
            let _ = tokio::fs::remove_dir_all(&tmp_dir).await;
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "Erro ao ler PDF gerado"})),
            );
        }
    };

    let _ = tokio::fs::remove_dir_all(&tmp_dir).await;

    let object_path = format!("contratos/{}/{}.pdf", id, Uuid::new_v4());
    let upload_url = format!(
        "{}/storage/v1/object/contratos_pdf/{}",
        state.supabase_url.trim_end_matches('/'),
        object_path
    );

    let client = reqwest::Client::new();
    let upload_resp = client
        .post(&upload_url)
        .header("Authorization", format!("Bearer {}", state.supabase_service_key))
        .header("Content-Type", "application/pdf")
        .body(pdf_bytes)
        .send()
        .await;

    let upload = match upload_resp {
        Ok(r) => r,
        Err(e) => {
            tracing::error!(error = %e, "upload PDF para Supabase Storage");
            return (
                StatusCode::BAD_GATEWAY,
                Json(json!({"error": "Erro ao enviar PDF para storage"})),
            );
        }
    };

    if !upload.status().is_success() {
        let body_text = upload.text().await.unwrap_or_default();
        tracing::error!(status = ?upload.status(), body = %body_text, "supabase storage upload rejected");
        return (
            StatusCode::BAD_GATEWAY,
            Json(json!({"error": "Storage recusou o upload do PDF"})),
        );
    }

    let sign_url = format!(
        "{}/storage/v1/object/sign/contratos_pdf/{}",
        state.supabase_url.trim_end_matches('/'),
        object_path
    );

    let sign_body = json!({"expiresIn": "3600"});

    match client
        .post(&sign_url)
        .header("Authorization", format!("Bearer {}", state.supabase_service_key))
        .header("Content-Type", "application/json")
        .json(&sign_body)
        .send()
        .await
    {
        Ok(resp) if resp.status().is_success() => {
            match resp.json::<Value>().await {
                Ok(sign_data) => {
                    let relative = sign_data["signedURL"]
                        .as_str()
                        .unwrap_or("");
                    let full_url = format!(
                        "{}/storage/v1/{}",
                        state.supabase_url.trim_end_matches('/'),
                        relative.trim_start_matches('/')
                    );
                    (
                        StatusCode::OK,
                        Json(json!({
                            "venda_id": id,
                            "pdf_signed_url": full_url,
                            "expires_at": "3600s"
                        })),
                    )
                }
                Err(e) => {
                    tracing::error!(error = %e, "parse signed-url response");
                    (
                        StatusCode::OK,
                        Json(json!({
                            "venda_id": id,
                            "pdf_signed_url": null,
                            "expires_at": null,
                            "status": "uploaded_no_signed_url"
                        })),
                    )
                }
            }
        }
        Ok(resp) => {
            let status = resp.status();
            let body = resp.text().await.unwrap_or_default();
            tracing::error!(status = ?status, body = %body, "sign URL request failed");
            (
                StatusCode::OK,
                Json(json!({
                    "venda_id": id,
                    "pdf_signed_url": null,
                    "expires_at": null,
                    "status": "uploaded_sign_failed"
                })),
            )
        }
        Err(e) => {
            tracing::error!(error = %e, "sign URL request error");
            (
                StatusCode::OK,
                Json(json!({
                    "venda_id": id,
                    "pdf_signed_url": null,
                    "expires_at": null,
                    "status": "uploaded_sign_error"
                })),
            )
        }
    }
}

fn generate_typst_template(data: &ContratoData) -> String {
    let valor = data.valor_total.unwrap_or(0.0);
    let data_inicio = data
        .data_inicio_curso
        .map(|d| d.to_string())
        .unwrap_or_else(|| "A definir".to_string());
    let agora = chrono::Utc::now().format("%d/%m/%Y %H:%M");

    format!(
        r#"#set page(margin: 2cm)
#set text(font: "Arial", size: 11pt)

= Contrato de Prestação de Serviços Educacionais

#v(1cm)

*Contratante:* {aluno} \
*CPF:* {cpf} \
*Contratada:* Instituição de Ensino

#v(0.5cm)

== Dados do Curso

*Curso:* {curso} \
*Data de Início:* {inicio} \
*Valor Total:* R$ {valor:.2} \
*Forma de Pagamento:* {pagamento}

#v(0.5cm)

== Vendedor Responsável

{vendedor}

#v(0.5cm)

== Termos

O contratante declara estar ciente e de acordo com as condições do curso contratado.

#v(2cm)

---
Gerado em {agora}
"#,
        aluno = data.aluno_nome,
        cpf = data.aluno_cpf.as_deref().unwrap_or("N/A"),
        curso = data.curso_nome,
        inicio = data_inicio,
        valor = valor,
        pagamento = data.forma_pagamento.as_deref().unwrap_or("N/A"),
        vendedor = data.vendedor_nome.as_deref().unwrap_or("N/A"),
        agora = agora,
    )
}
