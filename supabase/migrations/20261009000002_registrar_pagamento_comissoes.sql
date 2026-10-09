-- Feature 010: baixa de pagamento de comissões, transacional e idempotente.
-- Transita comissões LIBERADA_PAGAMENTO -> PAGA, grava data_pagamento e
-- registra o lançamento no livro-caixa (append-only). Mesmo padrão de
-- processar_fechamento_mensal (20261008000003), com seleção por ids.

CREATE OR REPLACE FUNCTION public.registrar_pagamento_comissoes(
  p_ids uuid[],
  p_data_pagamento date DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_registro RECORD;
  v_data timestamptz := COALESCE(p_data_pagamento::timestamptz, now());
  v_pagas int := 0;
  v_ignoradas int := 0;
  v_total numeric := 0;
BEGIN
  IF p_ids IS NULL OR array_length(p_ids, 1) IS NULL THEN
    RETURN jsonb_build_object('pagas', 0, 'ignoradas', 0, 'total', 0);
  END IF;

  -- Bloqueia as comissões alvo para evitar baixa concorrente.
  FOR v_registro IN
    SELECT id, valor_comissao
    FROM public.comissoes
    WHERE id = ANY(p_ids)
    ORDER BY id
    FOR UPDATE
  LOOP
    UPDATE public.comissoes
    SET status = 'PAGA',
        data_pagamento = v_data,
        atualizado_em = now()
    WHERE id = v_registro.id
      AND status = 'LIBERADA_PAGAMENTO';

    IF FOUND THEN
      INSERT INTO public.livro_caixa_lancamentos (comissao_id, tipo, valor_credito, descricao)
      VALUES (
        v_registro.id,
        'CRÉDITO',
        v_registro.valor_comissao,
        'Pagamento comissão ' || to_char(v_data, 'YYYY-MM')
      );

      v_pagas := v_pagas + 1;
      v_total := v_total + v_registro.valor_comissao;
    ELSE
      v_ignoradas := v_ignoradas + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('pagas', v_pagas, 'ignoradas', v_ignoradas, 'total', v_total);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.registrar_pagamento_comissoes(uuid[], date) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_pagamento_comissoes(uuid[], date) TO service_role;

NOTIFY pgrst, 'reload schema';
