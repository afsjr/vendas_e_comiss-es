"use client";

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { supabase, uploadFile } from '@/lib/supabase';
import { useDropzone } from 'react-dropzone';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Loader2, FileText, CheckCircle2, UploadCloud,
  ClipboardList, Banknote, ShieldCheck, ArrowRight, Ban, ChevronLeft, AlertTriangle, Clock,
} from 'lucide-react';
import type { StatusVenda } from '@/types';

type AcaoApi =
  | 'mover_para_financeiro'
  | 'devolver_vendedor'
  | 'cancelar'
  | 'emitir_boleto'
  | 'devolver_secretaria'
  | 'confirmar_pgto_1m';

type CampoAcao = 'contrato_storage_path' | 'boleto_referencia' | 'comprovante_pgto_1m_path' | 'motivo';

interface AcaoDef {
  acao: AcaoApi;
  label: string;
  cta: string;
  icone: React.ReactNode;
  campo?: CampoAcao;
  bucket?: string;
  bucketMax?: number;
  minMotivo?: number;
  descricao?: string;
}

const ACOES: Record<string, AcaoDef[]> = {
  SECRETARIA: [
    { acao: 'mover_para_financeiro', label: 'Enviar contrato ao Financeiro', cta: 'Confirmar envio do contrato', icone: <ArrowRight className="w-4 h-4" />, campo: 'contrato_storage_path', bucket: 'contratos_pdf', bucketMax: 10 * 1024 * 1024, descricao: 'Anexe o contrato assinado (PDF). A venda segue para emissão de cobrança.' },
    { acao: 'devolver_vendedor', label: 'Devolver ao Vendedor', cta: 'Confirmar devolução', icone: <ChevronLeft className="w-4 h-4" />, campo: 'motivo', minMotivo: 10, descricao: 'A venda volta para a bancada do Vendedor.' },
    { acao: 'cancelar', label: 'Cancelar Venda', cta: 'Confirmar cancelamento', icone: <Ban className="w-4 h-4" />, campo: 'motivo', descricao: 'Cancela a venda e estorna a comissão.' },
  ],
  FINANCEIRO: [
    { acao: 'emitir_boleto', label: 'Emitir Boleto', cta: 'Registrar boleto', icone: <Banknote className="w-4 h-4" />, campo: 'boleto_referencia', descricao: 'Informe a referência do boleto emitido (ex.: número de identificação bancária).' },
    { acao: 'devolver_secretaria', label: 'Devolver à Secretaria', cta: 'Confirmar devolução', icone: <ChevronLeft className="w-4 h-4" />, campo: 'motivo', minMotivo: 10, descricao: 'Devolve o contrato para ajustes na Secretaria.' },
    { acao: 'confirmar_pgto_1m', label: 'Confirmar 1ª Mensalidade', cta: 'Confirmar 1ª mensalidade', icone: <CheckCircle2 className="w-4 h-4" />, campo: 'comprovante_pgto_1m_path', bucket: 'comprovantes', bucketMax: 5 * 1024 * 1024, descricao: 'Anexe o comprovante de pagamento da 1ª mensalidade.' },
  ],
};

const COLUNAS: Record<string, { titulo: string; status: StatusVenda; icone: React.ReactNode; cor: string }[]> = {
  SECRETARIA: [
    { titulo: 'Pendente · contrato', status: 'PENDENTE_VALIDACAO', icone: <ClipboardList className="w-4 h-4" />, cor: 'border-slate-600/40' },
  ],
  FINANCEIRO: [
    { titulo: 'Aguardando Financeiro', status: 'AGUARDANDO_FINANCEIRO', icone: <Banknote className="w-4 h-4" />, cor: 'border-amber-500/30' },
    { titulo: 'Aguardando 1ª Mensalidade', status: 'AGUARDANDO_PAGAMENTO_1M', icone: <Clock className="w-4 h-4" />, cor: 'border-blue-500/30' },
  ],
  AUDITOR: [
    { titulo: '1ª Mensalidade Paga · Auditoria', status: 'PRIMEIRA_MENSALIDADE_PAGA', icone: <ShieldCheck className="w-4 h-4" />, cor: 'border-emerald-500/30' },
  ],
  GESTOR: [
    { titulo: '1ª Mensalidade Paga · Auditoria', status: 'PRIMEIRA_MENSALIDADE_PAGA', icone: <ShieldCheck className="w-4 h-4" />, cor: 'border-emerald-500/30' },
  ],
};

