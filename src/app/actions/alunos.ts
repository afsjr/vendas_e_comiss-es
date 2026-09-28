'use server';

import { isValidCpf } from '@/lib/cpf';
import { authorizeGestor } from './guard';

export async function corrigirCpf(
  alunoId: string,
  novoCpf: string,
  motivo: string,
  accessToken: string
) {
  const auth = await authorizeGestor(accessToken);
  if (!auth.ok) return { error: auth.error };

  const digits = (novoCpf || '').replace(/\D/g, '');
  if (!isValidCpf(digits)) return { error: 'CPF inválido (verifique o formato e o dígito verificador).' };

  const motivoLimpo = (motivo || '').trim();
  if (motivoLimpo.length < 5) return { error: 'Informe o motivo da correção (mínimo 5 caracteres).' };

  const { data: atual, error: fetchError } = await auth.admin
    .from('alunos')
    .select('cpf')
    .eq('id', alunoId)
    .single();

  if (fetchError || !atual) return { error: 'Aluno não encontrado.' };
  if (atual.cpf === digits) return { error: 'O CPF informado é igual ao atual.' };

  const { data: existente } = await auth.admin
    .from('alunos')
    .select('id')
    .eq('cpf', digits)
    .maybeSingle();

  if (existente) return { error: 'CPF já cadastrado para outro aluno.' };

  const { error: updateError } = await auth.admin
    .from('alunos')
    .update({ cpf: digits, atualizado_em: new Date().toISOString() })
    .eq('id', alunoId);

  if (updateError) return { error: updateError.message };

  const { error: historyError } = await auth.admin.from('alunos_cpf_historico').insert({
    aluno_id: alunoId,
    valor_anterior: atual.cpf,
    valor_novo: digits,
    motivo: motivoLimpo,
    autor_id: auth.userId,
  });

  if (historyError) return { error: historyError.message };

  return { data: { cpf: digits } };
}
