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

    const { data: resultado, error: fechamentoError } = await supabase.rpc(
      'processar_fechamento_mensal',
      { p_mes_competencia: mes_competencia || '' }
    );

    if (fechamentoError) throw fechamentoError;

    return new Response(JSON.stringify({ success: true, ...resultado }), {
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