const ROLES_HABILITADAS = ['SECRETARIA', 'FINANCEIRO', 'GESTOR', 'AUDITOR'];

function erroLegivel(code?: string, message?: string): string {
  switch (code) {
    case 'TRABVA_BLOQUEADA': return `Trava não atendida: ${message || 'pré-condição ausente.'}`;
    case 'INVALID_STATE': return `A venda mudou de estado (${message || 'atualize a fila'}).`;
    case 'INVALID_TRANSITION': return 'Transição não permitida para o estado atual.';
    case 'UNAUTHORIZED': return 'Você não tem permissão para executar essa ação.';
    case 'BAD_REQUEST': return `Requisição inválida: ${message || ''}`;
    default: return message || 'Falha inesperada.';
  }
}

export default function PostVendaPage() {
  const { user, role, loading: userLoading } = useUser();
  const router = useRouter();

  const [vendas, setVendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVenda, setSelectedVenda] = useState<any>(null);
  const [acaoAtiva, setAcaoAtiva] = useState<AcaoDef | null>(null);
  const [motivoValue, setMotivoValue] = useState('');
  const [boletoValue, setBoletoValue] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const habilitado = !!user && ROLES_HABILITADAS.includes(role || '');

  useEffect(() => {
    if (!userLoading && (!user || !habilitado)) {
      router.push('/auth/login');
    }
  }, [user, userLoading, habilitado, router]);

  const carregarVendas = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vendas')
      .select('*, alunos(nome), cursos(nome), evidencias_vendas(comprovante_storage_path)')
      .order('criado_em', { ascending: false });
    if (error) console.error('Erro ao buscar vendas:', error);
    if (data) setVendas(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (habilitado) carregarVendas();
  }, [habilitado, carregarVendas]);

  const bucketMax = acaoAtiva?.bucketMax || 5 * 1024 * 1024;
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    multiple: false,
    noClick: true,
    accept: { 'application/pdf': ['.pdf'], 'image/png': ['.png'], 'image/jpeg': ['.jpeg', '.jpg'], 'image/webp': ['.webp'] },
    maxSize: bucketMax,
    onDrop: (accepted) => setFile(accepted?.[0] ?? null),
  });

  function abrirAcao(def: AcaoDef) {
    setAcaoAtiva(def);
    setMotivoValue('');
    setBoletoValue('');
    setFile(null);
    setErro('');
    setSucesso('');
  }

  function travaOk(def: AcaoDef): boolean {
    if (def.campo === 'motivo') {
      return motivoValue.trim().length >= (def.minMotivo || 1);
    }
    if (def.campo === 'boleto_referencia') {
      return boletoValue.trim().length > 0;
    }
    if (def.campo && def.bucket) {
      return !!file;
    }
    return false;
  }

  async function executarAcao(def: AcaoDef) {
    if (!selectedVenda || !user) return;
    setErro('');
    setSucesso('');
    setProcessing(true);

    try {
      const payload: Record<string, unknown> = { venda_id: selectedVenda.id, acao: def.acao };

      if (def.campo === 'motivo') {
        const m = motivoValue.trim();
        if (!m || (def.minMotivo && m.length < def.minMotivo)) {
          setErro(`O motivo é obrigatório${def.minMotivo ? ` (mínimo ${def.minMotivo} caracteres)` : ''}.`);
          setProcessing(false);
          return;
        }
        payload.motivo = m;
      } else if (def.campo === 'boleto_referencia') {
        const ref = boletoValue.trim();
        if (!ref) {
          setErro('Informe a referência do boleto emitido.');
          setProcessing(false);
          return;
        }
        payload[def.campo] = ref;
      } else if (def.campo && def.bucket) {
        if (!file) {
          setErro('Anexe o arquivo da contraprova.');
          setProcessing(false);
          return;
        }
        const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { path: upPath, error: upErr } = await uploadFile(def.bucket, path, file);
        if (upErr || !upPath) throw new Error('Falha no upload da contraprova.');
        payload[def.campo] = upPath;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/postvenda-mover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) {
        throw Object.assign(new Error(json.error?.message || 'Falha na operação.'), { code: json.error?.code });
      }

      setMotivoValue('');
      setBoletoValue('');
      setFile(null);
      setAcaoAtiva(null);
      setSelectedVenda(null);
      await carregarVendas();
      setSucesso(`Venda atualizada para ${json.data?.status_novo || 'novo status'}.`);
    } catch (e: any) {
      setErro(erroLegivel(e?.code, e?.message));
      if (e?.code === 'INVALID_STATE') await carregarVendas();
    } finally {
      setProcessing(false);
    }
  }

  if (userLoading || loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-8 h-8 text-rose-500 animate-spin" /></div>;
  }

  const colunas = COLUNAS[role || ''] || [];
  const acoes = ACOES[role || ''] || [];
  const ehAuditor = role === 'AUDITOR' || role === 'GESTOR';

  return (
    <DashboardLayout title="Pós-Venda" subtitle="Fluxo de contraprovas entre Secretaria, Financeiro e Auditoria.">
      <div className="mt-4">
        {sucesso && (
          <div className="mb-4 px-5 py-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 font-medium flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5" /> {sucesso}
          </div>
        )}
        {erro && (
          <div className="mb-4 px-5 py-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-300 font-medium flex items-center gap-3" data-testid="kanban-aviso">
            <AlertTriangle className="w-5 h-5" /> {erro}
          </div>
        )}

        {ehAuditor && (
          <div className="mb-6 px-5 py-4 bg-slate-900/60 border border-white/5 rounded-2xl flex items-center justify-between">
            <p className="text-slate-400 text-sm">Ações de aprovação da 1ª mensalidade são feitas na fila de auditoria.</p>
            <button
              onClick={() => router.push('/auditoria')}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-semibold text-sm"
            >
              Ir para Auditoria
            </button>
          </div>
        )}

        <div className={`grid gap-6 ${colunas.length > 1 ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} `}>
          {colunas.map(col => (
            <div key={col.status} className={`bg-slate-900/60 backdrop-blur-xl border ${col.cor} rounded-3xl p-4 shadow-2xl`}>
              <div className="flex items-center gap-2 px-2 pb-3 border-b border-white/5">
                <span className="text-rose-400">{col.icone}</span>
                <h2 className="font-bold text-white">{col.titulo}</h2>
                <span className="ml-auto text-xs font-bold text-slate-400 bg-white/5 px-2 py-1 rounded-full">
                  {vendas.filter(v => v.status === col.status).length}
                </span>
              </div>

              <div className="space-y-3 mt-4">
                {vendas.filter(v => v.status === col.status).map(v => (
                  <button
                    key={v.id}
                    onClick={() => { setSelectedVenda(v); setAcaoAtiva(null); setErro(''); setSucesso(''); }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedVenda?.id === v.id ? 'bg-rose-600/10 border-rose-500/50' : 'bg-slate-950/50 border-white/5 hover:border-white/20'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-white">{v.alunos?.nome}</h3>
                        <p className="text-sm text-slate-400">{v.cursos?.nome}</p>
                      </div>
                      <p className="font-bold text-emerald-400">R$ {Number(v.valor_entrada).toFixed(2)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <TravaPill ok={!!v.contrato_storage_path} label="Contrato" />
                      <TravaPill ok={!!v.boleto_referencia} label="Boleto" />
                      <TravaPill ok={!!v.comprovante_pgto_1m_path} label="Pgto 1ª mens." />
                      <TravaPill ok={!!v.evidencias_vendas?.[0]?.comprovante_storage_path} label="Entrada" />
                    </div>
                  </button>
                ))}
                {vendas.filter(v => v.status === col.status).length === 0 && (
                  <div className="text-center py-8 text-slate-500 text-sm border border-dashed border-white/10 rounded-2xl">
                    Fila vazia
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {selectedVenda && (
          <div className="mt-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-rose-400" /> {selectedVenda.alunos?.nome}
              </h2>
              <button onClick={() => { setSelectedVenda(null); setAcaoAtiva(null); setErro(''); }} className="text-sm text-slate-400 hover:text-white">
                Fechar
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6 bg-slate-950/50 p-4 rounded-2xl border border-white/5 text-sm">
              <div><span className="text-slate-400">Curso</span> <p className="text-white font-medium">{selectedVenda.cursos?.nome}</p></div>
              <div><span className="text-slate-400">Status</span> <p className="text-white font-medium">{selectedVenda.status}</p></div>
              <div><span className="text-slate-400">Entrada</span> <p className="text-emerald-400 font-bold">R$ {Number(selectedVenda.valor_entrada).toFixed(2)}</p></div>
              <div><span className="text-slate-400">Início aulas</span> <p className="text-white font-medium">{new Date(selectedVenda.data_inicio_curso).toLocaleDateString()}</p></div>
            </div>

            {!ehAuditor && (
              <>
                <div className="flex flex-wrap gap-3 mb-6">
                  {acoes.map(def => (
                    <button
                      key={def.acao}
                      onClick={() => abrirAcao(def)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 border transition-all ${acaoAtiva?.acao === def.acao ? 'bg-rose-500/20 border-rose-500/40 text-rose-300' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}`}
                    >
                      {def.icone} {def.label}
                    </button>
                  ))}
                </div>

                {acaoAtiva && (
                  <div className="bg-slate-950/40 border border-white/10 rounded-2xl p-4 space-y-4">
                    <p className="text-sm text-slate-400">{acaoAtiva.descricao}</p>

                    {acaoAtiva.campo === 'motivo' && (
                      <textarea
                        value={motivoValue}
                        onChange={e => setMotivoValue(e.target.value)}
                        placeholder={`Motivo${acaoAtiva.minMotivo ? ` (mínimo ${acaoAtiva.minMotivo} caracteres)` : ''}...`}
                        rows={3}
                        className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-rose-500 outline-none resize-none"
                      />
                    )}

                    {acaoAtiva.campo === 'boleto_referencia' && (
                      <input
                        value={boletoValue}
                        onChange={e => setBoletoValue(e.target.value)}
                        placeholder="Referência do boleto (ex.: 2026.09.0001)"
                        className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3 text-white focus:ring-2 focus:ring-rose-500 outline-none"
                      />
                    )}

                    {acaoAtiva.bucket && (
                      <div
                        {...getRootProps()}
                        className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${isDragActive ? 'border-rose-500/60 bg-rose-500/5' : 'border-white/10 hover:border-rose-500/40 hover:bg-rose-500/5'} bg-slate-950/30`}
                      >
                        <input {...getInputProps()} />
                        <div className="pointer-events-none">
                          {file ? (
                            <div className="flex flex-col items-center">
                              <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                              <p className="text-white font-semibold text-sm truncate w-full max-w-xs">{file.name}</p>
                              <p className="text-slate-500 text-xs mt-1">Clique para trocar</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <UploadCloud className={`w-10 h-10 mb-2 ${isDragActive ? 'text-rose-400' : 'text-slate-400'}`} />
                              <p className="text-white text-sm font-medium">Arraste o arquivo ou toque para selecionar</p>
                              <p className="text-slate-500 text-xs mt-1">PDF · PNG · JPG · WEBP (máx. {(bucketMax / 1024 / 1024).toFixed(0)}MB)</p>
                            </div>
                          )}
                        </div>
                        <button onClick={open} type="button" className="pointer-events-none absolute inset-0 w-full h-full opacity-0" />
                      </div>
                    )}

                    <button
                      onClick={() => executarAcao(acaoAtiva)}
                      disabled={processing || !travaOk(acaoAtiva)}
                      className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-2xl font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : acaoAtiva.icone} {acaoAtiva.cta}
                    </button>
                    {!travaOk(acaoAtiva) && !processing && (
                      <p className="text-xs text-slate-500 text-center">Confirme a contraprova acima para habilitar a ação.</p>
                    )}
                  </div>
                )}
              </>
            )}

          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function TravaPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${ok ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-slate-500 border border-white/10'}`}>
      {ok ? '✓ ' : '— '}{label}
    </span>
  );
}