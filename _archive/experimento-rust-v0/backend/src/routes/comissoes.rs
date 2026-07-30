use axum::{extract::State, http::StatusCode, Json};
use chrono::{FixedOffset, Utc};
use serde_json::{json, Value};
use sqlx::PgPool;
use tracing;
use uuid::Uuid;

use crate::AppState;

pub async fn list(State(state): State<AppState>) -> (StatusCode, Json<Value>) {
    match sqlx::query_scalar::<_, Value>(
        r#"
        SELECT COALESCE(json_agg(
            json_build_object(
                'id', c.id,
                'venda_id', c.venda_id,
                'status', c.status,
                'valor', c.valor,
                'percentual', c.percentual,
                'liberada_em', c.liberada_em,
                'paga_em', c.paga_em,
                'created_at', c.created_at,
                'venda_status', v.status_venda,
                'aluno_nome', a.nome,
                'curso_nome', cr.nome
            ) ORDER BY c.created_at DESC
        ), '[]'::json)
        FROM comissoes c
        JOIN vendas v ON c.venda_id = v.id
        JOIN alunos a ON v.aluno_id = a.id
        JOIN cursos cr ON v.curso_id = cr.id
        "#,
    )
    .fetch_one(&state.db)
    .await
    {
        Ok(data) => (StatusCode::OK, Json(data)),
        Err(e) => {
            tracing::error!(error = %e, "list comissoes");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "Erro ao listar comissões"})),
            )
        }
    }
}

pub async fn calcular(State(state): State<AppState>) -> (StatusCode, Json<Value>) {
    match sqlx::query_scalar::<_, Value>(
        r#"
        SELECT COALESCE(json_agg(
            json_build_object(
                'venda_id', v.id,
                'valor_total', v.valor_total,
                'percentual_comissao', cr.percentual_comissao,
                'valor_comissao', ROUND(v.valor_total * cr.percentual_comissao / 100, 2),
                'curso_nome', cr.nome,
                'aluno_nome', a.nome,
                'vendedor_nome', u.nome
            ) ORDER BY v.created_at DESC
        ), '[]'::json)
        FROM vendas v
        JOIN cursos cr ON v.curso_id = cr.id
        JOIN alunos a ON v.aluno_id = a.id
        JOIN usuarios u ON v.vendedor_id = u.id
        LEFT JOIN comissoes c ON c.venda_id = v.id
        WHERE v.status_venda = 'APROVADA'
          AND c.id IS NULL
        "#,
    )
    .fetch_one(&state.db)
    .await
    {
        Ok(data) => (StatusCode::OK, Json(data)),
        Err(e) => {
            tracing::error!(error = %e, "calcular comissoes");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "Erro ao calcular comissões"})),
            )
        }
    }
}

#[derive(Debug, serde::Serialize)]
pub struct CommissionRelease {
    pub comissao_id: Uuid,
    pub venda_id: Uuid,
}

pub async fn process_daily_commission_release(
    pool: &PgPool,
) -> Result<Vec<CommissionRelease>, sqlx::Error> {
    let sao_paulo = FixedOffset::west_opt(3 * 3600).unwrap();
    let today = Utc::now().with_timezone(&sao_paulo).date_naive();

    let rows = sqlx::query_as::<_, (Uuid, Uuid)>(
        r#"
        UPDATE comissoes c
        SET status = 'LIBERADA_PAGAMENTO', liberada_em = NOW()
        FROM vendas v
        JOIN cursos cur ON v.curso_id = cur.id
        WHERE c.venda_id = v.id
          AND v.status_venda = 'APROVADA'
          AND c.status = 'AGUARDANDO_INICIO_AULAS'
          AND cur.data_inicio_curso <= $1
        RETURNING c.id, c.venda_id
        "#,
    )
    .bind(today)
    .fetch_all(pool)
    .await?;

    let releases: Vec<CommissionRelease> = rows
        .into_iter()
        .map(|(id, venda_id)| {
            tracing::info!(
                comissao_id = %id,
                venda_id = %venda_id,
                "comissão liberada para pagamento — início das aulas já ocorreu"
            );
            CommissionRelease {
                comissao_id: id,
                venda_id,
            }
        })
        .collect();

    tracing::info!(
        total = releases.len(),
        "processamento diário de comissões concluído"
    );

    Ok(releases)
}
