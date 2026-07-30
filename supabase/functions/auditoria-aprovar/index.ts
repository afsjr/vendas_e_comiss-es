import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getServiceRoleClient, getUserAndRole } from "../_shared/client.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { user, role, error: authError } = await getUserAndRole(req);
    if (authError || !user || !['AUDITOR', 'GESTOR'].includes(role || '')) {
      return new Response(JSON.stringify({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { venda_id } = await req.json();
    if (!venda_id) {
       return new Response(JSON.stringify({ success: false, error: { code: 'BAD_REQUEST', message: 'Missing venda_id' } }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = getServiceRoleClient();

    const { data: venda, error: vendaError } = await supabase
      .from("vendas")
      .select("id, status, data_inicio_curso")
      .eq("id", venda_id)
      .single();

    if (vendaError || !venda || venda.status !== 'PENDENTE_VALIDACAO') {
       return new Response(JSON.stringify({ success: false, error: { code: 'INVALID_STATE', message: 'Venda não está pendente ou não encontrada' } }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const hoje = new Date();
    const inicioCurso = new Date(venda.data_inicio_curso);
    const statusComissao = inicioCurso <= hoje ? 'LIBERADA_PAGAMENTO' : 'AGUARDANDO_INICIO_AULAS';

    // 1. Atualizar Venda
    await supabase.from("vendas").update({ status: 'APROVADA', atualizado_em: new Date().toISOString() }).eq("id", venda_id);

    // 2. Atualizar Comissão
    await supabase.from("comissoes").update({ status: statusComissao, atualizado_em: new Date().toISOString() }).eq("venda_id", venda_id);

    // 3. Inserir Histórico
    await supabase.from("vendas_historico_status").insert({
      venda_id,
      status_anterior: 'PENDENTE_VALIDACAO',
      status_novo: 'APROVADA',
      mudado_por: user.id
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
