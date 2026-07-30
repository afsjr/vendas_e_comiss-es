import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getServiceRoleClient, getUserAndRole } from "../_shared/client.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { user, role, error: authError } = await getUserAndRole(req);
    if (authError || !user || !['VENDEDOR', 'SECRETARIA'].includes(role || '')) {
      return new Response(JSON.stringify({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await req.json();
    const { aluno_id, curso_id, valor_entrada, data_inicio_curso, comprovante_storage_path } = payload;
    
    if (!aluno_id || !curso_id || !valor_entrada || !data_inicio_curso || !comprovante_storage_path) {
      return new Response(JSON.stringify({ success: false, error: { code: 'BAD_REQUEST', message: 'Missing fields' } }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = getServiceRoleClient();

    // 1. Download file from storage to compute SHA-256
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
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const sha256_checksum = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    // 2. Pre-check SHA256 unique constraint (evidencias_vendas) to return 409
    const { data: existingEvidencia } = await supabase
      .from("evidencias_vendas")
      .select("id")
      .eq("sha256_checksum", sha256_checksum)
      .single();

    if (existingEvidencia) {
      return new Response(JSON.stringify({ success: false, error: { code: 'CONFLICT', message: 'Comprovante duplicado (SHA-256 já existe)' } }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Get curso data for comissao value
    const { data: curso, error: cursoError } = await supabase
      .from("cursos")
      .select("valor_comissao_fixo")
      .eq("id", curso_id)
      .single();

    if (cursoError || !curso) {
       return new Response(JSON.stringify({ success: false, error: { code: 'NOT_FOUND', message: 'Curso não encontrado' } }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert Venda
    const { data: venda, error: vendaError } = await supabase
      .from("vendas")
      .insert({
        aluno_id,
        curso_id,
        valor_entrada,
        data_inicio_curso,
        criado_por: user.id,
        status: 'PENDENTE_VALIDACAO'
      })
      .select()
      .single();

    if (vendaError || !venda) {
      throw vendaError;
    }

    // Insert Evidencia
    const { error: evidenciaError } = await supabase
      .from("evidencias_vendas")
      .insert({
        venda_id: venda.id,
        comprovante_storage_path,
        sha256_checksum
      });

    if (evidenciaError) {
      await supabase.from("vendas").delete().eq("id", venda.id);
      if (evidenciaError.code === '23505') {
        return new Response(JSON.stringify({ success: false, error: { code: 'CONFLICT', message: 'Comprovante duplicado' } }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw evidenciaError;
    }

    // Insert Comissao
    const { error: comissaoError } = await supabase
      .from("comissoes")
      .insert({
        venda_id: venda.id,
        valor_comissao: curso.valor_comissao_fixo,
        status: 'AGUARDANDO_INICIO_AULAS'
      });

    if (comissaoError) {
       await supabase.from("evidencias_vendas").delete().eq("venda_id", venda.id);
       await supabase.from("vendas").delete().eq("id", venda.id);
       throw comissaoError;
    }

    return new Response(JSON.stringify({ success: true, data: venda }), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Venda error:", error);
    return new Response(JSON.stringify({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
