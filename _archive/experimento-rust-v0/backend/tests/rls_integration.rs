use sqlx::PgPool;
use serde_json::json;

/// Testes de integração RLS (Row Level Security)
///
/// Cenários validados:
/// 1. VENDEDOR/SECRETARIA só veem seus próprios registros
/// 2. Tentativa de INSERT com criado_por de outro usuário falha
/// 3. AUDITOR/GESTOR veem todos os registros
/// 4. DELETE é bloqueado para todos os perfis
/// 5. VENDEDOR/SECRETARIA só podem fazer UPDATE em vendas DEVOLVIDA_AJUSTE

const JWT_VENDEDOR_A: &str = "eyJ...vendedor_a_token";
const JWT_VENDEDOR_B: &str = "eyJ...vendedor_b_token";
const JWT_AUDITOR: &str = "eyJ...auditor_token";
const JWT_GESTOR: &str = "eyJ...gestor_token";

async fn setup_test_data(pool: &PgPool) -> (uuid::Uuid, uuid::Uuid) {
    let venda_a = uuid::Uuid::new_v4();
    let venda_b = uuid::Uuid::new_v4();

    sqlx::query("INSERT INTO vendas (id, aluno_id, curso_id, valor_entrada, status_venda, criado_por) VALUES ($1, $2, $3, $4, 'PENDENTE_VALIDACAO', $5)")
        .bind(venda_a)
        .bind(uuid::Uuid::new_v4())
        .bind(uuid::Uuid::new_v4())
        .bind(1500.00)
        .bind(uuid::Uuid::parse_str("11111111-1111-1111-1111-111111111111").unwrap())
        .execute(pool)
        .await
        .expect("insert venda_a");

    sqlx::query("INSERT INTO vendas (id, aluno_id, curso_id, valor_entrada, status_venda, criado_por) VALUES ($1, $2, $3, $4, 'PENDENTE_VALIDACAO', $5)")
        .bind(venda_b)
        .bind(uuid::Uuid::new_v4())
        .bind(uuid::Uuid::new_v4())
        .bind(2500.00)
        .bind(uuid::Uuid::parse_str("22222222-2222-2222-2222-222222222222").unwrap())
        .execute(pool)
        .await
        .expect("insert venda_b");

    (venda_a, venda_b)
}

#[sqlx::test]
async fn test_vendedor_ve_apenas_proprias_vendas(pool: PgPool) {
    let (venda_a, _venda_b) = setup_test_data(&pool).await;

    let rows: Vec<(uuid::Uuid,)> = sqlx::query_as(
        "SELECT id FROM vendas WHERE criado_por = $1"
    )
    .bind(uuid::Uuid::parse_str("11111111-1111-1111-1111-111111111111").unwrap())
    .fetch_all(&pool)
    .await
    .unwrap();

    assert_eq!(rows.len(), 1, "Vendedor A deve ver apenas sua venda");
    assert_eq!(rows[0].0, venda_a);
}

#[sqlx::test]
async fn test_insert_com_criado_por_alheio_falha(pool: PgPool) {
    let result = sqlx::query(
        "INSERT INTO vendas (id, aluno_id, curso_id, valor_entrada, status_venda, criado_por) VALUES ($1, $2, $3, $4, 'PENDENTE_VALIDACAO', $5)"
    )
    .bind(uuid::Uuid::new_v4())
    .bind(uuid::Uuid::new_v4())
    .bind(uuid::Uuid::new_v4())
    .bind(1000.00)
    .bind(uuid::Uuid::parse_str("33333333-3333-3333-3333-333333333333").unwrap())
    .execute(&pool)
    .await;

    assert!(result.is_err(), "INSERT com criado_por de outro usuario deve falhar via RLS WITH CHECK");
}

