use axum::{
    extract::{Multipart, State},
    http::StatusCode,
    Json,
};
use chrono::{DateTime, Utc};
use serde::Serialize;
use sha2::{Digest, Sha256};
use uuid::Uuid;

use crate::middleware::auth::AuthUser;
use crate::middleware::rls::inject_rls_context;
use crate::AppState;

#[derive(Debug, Serialize)]
pub struct CreateVendaResponse {
    pub id: Uuid,
    pub status_venda: String,
    pub sha256_checksum: String,
    pub criado_em: DateTime<Utc>,
}

pub async fn create(
    State(state): State<AppState>,
    user: AuthUser,
    mut multipart: Multipart,
) -> Result<(StatusCode, Json<CreateVendaResponse>), VendaError> {
    let mut aluno_id: Option<Uuid> = None;
    let mut curso_id: Option<Uuid> = None;
    let mut valor_entrada: Option<f64> = None;
    let mut file_name: Option<String> = None;
    let mut file_bytes: Option<Vec<u8>> = None;

    while let Some(field) = multipart.next_field().await? {
        let name = field.name().unwrap_or("").to_string();
        match name.as_str() {
            "aluno_id" => {
                let text = field.text().await?;
                aluno_id = Some(
                    Uuid::parse_str(&text)
                        .map_err(|_| VendaError::InvalidField("aluno_id"))?,
                );
            }
            "curso_id" => {
                let text = field.text().await?;
                curso_id = Some(
                    Uuid::parse_str(&text)
                        .map_err(|_| VendaError::InvalidField("curso_id"))?,
                );
            }
            "valor_entrada" => {
                let text = field.text().await?;
                valor_entrada = Some(
                    text.parse::<f64>()
                        .map_err(|_| VendaError::InvalidField("valor_entrada"))?,
                );
            }
            "comprovante_file" => {
                file_name = field.file_name().map(|s| s.to_string());
                file_bytes = Some(field.bytes().await?.to_vec());
            }
            _ => {}
        }
    }

    let aluno_id = aluno_id.ok_or(VendaError::MissingField("aluno_id"))?;
    let curso_id = curso_id.ok_or(VendaError::MissingField("curso_id"))?;
    let valor_entrada = valor_entrada.ok_or(VendaError::MissingField("valor_entrada"))?;
    let file_bytes = file_bytes.ok_or(VendaError::MissingField("comprovante_file"))?;
    let file_name = file_name.unwrap_or_else(|| "comprovante".into());

    let checksum = format!("{:x}", Sha256::digest(&file_bytes));

    let exists = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM evidencias_venda WHERE sha256_checksum = $1)",
    )
    .bind(&checksum)
    .fetch_one(&state.db)
    .await?;

    if exists {
        return Err(VendaError::DuplicateReceipt(checksum));
    }

    let storage_path = format!("{}/{}_{}", aluno_id, Uuid::new_v4(), file_name);
    let upload_url = format!(
        "{}/storage/v1/object/comprovantes/{}",
        state.supabase_url.trim_end_matches('/'),
        storage_path
    );

    let client = reqwest::Client::new();
    let resp = client
        .post(&upload_url)
        .header("Authorization", format!("Bearer {}", state.supabase_service_key))
        .header("Content-Type", "application/octet-stream")
        .body(file_bytes)
        .send()
        .await
        .map_err(|e| VendaError::Upload(e.to_string()))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(VendaError::Upload(format!("{}: {}", status, body)));
    }

    let mut conn = state.db.acquire().await?;
    inject_rls_context(&mut conn, &user).await?;

    let mut tx = conn.begin().await?;

    let claims = serde_json::json!({
        "sub": user.sub.to_string(),
        "app_metadata": { "app_role": user.role },
    });
    sqlx::query("SELECT set_config('request.jwt.claims', $1, true)")
        .bind(&claims.to_string())
        .execute(&mut *tx)
        .await?;

    let venda_id = Uuid::new_v4();
    let evidencia_id = Uuid::new_v4();
    let comissao_id = Uuid::new_v4();
    let now = Utc::now();

    sqlx::query(
        "INSERT INTO vendas (id, aluno_id, curso_id, valor_entrada, status, criado_em, atualizado_em) VALUES ($1, $2, $3, $4, 'PENDENTE_VALIDACAO', $5, $5)",
    )
    .bind(venda_id)
    .bind(aluno_id)
    .bind(curso_id)
    .bind(valor_entrada)
    .bind(now)
    .execute(&mut *tx)
    .await?;

    sqlx::query(
        "INSERT INTO evidencias_venda (id, venda_id, storage_path, sha256_checksum, criado_em) VALUES ($1, $2, $3, $4, $5)",
    )
    .bind(evidencia_id)
    .bind(venda_id)
    .bind(&storage_path)
    .bind(&checksum)
    .bind(now)
    .execute(&mut *tx)
    .await?;

    sqlx::query(
        "INSERT INTO comissoes (id, venda_id, status, criado_em, atualizado_em) VALUES ($1, $2, 'BLOQUEADA_AUDITORIA', $3, $3)",
    )
    .bind(comissao_id)
    .bind(venda_id)
    .bind(now)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    tracing::info!(
        venda_id = %venda_id,
        sha256 = %checksum,
        "venda created with pending validation"
    );

    Ok((
        StatusCode::CREATED,
        Json(CreateVendaResponse {
            id: venda_id,
            status_venda: "PENDENTE_VALIDACAO".into(),
            sha256_checksum: checksum,
            criado_em: now,
        }),
    ))
}

#[derive(Debug, thiserror::Error)]
pub enum VendaError {
    #[error("campo obrigatório ausente: {0}")]
    MissingField(&'static str),
    #[error("campo inválido: {0}")]
    InvalidField(&'static str),
    #[error("comprovante duplicado: {0}")]
    DuplicateReceipt(String),
    #[error("falha no upload: {0}")]
    Upload(String),
    #[error(transparent)]
    Database(#[from] sqlx::Error),
    #[error(transparent)]
    Rls(#[from] crate::middleware::rls::RlsError),
    #[error(transparent)]
    Multipart(#[from] axum::extract::multipart::MultipartError),
}

impl axum::response::IntoResponse for VendaError {
    fn into_response(self) -> axum::response::Response {
        match self {
            VendaError::MissingField(field) => {
                (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": format!("campo '{}' é obrigatório", field) }))).into_response()
            }
            VendaError::InvalidField(field) => {
                (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": format!("campo '{}' com valor inválido", field) }))).into_response()
            }
            VendaError::DuplicateReceipt(hash) => {
                (StatusCode::CONFLICT, Json(serde_json::json!({
                    "code": "DUPLICATE_RECEIPT_HASH",
                    "message": format!("comprovante com hash {} já foi registrado", hash),
                    "sha256_checksum": hash,
                }))).into_response()
            }
            VendaError::Upload(msg) => {
                tracing::error!(%msg, "storage upload failed");
                (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": "falha ao salvar comprovante" }))).into_response()
            }
            VendaError::Database(e) => {
                tracing::error!(%e, "database error");
                (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": "erro interno do servidor" }))).into_response()
            }
            VendaError::Rls(e) => {
                tracing::error!(%e, "RLS context injection failed");
                (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "error": "erro interno do servidor" }))).into_response()
            }
            VendaError::Multipart(e) => {
                tracing::error!(%e, "multipart parse error");
                (StatusCode::BAD_REQUEST, Json(serde_json::json!({ "error": e.to_string() }))).into_response()
            }
        }
    }
}
