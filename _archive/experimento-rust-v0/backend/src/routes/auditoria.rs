use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde::Deserialize;
use serde_json::{json, Value};
use uuid::Uuid;

use crate::middleware::auth::AuthUser;
use crate::middleware::rls::inject_rls_context;
use crate::AppState;

#[derive(Deserialize)]
pub struct DevolverBody {
    pub motivo_devolucao: String,
}

pub async fn approve(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    user: AuthUser,
) -> (StatusCode, Json<Value>) {
    if user.role != "AUDITOR" {
        return (
            StatusCode::FORBIDDEN,
            Json(json!({"code": "FORBIDDEN", "message": "Apenas AUDITOR pode aprovar vendas"})),
        );
    }

    let mut conn = match state.db.acquire().await {
        Ok(c) => c,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"code": "INTERNAL_ERROR", "message": e.to_string()})),
            );
        }
    };

    if let Err(e) = inject_rls_context(&mut conn, &user).await {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"code": "INTERNAL_ERROR", "message": e.to_string()})),
        );
    }

    let row = match sqlx::query_as::<_, (String, String)>(
        r#"
        SELECT v.status_venda::text, c.data_inicio_curso::text
        FROM vendas v
        JOIN cursos c ON c.id = v.curso_id
        WHERE v.id = $1
        "#,
    )
    .bind(id)
    .fetch_optional(&mut *conn)
    .await
    {
        Ok(Some(row)) => row,
        Ok(None) => {
            return (
                StatusCode::NOT_FOUND,
                Json(json!({"code": "NOT_FOUND", "message": "Venda não encontrada"})),
            );
        }
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"code": "INTERNAL_ERROR", "message": e.to_string()})),
            );
        }
    };

    let (status_venda, data_inicio_str) = row;

    if status_venda != "PENDENTE_VALIDACAO" {
        return (
            StatusCode::CONFLICT,
            Json(json!({
                "code": "INVALID_STATUS",
                "message": format!(
                    "Venda não está em PENDENTE_VALIDACAO (status atual: {})",
                    status_venda
                )
            })),
        );
    }

    let hoje = chrono::Utc::now().date_naive();
    let data_inicio = match chrono::NaiveDate::parse_from_str(&data_inicio_str, "%Y-%m-%d") {
        Ok(d) => d,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"code": "INTERNAL_ERROR", "message": e.to_string()})),
            );
        }
    };

    let status_comissao = if data_inicio > hoje {
        "AGUARDANDO_INICIO_AULAS"
    } else {
        "LIBERADA_PAGAMENTO"
    };

    let mut tx = match conn.begin().await {
        Ok(tx) => tx,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"code": "INTERNAL_ERROR", "message": e.to_string()})),
            );
        }
    };

    if let Err(e) = sqlx::query(
        "UPDATE vendas SET status_venda = 'APROVADA', atualizado_em = clock_timestamp() WHERE id = $1",
    )
    .bind(id)
    .execute(&mut *tx)
    .await
    {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"code": "INTERNAL_ERROR", "message": e.to_string()})),
        );
    }

    let comissao_update = match sqlx::query(
        "UPDATE comissoes SET status_comissao = $1::status_comissao_enum WHERE venda_id = $2",
    )
    .bind(status_comissao)
    .bind(id)
    .execute(&mut *tx)
    .await
    {
        Ok(r) => r,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"code": "INTERNAL_ERROR", "message": e.to_string()})),
            );
        }
    };

    if comissao_update.rows_affected() == 0 {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({
                "code": "MISSING_COMISSAO",
                "message": "Nenhum registro de comissão encontrado para esta venda"
            })),
        );
    }

    if let Err(e) = sqlx::query(
        r#"
        INSERT INTO vendas_historico_status (venda_id, status_anterior, status_novo, alterado_por)
        VALUES ($1, 'PENDENTE_VALIDACAO'::status_venda_enum, 'APROVADA'::status_venda_enum, $2)
        "#,
    )
    .bind(id)
    .bind(user.sub)
    .execute(&mut *tx)
    .await
    {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"code": "INTERNAL_ERROR", "message": e.to_string()})),
        );
    }

    if let Err(e) = tx.commit().await {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"code": "INTERNAL_ERROR", "message": e.to_string()})),
        );
    }

    (
        StatusCode::OK,
        Json(json!({
            "venda_id": id,
            "status_venda": "APROVADA",
            "status_comissao": status_comissao,
            "mensagem": "Venda aprovada com sucesso",
        })),
    )
}

