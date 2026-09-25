import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getServiceRoleClient, getUserAndRole } from "../_shared/client.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { logger } from "../_shared/log.ts";

// Cancela um lançamento devolvido pela auditoria, a pedido do próprio autor,
// para que ele possa cadastrar uma nova venda corrigida.
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const started = Date.now();
  try {
    const { user, role, error: authError } = await getUserAndRole(req);
    if (authError || !user || !['VENDEDOR', 'SECRETARIA'].includes(role || '')) {
      return new Response(JSON.stringify({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { venda_id, motivo } = await req.json();
    if (!venda_id) {
      return new Response(JSON.stringify({ success: false, error: { code: 'BAD_REQUEST', message: 'venda_id é obrigatório' } }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = getServiceRoleClient();

    const { data: venda, error: vendaError } = await supabase
      .from("vendas")
      .select("id, status, criado_por")
      .eq("id", venda_id)
      .single();

    if (vendaError || !venda) {
      return new Response(JSON.stringify({ success: false, error: { code: 'NOT_FOUND', message: 'Venda não encontrada' } }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (venda.status !== 'DEVOLVIDA_AJUSTE') {
      return new Response(JSON.stringify({ success: false, error: { code: 'INVALID_STATE', message: 'Só é possível cancelar um lançamento devolvido para ajuste' } }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (venda.criado_por !== user.id) {
      return new Response(JSON.stringify({ success: false, error: { code: 'FORBIDDEN', message: 'Apenas o autor do lançamento pode cancelá-lo' } }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("vendas").update({
      status: 'CANCELADA',
      atualizado_em: new Date().toISOString(),
    }).eq("id", venda_id);

    await supabase.from("comissoes").update({
      status: 'ESTORNADA',
      atualizado_em: new Date().toISOString(),
    }).eq("venda_id", venda_id);

    await supabase.from("vendas_historico_status").insert({
      venda_id,
      status_anterior: 'DEVOLVIDA_AJUSTE',
      status_novo: 'CANCELADA',
      motivo: typeof motivo === 'string' && motivo.trim() ? motivo.trim() : 'Substituída por novo lançamento',
      mudado_por: user.id,
    });

    logger.info('venda-cancelar.success', { venda_id, por: user.id });
    logger.perf('venda-cancelar', Date.now() - started);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    logger.error('venda-cancelar', error);
    return new Response(JSON.stringify({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
