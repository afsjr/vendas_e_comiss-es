use std::net::SocketAddr;

use axum::{routing::post, Router};
use sqlx::PgPool;
use tower_http::cors::CorsLayer;
use tracing_subscriber::EnvFilter;

use comissionamento_api::routes;

#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub jwt_secret: String,
    pub supabase_url: String,
    pub supabase_service_key: String,
    pub storage_url: String,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env())
        .init();

    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let jwt_secret = std::env::var("JWT_SECRET").expect("JWT_SECRET must be set");
    let supabase_url = std::env::var("SUPABASE_URL").expect("SUPABASE_URL must be set");
    let supabase_service_key =
        std::env::var("SUPABASE_SERVICE_KEY").expect("SUPABASE_SERVICE_KEY must be set");
    let storage_url = std::env::var("STORAGE_URL").expect("STORAGE_URL must be set");

    let db = PgPool::connect(&database_url)
        .await
        .expect("Failed to connect to database");

    let state = AppState {
        db,
        jwt_secret,
        supabase_url,
        supabase_service_key,
        storage_url,
    };

    let cors = CorsLayer::permissive();

    let app = Router::new()
        .route("/api/v1/vendas", post(routes::vendas::create))
        .route(
            "/api/v1/auditoria/:id/aprovar",
            post(routes::auditoria::approve),
        )
        .route(
            "/api/v1/auditoria/:id/devolver",
            post(routes::auditoria::devolver),
        )
        .route(
            "/api/v1/fechamento/processar-mensal",
            post(routes::fechamento::processar),
        )
        .route(
            "/api/v1/vendas/:id/gerar-contrato",
            post(routes::contratos::gerar),
        )
        .layer(cors)
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    tracing::info!("listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
