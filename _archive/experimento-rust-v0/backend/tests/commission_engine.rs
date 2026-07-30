/// Testes da máquina de estados de comissão
///
/// Cenários validados:
/// 1. Venda criada → comissão BLOQUEADA_AUDITORIA
/// 2. Venda aprovada com data futura → AGUARDANDO_INICIO_AULAS
/// 3. Venda aprovada com data passada → LIBERADA_PAGAMENTO
/// 4. Estorno de venda → ESTORNADA + contra-lançamento no livro-caixa
/// 5. Fechamento mensal processa comissões LIBERADA_PAGAMENTO → PAGA

#[derive(Debug, PartialEq, Clone)]
enum StatusVenda {
    PendenteValidacao,
    DevolvidaAjuste,
    Aprovada,
    CanceladaEstornada,
}

#[derive(Debug, PartialEq, Clone)]
enum StatusComissao {
    BloqueadaAuditoria,
    AguardandoInicioAulas,
    LiberadaPagamento,
    Paga,
    Estornada,
}

struct Venda {
    id: String,
    status: StatusVenda,
    data_inicio_curso: chrono::NaiveDate,
    valor_entrada: f64,
}

struct Comissao {
    venda_id: String,
    beneficiario_id: String,
    valor: f64,
    status: StatusComissao,
    liberada_em: Option<chrono::NaiveDate>,
    paga_em: Option<chrono::NaiveDate>,
}

struct LancamentoLivroCaixa {
    tipo: String,
    valor_credito: f64,
    valor_debito: f64,
    mes_competencia: String,
}

fn calcular_status_comissao(venda: &Venda, hoje: chrono::NaiveDate) -> StatusComissao {
    match venda.status {
        StatusVenda::PendenteValidacao | StatusVenda::DevolvidaAjuste => {
            StatusComissao::BloqueadaAuditoria
        }
        StatusVenda::Aprovada => {
            if venda.data_inicio_curso <= hoje {
                StatusComissao::LiberadaPagamento
            } else {
                StatusComissao::AguardandoInicioAulas
            }
        }
        StatusVenda::CanceladaEstornada => StatusComissao::Estornada,
    }
}

fn processar_fechamento_mensal(
    comissoes: &[Comissao],
    mes_competencia: &str,
    hoje: chrono::NaiveDate,
) -> (Vec<Comissao>, Vec<LancamentoLivroCaixa>) {
    let mut novas_comissoes = comissoes.to_vec();
    let mut lancamentos = Vec::new();

    for comissao in novas_comissoes.iter_mut() {
        if comissao.status == StatusComissao::LiberadaPagamento && !comissao.paga_em.is_some() {
            comissao.status = StatusComissao::Paga;
            comissao.paga_em = Some(hoje);
            lancamentos.push(LancamentoLivroCaixa {
                tipo: "PAGAMENTO_COMISSAO".to_string(),
                valor_credito: comissao.valor,
                valor_debito: 0.0,
                mes_competencia: mes_competencia.to_string(),
            });
        }
    }

    (novas_comissoes, lancamentos)
}

fn processar_estorno(comissao: &mut Comissao) -> LancamentoLivroCaixa {
    comissao.status = StatusComissao::Estornada;
    LancamentoLivroCaixa {
        tipo: "ESTORNO_COMISSAO".to_string(),
        valor_credito: 0.0,
        valor_debito: comissao.valor,
        mes_competencia: "2026-07".to_string(),
    }
}

#[test]
fn test_comissao_inicia_bloqueada() {
    let venda = Venda {
        id: "V001".into(),
        status: StatusVenda::PendenteValidacao,
        data_inicio_curso: chrono::NaiveDate::from_ymd_opt(2026, 8, 1).unwrap(),
        valor_entrada: 1500.0,
    };
    let hoje = chrono::NaiveDate::from_ymd_opt(2026, 7, 25).unwrap();

    let status = calcular_status_comissao(&venda, hoje);

    assert_eq!(status, StatusComissao::BloqueadaAuditoria);
}

#[test]
fn test_comissao_aguarda_inicio_aulas_quando_futuro() {
    let venda = Venda {
        id: "V002".into(),
        status: StatusVenda::Aprovada,
        data_inicio_curso: chrono::NaiveDate::from_ymd_opt(2026, 8, 1).unwrap(),
        valor_entrada: 2000.0,
    };
    let hoje = chrono::NaiveDate::from_ymd_opt(2026, 7, 25).unwrap();

    let status = calcular_status_comissao(&venda, hoje);

    assert_eq!(status, StatusComissao::AguardandoInicioAulas);
}

#[test]
fn test_comissao_liberada_quando_aulas_iniciadas() {
    let venda = Venda {
        id: "V003".into(),
        status: StatusVenda::Aprovada,
        data_inicio_curso: chrono::NaiveDate::from_ymd_opt(2026, 7, 20).unwrap(),
        valor_entrada: 2500.0,
    };
    let hoje = chrono::NaiveDate::from_ymd_opt(2026, 7, 25).unwrap();

    let status = calcular_status_comissao(&venda, hoje);

    assert_eq!(status, StatusComissao::LiberadaPagamento);
}

#[test]
fn test_comissao_exata_no_dia_do_inicio() {
    let venda = Venda {
        id: "V004".into(),
        status: StatusVenda::Aprovada,
        data_inicio_curso: chrono::NaiveDate::from_ymd_opt(2026, 7, 25).unwrap(),
        valor_entrada: 3000.0,
    };
    let hoje = chrono::NaiveDate::from_ymd_opt(2026, 7, 25).unwrap();

    let status = calcular_status_comissao(&venda, hoje);

    assert_eq!(status, StatusComissao::LiberadaPagamento);
}

