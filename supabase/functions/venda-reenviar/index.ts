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
    if (authError || !user || !['VENDEDOR', 'SECRETARIA'].includes(role || '')) {
      return new Response(JSON.stringify({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { venda_id, comprovante_storage_path, resposta } = await req.json();
    if (!venda_id || !comprovante_storage_path) {
      return new Response(JSON.stringify({ success: false, error: { code: 'BAD_REQUEST', message: 'venda_id e comprovante_storage_path são obrigatórios' } }), {
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
      return new Response(JSON.stringify({ success: false, error: { code: 'INVALID_STATE', message: 'A venda não está devolvida para ajuste' } }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (venda.criado_por !== user.id) {
      return new Response(JSON.stringify({ success: false, error: { code: 'FORBIDDEN', message: 'Apenas o autor do lançamento pode reenviar' } }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Baixa o novo comprovante e calcula SHA-256
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("comprovantes")
      .download(comprovante_storage_path);

    if (downloadError || !fileData) {
      return new Response(JSON.stringify({ success: false, error: { code: 'NOT_FOUND', message: 'Comprovante não encontrado no storage' } }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const sha256_checksum = Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");

    // 2. Substitui a evidência anterior deste lançamento pela nova
    await supabase.from("evidencias_vendas").delete().eq("venda_id", venda_id);

    const { error: evidenciaError } = await supabase
      .from("evidencias_vendas")
      .insert({ venda_id, comprovante_storage_path, sha256_checksum });

    if (evidenciaError) {
      if (evidenciaError.code === '23505') {
        return new Response(JSON.stringify({ success: false, error: { code: 'CONFLICT', message: 'Comprovante já utilizado em outro lançamento' } }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw evidenciaError;
    }

    // 3. Volta a venda para a fila de validação e limpa a devolução
    const { error: updateError } = await supabase
      .from("vendas")
      .update({
        status: 'PENDENTE_VALIDACAO',
        devolucao_itens: null,
        devolucao_observacao: null,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", venda_id);
    if (updateError) throw updateError;

    await supabase.from("vendas_historico_status").insert({
      venda_id,
      status_anterior: 'DEVOLVIDA_AJUSTE',
      status_novo: 'PENDENTE_VALIDACAO',
      motivo: typeof resposta === 'string' && resposta.trim() ? resposta.trim() : 'Reenvio com novo comprovante',
      mudado_por: user.id,
    });

    logger.info('venda-reenviar.success', { venda_id, por: user.id });
    logger.perf('venda-reenviar', Date.now() - started);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    logger.error('venda-reenviar', error);
    return new Response(JSON.stringify({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
