import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getServiceRoleClient, getUserAndRole } from "../_shared/client.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { logger } from "../_shared/log.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const started = Date.now();
  try {
    const { user, role, error: authError } = await getUserAndRole(req);
    if (authError || !user || !['AUDITOR', 'GESTOR'].includes(role || '')) {
      return new Response(JSON.stringify({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { venda_id, motivo } = await req.json();
    if (!venda_id || !motivo || motivo.length < 10) {
       return new Response(JSON.stringify({ success: false, error: { code: 'BAD_REQUEST', message: 'Motivo obrigatório com >= 10 chars' } }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = getServiceRoleClient();

    const { data: venda, error: vendaError } = await supabase
      .from("vendas")
      .select("id, status")
      .eq("id", venda_id)
      .single();

    if (vendaError || !venda || venda.status !== 'PRIMEIRA_MENSALIDADE_PAGA') {
       return new Response(JSON.stringify({ success: false, error: { code: 'INVALID_STATE', message: 'Venda inválida' } }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("vendas").update({ status: 'DEVOLVIDA_AJUSTE', atualizado_em: new Date().toISOString() }).eq("id", venda_id);

    await supabase.from("comissoes").update({ status: 'BLOQUEADA_AUDITORIA', atualizado_em: new Date().toISOString() }).eq("venda_id", venda_id);

    await supabase.from("vendas_historico_status").insert({
      venda_id,
      status_anterior: 'PRIMEIRA_MENSALIDADE_PAGA',
      status_novo: 'DEVOLVIDA_AJUSTE',
      motivo,
      mudado_por: user.id
    });

    logger.info('auditoria-devolver.success', { venda_id, por: user.id });
    logger.perf('auditoria-devolver', Date.now() - started);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    logger.error('auditoria-devolver', error);
    return new Response(JSON.stringify({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});