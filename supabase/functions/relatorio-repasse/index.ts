import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getServiceRoleClient, getUserAndRole } from "../_shared/client.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { PDFDocument, rgb } from "npm:pdf-lib@1.17.1";

const PAPEIS = ["GESTOR", "AUDITOR", "FINANCEIRO"];

interface Comissao {
  id: string;
  vendedor_id: string;
  curso_nome: string;
  valor: number;
  status: string;
  data_liberacao: string | null;
  data_venda: string | null;
  data_inicio_curso: string | null;
  data_pagamento: string | null;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function dataReferencia(c: Comissao): string | null {
  if (c.status === "PAGA" && c.data_pagamento) return c.data_pagamento;
  return c.data_liberacao;
}

function dentroDoPeriodo(data: string | null, de: string | null, ate: string | null): boolean {
  const dia = data ? data.slice(0, 10) : null;
  if (!dia) return false;
  if (de && dia < de) return false;
  if (ate && dia > ate) return false;
  return true;
}

function moeda(valor: number): string {
  return valor.toFixed(2).replace(".", ",");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { user, role, error: authError } = await getUserAndRole(req);
    if (authError || !user || !PAPEIS.includes(role || "")) {
      return json({ success: false, error: { code: "UNAUTHORIZED", message: "Acesso restrito a gestor, auditor e financeiro." } }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const inicio: string | null = body?.periodo?.inicio ?? null;
    const fim: string | null = body?.periodo?.fim ?? null;
    const vendedorId: string | null = body?.vendedor_id ?? null;
    const situacao: string = body?.situacao ?? "PAGA";

    if (inicio && fim && fim < inicio) {
      return json({ success: false, error: { code: "INVALID_PERIOD", message: "Período inválido: fim antes do início." } }, 400);
    }

    const supabase = getServiceRoleClient();

    const { data: comissoesRaw, error: comissoesError } = await supabase
      .from("comissoes")
      .select("id, valor_comissao, status, data_liberacao, data_pagamento, vendas!inner(criado_por, criado_em, cursos(nome, data_inicio_curso))");

    if (comissoesError) throw comissoesError;

    const comissoes: Comissao[] = (comissoesRaw || []).map((c: any) => ({
      id: c.id,
      vendedor_id: c.vendas?.criado_por ?? "",
      curso_nome: c.vendas?.cursos?.nome ?? "-",
      valor: Number(c.valor_comissao) || 0,
      status: c.status,
      data_liberacao: c.data_liberacao,
      data_venda: c.vendas?.criado_em ?? null,
      data_inicio_curso: c.vendas?.cursos?.data_inicio_curso ?? null,
      data_pagamento: c.data_pagamento,
    }));

    const filtradas = comissoes.filter((c) => {
      if (vendedorId && c.vendedor_id !== vendedorId) return false;
      if (situacao === "PAGA" && c.status !== "PAGA") return false;
      if (situacao === "LIBERADA_PAGAMENTO" && c.status !== "LIBERADA_PAGAMENTO") return false;
      if ((inicio || fim) && !dentroDoPeriodo(dataReferencia(c), inicio, fim)) return false;
      return true;
    });

    if (filtradas.length === 0) {
      return json({ success: false, error: { code: "EMPTY", message: "Nenhuma comissão no recorte." } }, 404);
    }

    const { data: perfis } = await supabase.from("perfis").select("id, nome");
    const nomes: Record<string, string> = {};
    for (const p of perfis || []) nomes[p.id] = p.nome;

    const porVendedor = new Map<string, Comissao[]>();
    for (const c of filtradas) {
      const lista = porVendedor.get(c.vendedor_id) || [];
      lista.push(c);
      porVendedor.set(c.vendedor_id, lista);
    }

    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([600, 800]);
    let y = 760;
    const novoBloco = () => {
      if (y < 80) {
        page = pdfDoc.addPage([600, 800]);
        y = 760;
      }
    };

    page.drawText("Relatório de Repasse", { x: 50, y, size: 20 });
    y -= 28;
    page.drawText(`Período: ${inicio ?? "-"} a ${fim ?? "-"}`, { x: 50, y, size: 11 });
    y -= 16;
    page.drawText(`Emissão: ${new Date().toISOString().slice(0, 10)}  Autor: ${user.email ?? user.id}`, { x: 50, y, size: 11 });
    y -= 16;
    page.drawText(`Situação considerada: ${situacao}`, { x: 50, y, size: 11 });
    y -= 28;

    let totalGeral = 0;

    const vendedoresOrdenados = Array.from(porVendedor.entries()).sort((a, b) =>
      (nomes[a[0]] || a[0]).localeCompare(nomes[b[0]] || b[0])
    );

    for (const [vid, lista] of vendedoresOrdenados) {
      novoBloco();
      const subtotal = lista.reduce((s, c) => s + c.valor, 0);
      page.drawText(`${nomes[vid] || vid} — subtotal ${moeda(subtotal)}`, { x: 50, y, size: 13, color: rgb(0.6, 0.1, 0.2) });
      y -= 20;
      for (const c of lista) {
        novoBloco();
        const linha = `${c.curso_nome}  |  R$ ${moeda(c.valor)}  |  ${c.status}  |  venda ${c.data_venda?.slice(0, 10) ?? "-"}  |  início ${c.data_inicio_curso ?? "-"}`;
        page.drawText(linha, { x: 60, y, size: 10 });
        y -= 15;
      }
      y -= 12;
      totalGeral += subtotal;
    }

    novoBloco();
    page.drawText(`TOTAL GERAL: R$ ${moeda(totalGeral)}`, { x: 50, y, size: 14 });

    const pdfBytes = await pdfDoc.save();

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="repasse-${inicio ?? "inicio"}-${fim ?? "fim"}.pdf"`,
      },
    });
  } catch (error: any) {
    return json({ success: false, error: { code: "INTERNAL_ERROR", message: error.message } }, 500);
  }
});
