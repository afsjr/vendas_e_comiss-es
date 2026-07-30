use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;
use tracing_subscriber::EnvFilter;

pub fn init_telemetry() {
    tracing_subscriber::registry()
        .with(EnvFilter::try_from_default_env().unwrap_or_else(|_| {
            "comissionamento_api=info,tower_http=info".into()
        }))
        .with(tracing_subscriber::fmt::layer().json())
        .init();

    tracing::info!("Telemetria inicializada — formato JSON, nível INFO");
}

pub fn init_sentry(dsn: Option<&str>) {
    if let Some(dsn) = dsn {
        let _guard = sentry::init((
            dsn,
            sentry::ClientOptions {
                release: sentry::release_name!(),
                traces_sample_rate: 0.2,
                environment: Some("production".into()),
                ..Default::default()
            },
        ));
        tracing::info!("Sentry iniciado com DSN configurado");
    } else {
        tracing::warn!("SENTRY_DSN não configurado — monitoramento de erros desativado");
    }
}

pub fn create_span(route: &str, method: &str, user_id: &str) -> tracing::Span {
    tracing::info_span!(
        "http_request",
        route = %route,
        method = %method,
        user_id = %user_id,
        service = "comissionamento-api"
    )
}

pub fn record_error(error: &dyn std::fmt::Display, context: &str) {
    tracing::error!(
        error = %error,
        context = %context,
        "Erro registrado"
    );
}
