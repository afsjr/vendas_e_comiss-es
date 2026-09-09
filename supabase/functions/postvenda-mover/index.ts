import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getServiceRoleClient, getUserAndRole } from "../_shared/client.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { logger } from "../_shared/log.ts";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

type Acao =
  | 'mover_para_financeiro'
  | 'devolver_vendedor'
  | 'cancelar'
  | 'emitir_boleto'
  | 'devolver_secretaria'
  | 'confirmar_pgto_1m';

interface Transicao {
  acao: Acao;
  papel: string;
  origem: string;
  destino: string;
  campoTrava?: 'contrato_storage_path' | 'boleto_referencia' | 'comprovante_pgto_1m_path' | 'motivo';
  motivoMinimo?: number;
  bucket?: string;
  estornaComissao?: boolean;
}

// Matriz de transições do pós-venda (RN-03, RN-04, RN-05, RF-05).
// A matriz é servidor: o status enviado pelo cliente nunca é confiado.
const TRANSICOES: Transicao[] = [
  { acao: 'mover_para_financeiro', papel: 'SECRETARIA', origem: 'PENDENTE_VALIDACAO', destino: 'AGUARDANDO_FINANCEIRO', campoTrava: 'contrato_storage_path', bucket: 'contratos_pdf' },
  { acao: 'devolver_vendedor', papel: 'SECRETARIA', origem: 'PENDENTE_VALIDACAO', destino: 'DEVOLVIDA_AJUSTE', campoTrava: 'motivo', motivoMinimo: 10 },
  { acao: 'cancelar', papel: 'SECRETARIA', origem: 'PENDENTE_VALIDACAO', destino: 'CANCELADA', campoTrava: 'motivo', estornaComissao: true },
  { acao: 'emitir_boleto', papel: 'FINANCEIRO', origem: 'AGUARDANDO_FINANCEIRO', destino: 'AGUARDANDO_PAGAMENTO_1M', campoTrava: 'boleto_referencia' },
  { acao: 'devolver_secretaria', papel: 'FINANCEIRO', origem: 'AGUARDANDO_FINANCEIRO', destino: 'PENDENTE_VALIDACAO', campoTrava: 'motivo', motivoMinimo: 10 },
  { acao: 'confirmar_pgto_1m', papel: 'FINANCEIRO', origem: 'AGUARDANDO_PAGAMENTO_1M', destino: 'PRIMEIRA_MENSALIDADE_PAGA', campoTrava: 'comprovante_pgto_1m_path', bucket: 'comprovantes' },
];

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

async function arquivoExiste(supabase: SupabaseClient, bucket: string, storagePath: string): Promise<boolean> {
  const partes = storagePath.split('/');
  const nome = partes.pop() || '';
  const pasta = partes.join('/');

  const { data, error } = await supabase.storage
    .from(bucket)
    .list(pasta, { limit: 1, search: nome });

  if (error) throw error;
  return Array.isArray(data) && data.some((item) => item.name === nome);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const started = Date.now();
  try {
    const { user, role, error: authError } = await getUserAndRole(req);
    if (authError || !user || !role) {
      return jsonError(401, 'UNAUTHORIZED', 'Unauthorized');
    }

    const payload = await req.json();
    const { venda_id, acao } = payload as { venda_id?: string; acao?: Acao };
    if (!venda_id || !acao) {
      return jsonError(400, 'BAD_REQUEST', 'venda_id e acao são obrigatórios');
    }

    const transicao = TRANSICOES.find((t) => t.acao === acao);
    if (!transicao) {
      return jsonError(400, 'INVALID_TRANSITION', 'Transição não prevista');
    }
    if (transicao.papel !== role) {
      logger.warn('postvenda-mover.forbidden', { venda_id, acao, role, exigido: transicao.papel });
      return jsonError(401, 'UNAUTHORIZED', 'Papel sem permissão para a ação');
    }

    const supabase = getServiceRoleClient();

    const { data: venda, error: vendaError } = await supabase
      .from("vendas")
      .select("id, status, contrato_storage_path, boleto_referencia, comprovante_pgto_1m_path")
      .eq("id", venda_id)
      .single();

    if (vendaError || !venda) {
      return jsonError(400, 'INVALID_STATE', 'Venda não encontrada');
    }
    if (venda.status !== transicao.origem) {
      return jsonError(400, 'INVALID_STATE', 'Status atual não permite a transição');
    }

    const valorTrava = transicao.campoTrava ? payload[transicao.campoTrava] : null;
    if (transicao.campoTrava) {
      const ok = typeof valorTrava === 'string' && valorTrava.trim().length > 0 &&
        (!transicao.motivoMinimo || valorTrava.trim().length >= transicao.motivoMinimo);
      if (!ok) {
        return jsonError(400, 'TRABVA_BLOQUEADA', 'Pré-condição da trava ausente');
      }
      if (transicao.bucket) {
        const existe = await arquivoExiste(supabase, transicao.bucket, valorTrava as string);
        if (!existe) {
          logger.warn('postvenda-mover.trava', { venda_id, acao, bucket: transicao.bucket });
          return jsonError(400, 'TRABVA_BLOQUEADA', 'Arquivo da contraprova não encontrado no storage');
        }
      }
    }

    const updateData: Record<string, unknown> = {
      status: transicao.destino,
      atualizado_em: new Date().toISOString(),
    };
    if (transicao.campoTrava && transicao.campoTrava !== 'motivo') {
      updateData[transicao.campoTrava] = valorTrava;
    }

    const { error: updateError } = await supabase
      .from("vendas")
      .update(updateData)
      .eq("id", venda_id);
    if (updateError) throw updateError;

    if (transicao.estornaComissao) {
      const { error: estornoError } = await supabase
        .from("comissoes")
        .update({ status: 'ESTORNADA', atualizado_em: new Date().toISOString() })
        .eq("venda_id", venda_id);
      if (estornoError) throw estornoError;
    }

    const motivo = transicao.campoTrava === 'motivo' ? String(valorTrava).trim() : null;
    const { error: histError } = await supabase
      .from("vendas_historico_status")
      .insert({
        venda_id,
        status_anterior: venda.status,
        status_novo: transicao.destino,
        motivo,
        mudado_por: user.id,
      });
    if (histError) throw histError;

    // Telemetria: ids/caminhos, nunca conteúdo de arquivo nem texto de boleto.
    logger.info('postvenda-mover.success', { venda_id, acao, status_novo: transicao.destino, por: user.id });
    logger.perf('postvenda-mover', Date.now() - started);

    return jsonOk({ venda_id, status_novo: transicao.destino });
  } catch (error: any) {
    logger.error('postvenda-mover', error);
    return jsonError(500, 'INTERNAL_ERROR', error.message);
  }
});