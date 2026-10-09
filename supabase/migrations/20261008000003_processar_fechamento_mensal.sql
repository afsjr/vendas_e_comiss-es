-- Correção de integridade (P2.4): o fechamento mensal fazia INSERT no livro caixa
-- seguido de UPDATE de status num loop da aplicação, sem transação — uma falha no
-- meio deixava lançamentos/status descompassados. Esta função encapsula tudo numa
-- única transação atômica, com lock das comissões elegíveis.

CREATE OR REPLACE FUNCTION public.processar_fechamento_mensal(p_mes_competencia text)
RETURNS jsonb AS $$
DECLARE
  v_comissao RECORD;
  v_total NUMERIC := 0;
  v_count INT := 0;
BEGIN
  FOR v_comissao IN
    SELECT id, valor_comissao
    FROM public.comissoes
    WHERE status = 'LIBERADA_PAGAMENTO'
    FOR UPDATE
  LOOP
    INSERT INTO public.livro_caixa_lancamentos (comissao_id, tipo, valor_credito, descricao)
    VALUES (
      v_comissao.id,
      'CRÉDITO',
      v_comissao.valor_comissao,
      'Fechamento mensal ' || coalesce(p_mes_competencia, '')
    );

    UPDATE public.comissoes
    SET status = 'PAGA', atualizado_em = now()
    WHERE id = v_comissao.id;

    v_total := v_total + v_comissao.valor_comissao;
    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object('totalPago', v_total, 'lancamentosCount', v_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.processar_fechamento_mensal(text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.processar_fechamento_mensal(text) TO service_role;

NOTIFY pgrst, 'reload schema';