pub async fn devolver(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    user: AuthUser,
    Json(body): Json<DevolverBody>,
) -> (StatusCode, Json<Value>) {
    if user.role != "AUDITOR" {
        return (
            StatusCode::FORBIDDEN,
            Json(json!({"code": "FORBIDDEN", "message": "Apenas AUDITOR pode devolver vendas"})),
        );
    }

    if body.motivo_devolucao.trim().len() < 10 {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "code": "INVALID_REJECTION_REASON",
                "message": "Motivo de devolução deve ter no mínimo 10 caracteres"
            })),
        );
    }

    let mut conn = match state.db.acquire().await {
        Ok(c) => c,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"code": "INTERNAL_ERROR", "message": e.to_string()})),
            );
        }
    };

    if let Err(e) = inject_rls_context(&mut conn, &user).await {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"code": "INTERNAL_ERROR", "message": e.to_string()})),
        );
    }

    let status_venda: String = match sqlx::query_scalar::<_, String>(
        "SELECT status_venda::text FROM vendas WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(&mut *conn)
    .await
    {
        Ok(Some(s)) => s,
        Ok(None) => {
            return (
                StatusCode::NOT_FOUND,
                Json(json!({"code": "NOT_FOUND", "message": "Venda não encontrada"})),
            );
        }
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"code": "INTERNAL_ERROR", "message": e.to_string()})),
            );
        }
    };

    if status_venda != "PENDENTE_VALIDACAO" {
        return (
            StatusCode::CONFLICT,
            Json(json!({
                "code": "INVALID_STATUS",
                "message": format!(
                    "Venda não está em PENDENTE_VALIDACAO (status atual: {})",
                    status_venda
                )
            })),
        );
    }

    let mut tx = match conn.begin().await {
        Ok(tx) => tx,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"code": "INTERNAL_ERROR", "message": e.to_string()})),
            );
        }
    };

    if let Err(e) = sqlx::query(
        "UPDATE vendas SET status_venda = 'DEVOLVIDA_AJUSTE', motivo_devolucao = $1, atualizado_em = clock_timestamp() WHERE id = $2",
    )
    .bind(&body.motivo_devolucao)
    .bind(id)
    .execute(&mut *tx)
    .await
    {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"code": "INTERNAL_ERROR", "message": e.to_string()})),
        );
    }

    if let Err(e) = sqlx::query(
        r#"
        INSERT INTO vendas_historico_status (venda_id, status_anterior, status_novo, motivo, alterado_por)
        VALUES ($1, 'PENDENTE_VALIDACAO'::status_venda_enum, 'DEVOLVIDA_AJUSTE'::status_venda_enum, $2, $3)
        "#,
    )
    .bind(id)
    .bind(&body.motivo_devolucao)
    .bind(user.sub)
    .execute(&mut *tx)
    .await
    {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"code": "INTERNAL_ERROR", "message": e.to_string()})),
        );
    }

    if let Err(e) = tx.commit().await {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"code": "INTERNAL_ERROR", "message": e.to_string()})),
        );
    }

    (
        StatusCode::OK,
        Json(json!({
            "venda_id": id,
            "status_venda": "DEVOLVIDA_AJUSTE",
            "status_comissao": "BLOQUEADA_AUDITORIA",
            "motivo_devolucao": body.motivo_devolucao,
        })),
    )
}
