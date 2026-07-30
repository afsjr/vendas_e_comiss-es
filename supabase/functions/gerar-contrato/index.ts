import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getServiceRoleClient, getUserAndRole } from "../_shared/client.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { PDFDocument, rgb } from "https://cdn.skypack.dev/pdf-lib@1.17.1?dts";
import { getContratoTextLines } from "./template.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { user, role, error: authError } = await getUserAndRole(req);
    if (authError || !user || !['VENDEDOR', 'SECRETARIA', 'AUDITOR', 'GESTOR'].includes(role || '')) {
      return new Response(JSON.stringify({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { venda_id } = await req.json();
    const supabase = getServiceRoleClient();

    const { data: venda, error: vendaError } = await supabase
      .from("vendas")
      .select("*, alunos(nome, cpf), cursos(nome)")
      .eq("id", venda_id)
      .single();

    if (vendaError || !venda) {
      return new Response(JSON.stringify({ success: false, error: { code: 'NOT_FOUND', message: 'Venda não encontrada' } }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    
    const lines = getContratoTextLines(venda.alunos.nome, venda.alunos.cpf, venda.cursos.nome, venda.valor_entrada);
    let yPos = 750;
    
    for (const line of lines) {
      const size = line.title ? 20 : 14;
      page.drawText(line.text, { x: 50, y: yPos, size });
      yPos -= (size + 10);
    }

    const pdfBytes = await pdfDoc.save();
    const fileName = `contrato_${venda_id}_${Date.now()}.pdf`;
    
    const { error: uploadError } = await supabase.storage
      .from("contratos_pdf")
      .upload(fileName, pdfBytes, { contentType: 'application/pdf' });

    if (uploadError) throw uploadError;

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("contratos_pdf")
      .createSignedUrl(fileName, 60 * 15);

    if (signedUrlError) throw signedUrlError;

    return new Response(JSON.stringify({ success: true, signedUrl: signedUrlData.signedUrl }), {
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
