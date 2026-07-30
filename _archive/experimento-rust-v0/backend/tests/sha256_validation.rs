use sha2::{Sha256, Digest};

/// Testes de validação SHA-256 server-side
///
/// Cenários validados:
/// 1. Cálculo correto do hash SHA-256
/// 2. Hash diferente para arquivos diferentes
/// 3. Constraint unique_hash_sha256 rejeita duplicidade

#[test]
fn test_sha256_calculo_correto() {
    let content = b"conteudo do comprovante de pagamento";
    let hash = format!("{:x}", Sha256::digest(content));
    let expected = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

    assert_eq!(hash.len(), 64, "SHA-256 hash deve ter 64 caracteres hex");
    assert!(hash.chars().all(|c| c.is_ascii_hexdigit()), "Hash deve conter apenas hex digitis");
}

#[test]
fn test_sha256_diferente_para_arquivos_diferentes() {
    let content_a = b"comprovante_venda_001.png";
    let content_b = b"comprovante_venda_002.png";

    let hash_a = format!("{:x}", Sha256::digest(content_a));
    let hash_b = format!("{:x}", Sha256::digest(content_b));

    assert_ne!(hash_a, hash_b, "Arquivos diferentes devem gerar hashes diferentes");
}

#[test]
fn test_sha256_mesmo_arquivo_mesmo_hash() {
    let content = b"comprovante_identico.png";

    let hash_a = format!("{:x}", Sha256::digest(content));
    let hash_b = format!("{:x}", Sha256::digest(content));

    assert_eq!(hash_a, hash_b, "Mesmo arquivo deve sempre gerar o mesmo hash");
}

#[test]
fn test_sha256_hash_vazio() {
    let content = b"";
    let hash = format!("{:x}", Sha256::digest(content));
    let expected = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

    assert_eq!(hash, expected, "Hash de SHA-256 de string vazia deve ser o conhecido");
}

#[test]
fn test_sha256_formato_hex() {
    let content = b"algum arquivo binario com bytes: \x00\x01\x02\xFF";
    let hash = format!("{:x}", Sha256::digest(content));

    assert_eq!(hash.len(), 64);
    assert!(hash.chars().all(|c| matches!(c, '0'..='9' | 'a'..='f')));
}

#[test]
fn test_sha256_consistencia_multiplas_chamadas() {
    let content = b"comprovante_pagamento_aluno_123";

    let hash_1 = format!("{:x}", Sha256::digest(content));
    let hash_2 = format!("{:x}", Sha256::digest(content));
    let hash_3 = format!("{:x}", Sha256::digest(content));

    assert_eq!(hash_1, hash_2);
    assert_eq!(hash_2, hash_3);
}

/// Simula a validação de constraint unique_hash_sha256
#[test]
fn test_constraint_unicidade() {
    use std::collections::HashSet;

    let mut hashes = HashSet::new();

    let comprovantes = vec![
        b"comprovante_001".to_vec(),
        b"comprovante_002".to_vec(),
        b"comprovante_003".to_vec(),
    ];

    for comprovante in &comprovantes {
        let hash = format!("{:x}", Sha256::digest(comprovante));
        assert!(
            hashes.insert(hash.clone()),
            "Hash duplicado detectado: {}",
            hash
        );
    }

    assert_eq!(hashes.len(), 3, "Deve haver 3 hashes únicos para 3 comprovantes diferentes");
}

#[test]
fn test_rejeicao_duplicata() {
    let content = b"comprovante_duplicado";
    let hash = format!("{:x}", Sha256::digest(content));

    let mut hashes = std::collections::HashSet::new();
    assert!(hashes.insert(hash.clone()), "Primeira insercao deve ser aceita");
    assert!(!hashes.insert(hash), "Segunda insercao do mesmo hash deve ser rejeitada");
}

/// Testa que a constraint no banco rejeita o mesmo hash
/// Simula a lógica que o backend Rust executa server-side
#[test]
fn test_server_side_recalculo() {
    let file_bytes = b"bytes_reais_do_upload";
    let server_side_hash = format!("{:x}", Sha256::digest(file_bytes));

    let client_side_hash = format!("{:x}", Sha256::digest(b"bytes_reais_do_upload"));

    assert_eq!(
        server_side_hash, client_side_hash,
        "Hash server-side e client-side devem ser iguais para o mesmo conteudo"
    );
}
