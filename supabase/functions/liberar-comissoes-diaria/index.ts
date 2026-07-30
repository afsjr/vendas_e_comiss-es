import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getServiceRoleClient } from "../_shared/client.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    const supabase = getServiceRoleClient();
    const hoje = new Date().toISOString().split('T')[0];

    const { data: comissoesParaLiberar, error: fetchError } = await supabase
      .from("comissoes")
      .select("id, venda_id, vendas!inner(status, data_inicio_curso)")
      .eq("status", "AGUARDANDO_INICIO_AULAS")
      .eq("vendas.status", "APROVADA")
      .lte("vendas.data_inicio_curso", hoje);

    if (fetchError) throw fetchError;

    let updatedCount = 0;
    if (comissoesParaLiberar && comissoesParaLiberar.length > 0) {
      const ids = comissoesParaLiberar.map(c => c.id);
      
      const { error: updateError } = await supabase
        .from("comissoes")
        .update({ status: 'LIBERADA_PAGAMENTO', data_liberacao: new Date().toISOString(), atualizado_em: new Date().toISOString() })
        .in("id", ids);

      if (updateError) throw updateError;
      updatedCount = ids.length;
    }

    return new Response(JSON.stringify({ success: true, updated: updatedCount }), {
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
