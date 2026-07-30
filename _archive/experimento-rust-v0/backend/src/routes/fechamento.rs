use axum::{extract::State, http::StatusCode, Json};
use serde::Deserialize;
use serde_json::{json, Value};
use tracing;

use crate::middleware::auth::AuthUser;
use crate::AppState;

#[derive(Debug, Deserialize)]
pub struct ProcessarRequest {
    pub mes_competencia: String,
}

pub async fn processar(
    State(state): State<AppState>,
    user: AuthUser,
    Json(body): Json<ProcessarRequest>,
) -> (StatusCode, Json<Value>) {
    if user.role != "GESTOR" {
        return (
            StatusCode::FORBIDDEN,
            Json(
                json!({"error": "Apenas gestores podem processar fechamento mensal"}),
            ),
        );
    }

    let mut conn = match state.db.acquire().await {
        Ok(c) => c,
        Err(e) => {
            tracing::error!(error = %e, "acquire connection for fechamento");
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "Erro de conexão com o banco de dados"})),
            );
        }
    };

    if let Err(e) = crate::middleware::rls::inject_rls_context(&mut conn, &user).await {
        tracing::error!(error = %e, "rls injection in fechamento");
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "Erro de segurança na operação"})),
        );
    }

    let mes = &body.mes_competencia;

    match sqlx::query_scalar::<_, Value>(
        r#"
        WITH comissoes_a_pagar AS (
            SELECT c.id, c.venda_id, c.valor
            FROM comissoes c
            WHERE c.status = 'LIBERADA_PAGAMENTO'
              AND c.paga_em IS NULL
        ),
        lancamentos AS (
            INSERT INTO livro_caixa_lancamentos
                (tipo, venda_id, valor, mes_competencia, descricao, created_at)
            SELECT
                'PAGAMENTO_COMISSAO',
                cap.venda_id,
                cap.valor,
                $1::text,
                'Comissão mensal referente a ' || $1::text,
                NOW()
            FROM comissoes_a_pagar cap
            RETURNING id, venda_id, valor
        ),
        atualizados AS (
            UPDATE comissoes c
            SET status = 'PAGA', paga_em = NOW()
            FROM comissoes_a_pagar cap
            WHERE c.id = cap.id
        )
        SELECT json_build_object(
            'mes_competencia', $1::text,
            'total_comissoes_pagas', COALESCE((SELECT SUM(valor)::float8 FROM lancamentos), 0::float8),
            'quantidade_lancamentos', (SELECT COUNT(*)::int8 FROM lancamentos),
            'status', 'FECHADO_SUCESSO'
        )
        "#,
    )
    .bind(mes)
    .fetch_one(&mut *conn)
    .await
    {
        Ok(data) => (StatusCode::OK, Json(data)),
        Err(e) => {
            tracing::error!(error = %e, "executar fechamento mensal");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": "Erro ao processar fechamento mensal"})),
            )
        }
    }
}
