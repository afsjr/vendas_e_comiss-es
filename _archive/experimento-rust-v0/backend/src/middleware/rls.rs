use sqlx::{Connection, PgConnection};
use uuid::Uuid;

use crate::middleware::auth::AuthUser;

#[derive(thiserror::Error, Debug)]
pub enum RlsError {
    #[error("database error: {0}")]
    Database(#[from] sqlx::Error),
    #[error("serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
}

pub async fn inject_rls_context(
    conn: &mut PgConnection,
    user: &AuthUser,
) -> Result<(), RlsError> {
    let claims = serde_json::json!({
        "sub": user.sub.to_string(),
        "app_metadata": {
            "app_role": user.role,
        },
    });

    let claims_str = claims.to_string();

    let mut tx = conn.begin().await?;

    sqlx::query("SET LOCAL ROLE authenticated;")
        .execute(&mut *tx)
        .await?;

    sqlx::query("SELECT set_config('request.jwt.claims', $1, true)")
        .bind(&claims_str)
        .execute(&mut *tx)
        .await?;

    tx.commit().await?;

    Ok(())
}
