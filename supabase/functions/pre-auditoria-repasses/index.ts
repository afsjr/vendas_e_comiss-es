import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getServiceRoleClient, getUserAndRole } from "../_shared/client.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { logger } from "../_shared/log.ts";
import {
  decodeLatin1,
  parseRepasseCsv,
  resultadoConciliacao,
  resumoPorCpf,
  type RepasseLinha,
} from "../_shared/repasse_parser.ts";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const BUCKET = "relatorios_repasse";

const jsonError = (status: number, code: string, message: string): Response =>
  new Response(JSON.stringify({ success: false, error: { code, message } }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const jsonOk = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify({ success: true, data }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function extrairPolo(content: string): { bpPolo: string | null; divisao: string | null } {
  for (const raw of content.split(/\r?\n/)) {
    if (!raw.trim()) continue;
    const cells = raw.split(";");
    if ((cells[0] || "").trim().toLowerCase() === "bp polo") continue;
    return { bpPolo: cells[0]?.trim() || null, divisao: cells[1]?.trim() || null };
  }
  return { bpPolo: null, divisao: null };
}

interface VendaPendente {
  vendaId: string;
  comissaoId: string | null;
  cpf: string;
}

async function carregarVendasPendentes(supabase: SupabaseClient): Promise<VendaPendente[]> {
  const { data, error } = await supabase
    .from("vendas")
    .select("id, alunos!inner(cpf), cursos!inner(categoria), comissoes(id, status)");

  if (error) throw error;

  const pendentes: VendaPendente[] = [];
  for (const row of data || []) {
    const categoria = (row as any).cursos?.categoria;
    if (categoria !== "Graduação") continue;

    const statusComissao = (row as any).comissoes?.status;
    if (statusComissao === "LIBERADA_PAGAMENTO" || statusComissao === "PAGA") continue;

    const cpf = String((row as any).alunos?.cpf || "").replace(/\D/g, "");
    if (cpf.length !== 11) continue;

    pendentes.push({
      vendaId: (row as any).id,
      comissaoId: (row as any).comissoes?.id ?? null,
      cpf,
    });
  }
  return pendentes;
}

async function importar(supabase: SupabaseClient, userId: string, body: any): Promise<Response> {
  const storagePath = body?.storage_path as string | undefined;
  if (!storagePath) return jsonError(400, "BAD_REQUEST", "storage_path é obrigatório");

  const { data: file, error: downloadError } = await supabase.storage.from(BUCKET).download(storagePath);
  if (downloadError || !file) return jsonError(404, "NOT_FOUND", "Arquivo não encontrado no bucket");

  const buffer = await file.arrayBuffer();
  const checksum = await sha256Hex(buffer);

  const { data: existente } = await supabase
    .from("relatorios_repasse")
    .select("id")
    .eq("sha256_checksum", checksum)
    .maybeSingle();
  if (existente) return jsonError(409, "CONFLICT", "Arquivo já importado (SHA-256 duplicado)");

  const content = decodeLatin1(new Uint8Array(buffer));
  const { linhas, totalLinhas } = parseRepasseCsv(content);
  if (linhas.length === 0) return jsonError(422, "UNPROCESSABLE", "Nenhuma linha de repasse interpretável");

  const { bpPolo, divisao } = extrairPolo(content);

  const { data: relatorio, error: relError } = await supabase
    .from("relatorios_repasse")
    .insert({
      storage_path: storagePath,
      formato: "CSV",
      competencia_pagamento: body?.competencia_pagamento ?? null,
      bp_polo: bpPolo,
      divisao: divisao,
      sha256_checksum: checksum,
      total_linhas: totalLinhas,
      linhas_validas: linhas.length,
      importado_por: userId,
    })
    .select("id")
    .single();
  if (relError || !relatorio) throw relError || new Error("Falha ao gravar relatório");
  const relatorioId = relatorio.id as string;

  // Resumo por aluno/CPF (RN-08: resultados + resumo, sem linhas brutas)
  const resumo = resumoPorCpf(linhas);
  const resumoRows = Array.from(resumo.entries()).map(([cpf, info]) => ({
    relatorio_id: relatorioId,
    cpf_aluno: cpf,
    total_repasse: Number(info.total.toFixed(2)),
    competencia_inicio: info.linhas.find((l) => l.operacao === "R101" && l.parcela === 1)?.competencia ?? null,
    parcela_1_valor_repasse: info.linhas.find((l) => l.operacao === "R101" && l.parcela === 1)?.valorRepasse ?? null,
    teve_parcela_1: info.linhas.some((l) => l.operacao === "R101" && l.parcela === 1 && l.valorRepasse > 0),
  }));
  if (resumoRows.length > 0) {
    const { error } = await supabase.from("resumo_repasse_aluno").insert(resumoRows);
    if (error) throw error;
  }

  // Conciliação por venda de Graduação pendente (RN-04, RN-09, RN-12)
  const vendas = await carregarVendasPendentes(supabase);
  const porCpf = new Map<string, RepasseLinha[]>();
  for (const l of linhas) {
    const arr = porCpf.get(l.cpf) || [];
    arr.push(l);
    porCpf.set(l.cpf, arr);
  }
  const qtdPorCpf = new Map<string, number>();
  for (const v of vendas) qtdPorCpf.set(v.cpf, (qtdPorCpf.get(v.cpf) || 0) + 1);

  const resultados = { APARECEU: 0, NAO_APARECEU: 0, AMBIGUO: 0 };
  const conciliacoes = vendas.map((v) => {
    const r = resultadoConciliacao(porCpf.get(v.cpf) || [], qtdPorCpf.get(v.cpf) || 1);
    resultados[r.resultado] += 1;
    return {
      relatorio_id: relatorioId,
      venda_id: v.vendaId,
      comissao_id: v.comissaoId,
      cpf_aluno: v.cpf,
      resultado: r.resultado,
      competencia_inicio: r.competenciaInicio,
      valor_repasse: r.valorRepasse,
    };
  });
  if (conciliacoes.length > 0) {
    const { error } = await supabase.from("conciliacoes_repasse").insert(conciliacoes);
    if (error) throw error;
  }

  // CPFs do relatório sem venda pendente correspondente: reportados como NAO_APARECEU? Não.
  logger.info("repasse.importar.ok", { relatorioId, totalLinhas, linhasValidas: linhas.length, resultados });

  return jsonOk({
    relatorio_id: relatorioId,
    total_linhas: totalLinhas,
    linhas_validas: linhas.length,
    resumo_alunos: resumoRows.length,
    resultados,
  });
}

async function confirmar(supabase: SupabaseClient, userId: string, body: any): Promise<Response> {
  const ids = Array.isArray(body?.conciliacao_ids) ? body.conciliacao_ids.filter(Boolean) : [];
  if (ids.length === 0) return jsonError(400, "BAD_REQUEST", "conciliacao_ids é obrigatório");

  const { data: itens, error } = await supabase
    .from("conciliacoes_repasse")
    .select("id, resultado, comissao_id, confirmado_em")
    .in("id", ids);
  if (error) throw error;
  if (!itens || itens.length === 0) return jsonError(404, "NOT_FOUND", "Nenhuma conciliação encontrada");

  let confirmados = 0;
  let ignorados = 0;
  const now = new Date().toISOString();

  for (const item of itens as any[]) {
    const elegivel = item.resultado === "APARECEU" && item.comissao_id && !item.confirmado_em;
    if (!elegivel) {
      ignorados += 1;
      continue;
    }

    const { error: comErr } = await supabase
      .from("comissoes")
      .update({ status: "LIBERADA_PAGAMENTO", data_liberacao: now, atualizado_em: now })
      .eq("id", item.comissao_id)
      .not("status", "in", "(LIBERADA_PAGAMENTO,PAGA)");
    if (comErr) throw comErr;

    const { error: confErr } = await supabase
      .from("conciliacoes_repasse")
      .update({ confirmado_por: userId, confirmado_em: now })
      .eq("id", item.id);
    if (confErr) throw confErr;

    confirmados += 1;
  }

  logger.info("repasse.confirmar.ok", { confirmados, ignorados });
  return jsonOk({ confirmados, ignorados });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const started = Date.now();
  try {
    const { user, role, error: authError } = await getUserAndRole(req);
    if (authError || !user || role !== "GESTOR") {
      return jsonError(401, "UNAUTHORIZED", "Acesso restrito ao perfil GESTOR");
    }

    const body = await req.json().catch(() => ({}));
    const acao = body?.acao;
    const supabase = getServiceRoleClient();

    if (acao === "importar") return await importar(supabase, user.id, body);
    if (acao === "confirmar") return await confirmar(supabase, user.id, body);

    return jsonError(400, "BAD_REQUEST", "acao inválida: use 'importar' ou 'confirmar'");
  } catch (error: any) {
    logger.error("repasse.falha", error);
    return jsonError(500, "INTERNAL_ERROR", error?.message || "Erro inesperado");
  } finally {
    logger.perf("repasse.total", Date.now() - started);
  }
});
