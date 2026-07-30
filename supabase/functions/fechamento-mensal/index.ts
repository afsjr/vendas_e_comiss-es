import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getServiceRoleClient, getUserAndRole } from "../_shared/client.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { user, role, error: authError } = await getUserAndRole(req);
    if (authError || !user || !['GESTOR'].includes(role || '')) {
      return new Response(JSON.stringify({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { mes_competencia } = await req.json(); // e.g. "2026-07"
    
    const supabase = getServiceRoleClient();

    const { data: comissoes, error: comissoesError } = await supabase
      .from("comissoes")
      .select("id, valor_comissao")
      .eq("status", "LIBERADA_PAGAMENTO");

    if (comissoesError) throw comissoesError;

    let totalPago = 0;
    let lancamentosCount = 0;

    if (comissoes && comissoes.length > 0) {
      for (const comissao of comissoes) {
         const { error: insertError } = await supabase.from("livro_caixa_lancamentos").insert({
           comissao_id: comissao.id,
           tipo: 'CRÉDITO',
           valor_credito: comissao.valor_comissao,
           descricao: `Fechamento mensal ${mes_competencia || ''}`
         });

         if (!insertError) {
           await supabase.from("comissoes").update({ status: 'PAGA', atualizado_em: new Date().toISOString() }).eq("id", comissao.id);
           totalPago += Number(comissao.valor_comissao);
           lancamentosCount++;
         }
      }
    }

    return new Response(JSON.stringify({ success: true, totalPago, lancamentosCount }), {
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
