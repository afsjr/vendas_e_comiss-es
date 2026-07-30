use std::future::Future;
use std::pin::Pin;
use std::sync::Arc;

use axum::{
    extract::{FromRequestParts, State},
    http::{header, request::Parts, StatusCode},
    response::IntoResponse,
    Json,
};
use jsonwebtoken::{decode, decode_header, Algorithm, DecodingKey, Validation};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;

use crate::AppState;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthUser {
    pub sub: Uuid,
    pub role: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct JwtClaims {
    pub sub: String,
    pub app_metadata: Option<AppMetadata>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AppMetadata {
    pub app_role: Option<String>,
}

pub struct AuthLayer;

impl<S> FromRequestParts<S> for AuthUser
where
    S: Send + Sync,
    AppState: FromRef<S>,
{
    type Rejection = AuthError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let app_state = AppState::from_ref(state);

        let auth_header = parts
            .headers
            .get(header::AUTHORIZATION)
            .and_then(|v| v.to_str().ok())
            .ok_or(AuthError::MissingToken)?;

        let token = auth_header
            .strip_prefix("Bearer ")
            .ok_or(AuthError::InvalidScheme)?;

        let claims = validate_jwt(token, app_state).await?;

        Ok(AuthUser {
            sub: Uuid::parse_str(&claims.sub).map_err(|_| AuthError::InvalidToken)?,
            role: claims
                .app_metadata
                .and_then(|m| m.app_role)
                .unwrap_or_else(|| "authenticated".into()),
        })
    }
}

async fn validate_jwt(token: &str, state: &AppState) -> Result<JwtClaims, AuthError> {
    let header = decode_header(token).map_err(|_| AuthError::InvalidToken)?;

    let kid = header.kid.as_deref().unwrap_or("default");
    let jwks_url = format!(
        "{}/auth/v1/.well-known/jwks.json",
        state.supabase_url.trim_end_matches('/')
    );

    let jwks: Value = reqwest::get(&jwks_url)
        .await
        .map_err(|_| AuthError::JwksFetch)?
        .json()
        .await
        .map_err(|_| AuthError::JwksFetch)?;

    let jwk = jwks["keys"]
        .as_array()
        .and_then(|keys| keys.iter().find(|k| k["kid"] == kid))
        .ok_or(AuthError::InvalidToken)?;

    let n = jwk["n"].as_str().ok_or(AuthError::InvalidToken)?;
    let e = jwk["e"].as_str().ok_or(AuthError::InvalidToken)?;

    let decoding_key = DecodingKey::from_rsa_components(n, e)
        .map_err(|_| AuthError::InvalidToken)?;

    let mut validation = Validation::new(Algorithm::RS256);
    validation.set_audience(&["authenticated"]);
    validation.set_issuer(&[format!(
        "{}/auth/v1",
        state.supabase_url.trim_end_matches('/')
    )]);

    let token_data = decode::<JwtClaims>(token, &decoding_key, &validation)
        .map_err(|_| AuthError::InvalidToken)?;

    Ok(token_data.claims)
}

#[derive(Debug)]
pub enum AuthError {
    MissingToken,
    InvalidScheme,
    InvalidToken,
    JwksFetch,
}

impl IntoResponse for AuthError {
    fn into_response(self) -> axum::response::Response {
        let (status, msg) = match self {
            AuthError::MissingToken => (StatusCode::UNAUTHORIZED, "Missing authorization header"),
            AuthError::InvalidScheme => (StatusCode::UNAUTHORIZED, "Invalid authorization scheme"),
            AuthError::InvalidToken => (StatusCode::UNAUTHORIZED, "Invalid token"),
            AuthError::JwksFetch => (StatusCode::UNAUTHORIZED, "Failed to fetch JWKS"),
        };
        (status, Json(serde_json::json!({ "error": msg }))).into_response()
    }
}

pub trait FromRef<T> {
    fn from_ref(input: &T) -> Self;
}

impl FromRef<AppState> for AppState {
    fn from_ref(input: &AppState) -> Self {
        input.clone()
    }
}
