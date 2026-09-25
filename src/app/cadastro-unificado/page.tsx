"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { supabase, uploadFile } from '@/lib/supabase';
import { isValidCpf, formatCpf, formatPhone, maskName } from '@/lib/cpf';
import {
  UserPlus,
  UserCheck,
  ArrowRight,
  Loader2,
  AlertCircle,
  Phone,
  UploadCloud,
  CheckCircle2,
  FileText,
  GraduationCap,
  DollarSign,
  Link2,
  XCircle,
} from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

const DOCUMENTOS_FIXOS = ['RG', 'CPF', 'Comprovante de Residência', 'Histórico'];

type Duplicado = { id: string; nome: string };

type Resumo = {
  nome: string;
  incluirVenda: boolean;
  cursoNome?: string;
  valor?: string;
};

export default function CadastroUnificado() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();

  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [isWhatsapp, setIsWhatsapp] = useState(false);
  const [cpfError, setCpfError] = useState('');
  const [checkingCpf, setCheckingCpf] = useState(false);

  const [duplicado, setDuplicado] = useState<Duplicado | null>(null);
  const [vinculado, setVinculado] = useState(false);

  const [incluirVenda, setIncluirVenda] = useState(true);

  const [cursos, setCursos] = useState<any[]>([]);
  const [cursoId, setCursoId] = useState('');
  const [valorEntrada, setValorEntrada] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [documentosPendentes, setDocumentosPendentes] = useState<string[]>([]);

  useEffect(() => {
    if (!userLoading && !user) router.push('/auth/login');
  }, [user, userLoading, router]);

  useEffect(() => {
    const fetchCursos = async () => {
      const { data } = await supabase
        .from('cursos')
        .select('id, nome, categoria')
        .order('nome');
      if (data) setCursos(data);
    };
    fetchCursos();
  }, []);

  const handleCpfChange = (value: string) => {
    const formatted = formatCpf(value);
    setCpf(formatted);
    setDuplicado(null);
    setVinculado(false);
    if (formatted.length === 14) {
      setCpfError(isValidCpf(formatted) ? '' : 'CPF inválido');
    } else {
      setCpfError('');
    }
  };

  const handleCpfBlur = async () => {
    const digits = cpf.replace(/\D/g, '');
    if (digits.length !== 11 || !isValidCpf(cpf)) return;
    setCheckingCpf(true);
    const { data } = await supabase
      .from('alunos')
      .select('id, nome')
      .eq('cpf', digits)
      .limit(1)
      .maybeSingle();
    setCheckingCpf(false);
    if (data) setDuplicado(data);
  };

  const handleVincular = () => {
    if (!duplicado) return;
    setVinculado(true);
    setNome(duplicado.nome);
    setError('');
  };

  const handleDesvincular = () => {
    setVinculado(false);
    setNome('');
    setDuplicado(null);
  };

  const handleFileChange = (selected: File | null) => {
    setError('');
    if (!selected) {
      setFile(null);
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      setError('O comprovante deve ter no máximo 5MB.');
      setFile(null);
      return;
    }
    setFile(selected);
  };

  const fetchDocumentosPendentes = async (alunoId: string): Promise<string[]> => {
    const { data } = await supabase
      .from('documentos_alunos')
      .select('tipo')
      .eq('aluno_id', alunoId);
    const existentes = new Set((data || []).map((d: any) => d.tipo));
    return DOCUMENTOS_FIXOS.filter((doc) => !existentes.has(doc));
  };

  const resetForm = () => {
    setNome('');
    setCpf('');
    setEmail('');
    setTelefone('');
    setIsWhatsapp(false);
    setCpfError('');
    setDuplicado(null);
    setVinculado(false);
    setIncluirVenda(true);
    setCursoId('');
    setValorEntrada('');
    setDataInicio('');
    setFile(null);
    setError('');
    setSuccess(false);
    setResumo(null);
    setDocumentosPendentes([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!isValidCpf(cpf)) {
      setCpfError('CPF inválido');
      return;
    }

    setError('');
    setSubmitting(true);

    let alunoId = vinculado && duplicado ? duplicado.id : '';
    let criadoAgora = false;

    try {
      if (!alunoId) {
        if (!nome.trim()) throw new Error('Informe o nome do aluno.');
        const { data, error: insertErr } = await supabase
          .from('alunos')
          .insert({
            nome,
            cpf: cpf.replace(/\D/g, ''),
            email,
            telefone: telefone.replace(/\D/g, '') || null,
            is_whatsapp: isWhatsapp,
            criado_por: user.id,
          })
          .select()
          .single();

        if (insertErr) {
          if (insertErr.code === '23505') {
            const { data: existente } = await supabase
              .from('alunos')
              .select('id, nome')
              .eq('cpf', cpf.replace(/\D/g, ''))
              .limit(1)
              .maybeSingle();
            if (existente) setDuplicado(existente);
            setError('Este CPF já está cadastrado. Vincule a venda ao aluno existente.');
            return;
          }
          throw new Error(insertErr.message);
        }

        alunoId = data.id;
        criadoAgora = true;
      }

      let cursoNome: string | undefined;

      if (incluirVenda) {
        if (!cursoId || !valorEntrada || !dataInicio || !file) {
          throw new Error('Preencha todos os campos da venda (curso, valor, data) e anexe o comprovante.');
        }

        cursoNome = cursos.find((c) => c.id === cursoId)?.nome;

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { path, error: uploadErr } = await uploadFile('comprovantes', fileName, file);
        if (uploadErr || !path) throw new Error('Falha no upload do comprovante.');

        const { data: { session } } = await supabase.auth.getSession();
        const funcUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/vendas`;

        const res = await fetch(funcUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            aluno_id: alunoId,
            curso_id: cursoId,
            valor_entrada: parseFloat(valorEntrada),
            data_inicio_curso: dataInicio,
            comprovante_storage_path: path,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error?.message || 'Erro ao registrar a venda.');
        }
      }

      const pendentes = await fetchDocumentosPendentes(alunoId);
      setDocumentosPendentes(pendentes);
      setResumo({ nome, incluirVenda, cursoNome, valor: valorEntrada });
      setSuccess(true);
    } catch (err: any) {
      if (criadoAgora && alunoId) {
        const { error: delErr } = await supabase.from('alunos').delete().eq('id', alunoId);
        if (delErr) {
          setError(
            `${err.message} O aluno foi criado, mas não pôde ser removido automaticamente. Tente lançar a venda novamente para este aluno.`
          );
        } else {
          setError(`${err.message} O cadastro do aluno foi desfeito.`);
        }
      } else {
        setError(err.message || 'Ocorreu um erro inesperado.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
      </div>
    );
  }

  if (success) {
    return (
      <DashboardLayout
        title="Cadastro Unificado"
        subtitle="Cadastro do aluno e lançamento da primeira venda em um único fluxo."
      >
        <div className="max-w-2xl mx-auto mt-4">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-10 text-center space-y-4 shadow-[0_0_30px_rgba(16,185,129,0.1)] backdrop-blur-md">
            <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            </div>
            <h2 className="text-3xl font-bold text-white">
              {resumo?.incluirVenda ? 'Venda Registrada!' : 'Aluno Cadastrado!'}
            </h2>
            {resumo?.incluirVenda ? (
              <p className="text-slate-400">
                <span className="text-white font-semibold">{resumo?.nome}</span> — {resumo?.cursoNome} — R${' '}
                {resumo?.valor}. A venda agora aguarda auditoria.
              </p>
            ) : (
              <p className="text-slate-400">
                Cadastro de <span className="text-white font-semibold">{resumo?.nome}</span> concluído sem venda.
              </p>
            )}

            {documentosPendentes.length > 0 && (
              <div className="mt-6 text-left bg-slate-950/40 border border-white/5 rounded-2xl p-5">
                <p className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-400" /> Documentos pendentes
                </p>
                <div className="flex flex-wrap gap-2">
                  {documentosPendentes.map((doc) => (
                    <span
                      key={doc}
                      className="text-xs font-medium text-orange-300 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-lg"
                    >
                      {doc}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  Sinalização apenas. Nenhum anexo é exigido no ato do cadastro.
                </p>
              </div>
            )}

            <button
              onClick={resetForm}
              className="mt-8 px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl transition-all shadow-lg w-full"
            >
              Cadastrar Outro
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Cadastro Unificado"
      subtitle="Cadastre o aluno e, se quiser, já registre a primeira venda."
    >
      <div className="max-w-2xl mx-auto mt-4">
        <div className="bg-slate-900/60 border border-white/5 backdrop-blur-xl rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-14 h-14 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20 border border-white/5">
                <UserPlus className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Dados do Aluno</h3>
                <p className="text-sm text-slate-400">Informações básicas para a ficha.</p>
              </div>
            </div>

            {duplicado && !vinculado && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 space-y-3">
                <p className="text-sm text-amber-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Aluno já cadastrado: {maskName(duplicado.nome)}
                </p>
                <button
                  type="button"
                  onClick={handleVincular}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-200 text-sm font-bold rounded-xl transition-all"
                >
                  <Link2 className="w-4 h-4" /> Vincular a este aluno
                </button>
              </div>
            )}

            {vinculado && duplicado && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5 flex items-center justify-between gap-3">
                <p className="text-sm text-rose-200 flex items-center gap-2">
                  <UserCheck className="w-4 h-4" /> Venda será vinculada a {maskName(duplicado.nome)}
                </p>
                <button
                  type="button"
                  onClick={handleDesvincular}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-950/40 hover:bg-slate-950/70 border border-white/10 text-slate-300 text-xs font-bold rounded-lg transition-all"
                >
                  <XCircle className="w-3.5 h-3.5" /> Trocar
                </button>
              </div>
            )}

            <div>
              <label className="text-sm font-semibold text-slate-300 mb-2 block">Nome Completo</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                readOnly={vinculado}
                className={`w-full bg-slate-950/50 border border-white/10 p-4 rounded-xl text-white outline-none transition-all shadow-inner ${vinculado ? 'opacity-60 cursor-not-allowed' : 'focus:border-rose-500 focus:ring-1 focus:ring-rose-500'}`}
                placeholder="Ex: João da Silva"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-300 mb-2 block">CPF</label>
              <div className="relative">
                <input
                  type="text"
                  value={cpf}
                  onChange={(e) => handleCpfChange(e.target.value)}
                  onBlur={handleCpfBlur}
                  required
                  maxLength={14}
                  disabled={vinculado}
                  className={`w-full bg-slate-950/50 border p-4 rounded-xl text-white outline-none transition-all shadow-inner ${cpfError ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-white/10 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'} ${vinculado ? 'opacity-60 cursor-not-allowed' : ''}`}
                  placeholder="000.000.000-00"
                />
                {checkingCpf && (
                  <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 animate-spin" />
                )}
              </div>
              {cpfError && (
                <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {cpfError}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-300 mb-2 block">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required={!vinculado}
                readOnly={vinculado}
                className={`w-full bg-slate-950/50 border border-white/10 p-4 rounded-xl text-white outline-none transition-all shadow-inner ${vinculado ? 'opacity-60 cursor-not-allowed' : 'focus:border-rose-500 focus:ring-1 focus:ring-rose-500'}`}
                placeholder="aluno@email.com"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-300 mb-2 block">Telefone</label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(formatPhone(e.target.value))}
                    maxLength={15}
                    readOnly={vinculado}
                    className={`w-full bg-slate-950/50 border border-white/10 pl-11 pr-4 p-4 rounded-xl text-white outline-none transition-all shadow-inner ${vinculado ? 'opacity-60 cursor-not-allowed' : 'focus:border-rose-500 focus:ring-1 focus:ring-rose-500'}`}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <button
                  type="button"
                  disabled={vinculado}
                  onClick={() => setIsWhatsapp(!isWhatsapp)}
                  className={`px-4 rounded-xl border font-bold text-sm transition-all ${vinculado ? 'opacity-60 cursor-not-allowed border-white/10 text-slate-500' : isWhatsapp ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-slate-950/50 border-white/10 text-slate-400 hover:border-white/20'}`}
                >
                  {isWhatsapp ? 'WhatsApp' : 'Sem WhatsApp'}
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={() => setIncluirVenda(!incluirVenda)}
                className="w-full flex items-center justify-between p-4 bg-slate-950/50 border border-white/10 rounded-2xl hover:border-white/20 transition-all"
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                  <FileText className="w-4 h-4 text-rose-400" /> Incluir Venda
                </span>
                <span
                  className={`w-12 h-6 rounded-full flex items-center transition-all p-1 ${incluirVenda ? 'bg-rose-500/80 justify-end' : 'bg-slate-700 justify-start'}`}
                >
                  <span className="w-4 h-4 bg-white rounded-full shadow" />
                </span>
              </button>
            </div>

            {incluirVenda && (
              <div className="space-y-6 pt-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-rose-400" /> Curso Escolhido
                  </label>
                  <select
                    value={cursoId}
                    onChange={(e) => setCursoId(e.target.value)}
                    required
                    className="w-full bg-slate-950/50 backdrop-blur-md border border-white/10 rounded-xl p-4 text-white focus:ring-2 focus:ring-rose-500 outline-none appearance-none transition-all shadow-inner font-medium"
                  >
                    <option value="" className="bg-slate-900">Selecione o curso...</option>
                    {cursos.map((c) => (
                      <option key={c.id} value={c.id} className="bg-slate-900">
                        {c.nome}{c.categoria ? ` — ${c.categoria}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-400" /> Valor de Entrada (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={valorEntrada}
                      onChange={(e) => setValorEntrada(e.target.value)}
                      required
                      placeholder="0.00"
                      className="w-full bg-slate-950/50 backdrop-blur-md border border-white/10 rounded-xl p-4 text-white focus:ring-2 focus:ring-rose-500 outline-none transition-all shadow-inner font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-orange-400" /> Data de Início
                    </label>
                    <input
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                      required
                      className="w-full bg-slate-950/50 backdrop-blur-md border border-white/10 rounded-xl p-4 text-white focus:ring-2 focus:ring-rose-500 outline-none transition-all shadow-inner font-medium [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <UploadCloud className="w-4 h-4 text-rose-400" /> Comprovante Bancário
                  </label>
                  <div className="relative border-2 border-dashed border-white/10 rounded-2xl p-10 hover:border-rose-500/50 hover:bg-rose-500/5 transition-all group cursor-pointer text-center bg-slate-950/30">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      required
                      onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="flex flex-col items-center justify-center pointer-events-none">
                      {file ? (
                        <>
                          <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-8 h-8 text-rose-500" />
                          </div>
                          <p className="text-base text-white font-bold truncate w-full max-w-[250px]">{file.name}</p>
                          <p className="text-sm text-slate-400 mt-1">Clique para alterar</p>
                        </>
                      ) : (
                        <>
                          <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-rose-500/10 transition-all shadow-lg border border-white/5">
                            <UploadCloud className="w-10 h-10 text-slate-400 group-hover:text-rose-400 transition-colors" />
                          </div>
                          <p className="text-base text-white font-semibold">Arraste ou clique para anexar</p>
                          <p className="text-sm text-slate-500 mt-2">Suporta PDF, PNG e JPG (Máx. 5MB)</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-sm text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 mt-4 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-2xl font-bold text-lg hover:shadow-[0_0_30px_rgba(225,29,72,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {submitting ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  {incluirVenda ? 'Cadastrar e Registrar Venda' : 'Cadastrar Aluno'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