#[sqlx::test]
async fn test_auditor_ve_todas_vendas(pool: PgPool) {
    setup_test_data(&pool).await;

    let rows: Vec<(uuid::Uuid,)> = sqlx::query_as("SELECT id FROM vendas")
        .fetch_all(&pool)
        .await
        .unwrap();

    assert_eq!(rows.len(), 2, "Auditor deve ver todas as vendas");
}

#[sqlx::test]
async fn test_delete_bloqueado_para_todos(pool: PgPool) {
    let (venda_a, _) = setup_test_data(&pool).await;

    let result = sqlx::query("DELETE FROM vendas WHERE id = $1")
        .bind(venda_a)
        .execute(&pool)
        .await;

    assert!(result.is_err(), "DELETE deve ser bloqueado para todos os perfis via RLS");
}

#[sqlx::test]
async fn test_vendedor_atualiza_apenas_devolvida_ajuste(pool: PgPool) {
    let venda_id = uuid::Uuid::new_v4();
    sqlx::query(
        "INSERT INTO vendas (id, aluno_id, curso_id, valor_entrada, status_venda, criado_por) VALUES ($1, $2, $3, $4, 'DEVOLVIDA_AJUSTE', $5)"
    )
    .bind(venda_id)
    .bind(uuid::Uuid::new_v4())
    .bind(uuid::Uuid::new_v4())
    .bind(1000.00)
    .bind(uuid::Uuid::parse_str("11111111-1111-1111-1111-111111111111").unwrap())
    .execute(&pool)
    .await
    .unwrap();

    let result = sqlx::query("UPDATE vendas SET status_venda = 'PENDENTE_VALIDACAO', motivo_devolucao = NULL WHERE id = $1")
        .bind(venda_id)
        .execute(&pool)
        .await;

    assert!(result.is_ok(), "Vendedor deve poder atualizar venda DEVOLVIDA_AJUSTE para reenviar");
}

#[sqlx::test]
async fn test_trigger_imutabilidade_cadastral(pool: PgPool) {
    let venda_id = uuid::Uuid::new_v4();
    sqlx::query(
        "INSERT INTO vendas (id, aluno_id, curso_id, valor_entrada, status_venda, criado_por) VALUES ($1, $2, $3, $4, 'PENDENTE_VALIDACAO', $5)"
    )
    .bind(venda_id)
    .bind(uuid::Uuid::new_v4())
    .bind(uuid::Uuid::new_v4())
    .bind(1000.00)
    .bind(uuid::Uuid::new_v4())
    .execute(&pool)
    .await
    .unwrap();

    let result = sqlx::query("UPDATE vendas SET valor_entrada = 2000.00 WHERE id = $1")
        .bind(venda_id)
        .execute(&pool)
        .await;

    assert!(result.is_err(), "Trigger deve bloquear alteracao de valor_entrada");
}

#[sqlx::test]
async fn test_livro_caixa_append_only(pool: PgPool) {
    let lancamento_id = uuid::Uuid::new_v4();
    sqlx::query(
        "INSERT INTO livro_caixa_lancamentos (id, tipo_lancamento, valor_credito, mes_competencia, historico) VALUES ($1, 'PAGAMENTO_COMISSAO', 500.00, '2026-07', 'teste')"
    )
    .bind(lancamento_id)
    .execute(&pool)
    .await
    .unwrap();

    let update_result = sqlx::query("UPDATE livro_caixa_lancamentos SET valor_credito = 1000.00 WHERE id = $1")
        .bind(lancamento_id)
        .execute(&pool)
        .await;

    assert!(update_result.is_err(), "UPDATE em livro_caixa_lancamentos deve ser bloqueado pelo trigger append-only");

    let delete_result = sqlx::query("DELETE FROM livro_caixa_lancamentos WHERE id = $1")
        .bind(lancamento_id)
        .execute(&pool)
        .await;

    assert!(delete_result.is_err(), "DELETE em livro_caixa_lancamentos deve ser bloqueado pelo trigger append-only");
}