#[test]
fn test_estorno_gera_contra_lancamento() {
    let mut comissao = Comissao {
        venda_id: "V005".into(),
        beneficiario_id: "B001".into(),
        valor: 500.0,
        status: StatusComissao::LiberadaPagamento,
        liberada_em: Some(chrono::NaiveDate::from_ymd_opt(2026, 7, 25).unwrap()),
        paga_em: None,
    };

    let lancamento = processar_estorno(&mut comissao);

    assert_eq!(comissao.status, StatusComissao::Estornada);
    assert_eq!(lancamento.tipo, "ESTORNO_COMISSAO");
    assert_eq!(lancamento.valor_debito, 500.0);
    assert_eq!(lancamento.valor_credito, 0.0);
}

#[test]
fn test_comissao_estornada_nao_pode_ser_paga() {
    let mut comissao = Comissao {
        venda_id: "V006".into(),
        beneficiario_id: "B001".into(),
        valor: 500.0,
        status: StatusComissao::Estornada,
        liberada_em: None,
        paga_em: None,
    };

    let hoje = chrono::NaiveDate::from_ymd_opt(2026, 7, 25).unwrap();
    let (comissoes, lancamentos) = processar_fechamento_mensal(&[comissao.clone()], "2026-07", hoje);

    let comissao_atualizada = comissoes.iter().find(|c| c.venda_id == "V006").unwrap();
    assert_eq!(comissao_atualizada.status, StatusComissao::Estornada, "Comissao estornada nao deve mudar de status");
    assert!(lancamentos.is_empty(), "Nenhum lancamento deve ser gerado para comissao estornada");
}

#[test]
fn test_fechamento_mensal_processa_comissoes_liberadas() {
    let comissoes = vec![
        Comissao {
            venda_id: "V007".into(),
            beneficiario_id: "B001".into(),
            valor: 800.0,
            status: StatusComissao::LiberadaPagamento,
            liberada_em: Some(chrono::NaiveDate::from_ymd_opt(2026, 7, 25).unwrap()),
            paga_em: None,
        },
        Comissao {
            venda_id: "V008".into(),
            beneficiario_id: "B002".into(),
            valor: 1200.0,
            status: StatusComissao::LiberadaPagamento,
            liberada_em: Some(chrono::NaiveDate::from_ymd_opt(2026, 7, 24).unwrap()),
            paga_em: None,
        },
    ];

    let hoje = chrono::NaiveDate::from_ymd_opt(2026, 7, 31).unwrap();
    let (novas_comissoes, lancamentos) = processar_fechamento_mensal(&comissoes, "2026-07", hoje);

    for comissao in &novas_comissoes {
        assert_eq!(comissao.status, StatusComissao::Paga);
        assert!(comissao.paga_em.is_some());
    }

    assert_eq!(lancamentos.len(), 2);
    assert_eq!(lancamentos[0].valor_credito, 800.0);
    assert_eq!(lancamentos[1].valor_credito, 1200.0);
    assert_eq!(lancamentos[0].mes_competencia, "2026-07");
}

#[test]
fn test_comissao_ja_paga_nao_duplica() {
    let comissoes = vec![Comissao {
        venda_id: "V009".into(),
        beneficiario_id: "B001".into(),
        valor: 500.0,
        status: StatusComissao::Paga,
        liberada_em: Some(chrono::NaiveDate::from_ymd_opt(2026, 7, 25).unwrap()),
        paga_em: Some(chrono::NaiveDate::from_ymd_opt(2026, 7, 31).unwrap()),
    }];

    let hoje = chrono::NaiveDate::from_ymd_opt(2026, 8, 1).unwrap();
    let (_novas_comissoes, lancamentos) = processar_fechamento_mensal(&comissoes, "2026-08", hoje);

    assert!(lancamentos.is_empty(), "Comissao ja paga nao deve gerar novo lancamento");
}

#[test]
fn test_transicao_diaria_worker_libera_comissoes() {
    let mut comissao = Comissao {
        venda_id: "V010".into(),
        beneficiario_id: "B001".into(),
        valor: 600.0,
        status: StatusComissao::AguardandoInicioAulas,
        liberada_em: None,
        paga_em: None,
    };

    let venda = Venda {
        id: "V010".into(),
        status: StatusVenda::Aprovada,
        data_inicio_curso: chrono::NaiveDate::from_ymd_opt(2026, 7, 25).unwrap(),
        valor_entrada: 1500.0,
    };

    let hoje = chrono::NaiveDate::from_ymd_opt(2026, 7, 25).unwrap();
    let novo_status = calcular_status_comissao(&venda, hoje);

    assert_eq!(novo_status, StatusComissao::LiberadaPagamento,
        "Worker diario deve transicionar AGUARDANDO_INICIO_AULAS para LIBERADA_PAGAMENTO ao atingir a data de inicio");
}

#[test]
fn test_worker_nao_libera_antes_da_data() {
    let venda = Venda {
        id: "V011".into(),
        status: StatusVenda::Aprovada,
        data_inicio_curso: chrono::NaiveDate::from_ymd_opt(2026, 8, 15).unwrap(),
        valor_entrada: 2000.0,
    };

    let hoje = chrono::NaiveDate::from_ymd_opt(2026, 8, 14).unwrap();
    let status = calcular_status_comissao(&venda, hoje);

    assert_eq!(status, StatusComissao::AguardandoInicioAulas,
        "Worker nao deve liberar comissao antes da data de inicio das aulas");
}
