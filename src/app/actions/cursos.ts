'use server';

import { authorizeGestor } from './guard';

const CATEGORIAS = ['Técnico', 'Graduação', 'Pós-Graduação', 'Cursos Livres'] as const;
export type Categoria = (typeof CATEGORIAS)[number];

type CursoInput = {
  nome: string;
  categoria: Categoria;
  valor_comissao_fixo: number;
};

function validar(dados: CursoInput): string | null {
  if (!dados.nome || !dados.nome.trim()) return 'Informe o nome do curso.';
  if (!CATEGORIAS.includes(dados.categoria)) return 'Categoria inválida.';
  if (!(dados.valor_comissao_fixo > 0)) return 'O valor de comissão deve ser maior que zero.';
  return null;
}

export async function criarCurso(dados: CursoInput, accessToken: string) {
  const auth = await authorizeGestor(accessToken);
  if (!auth.ok) return { error: auth.error };

  const erro = validar(dados);
  if (erro) return { error: erro };

  const { data, error } = await auth.admin
    .from('cursos')
    .insert({
      nome: dados.nome.trim(),
      categoria: dados.categoria,
      valor_comissao_fixo: dados.valor_comissao_fixo,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function atualizarCurso(id: string, dados: CursoInput, accessToken: string) {
  const auth = await authorizeGestor(accessToken);
  if (!auth.ok) return { error: auth.error };

  const erro = validar(dados);
  if (erro) return { error: erro };

  const { data, error } = await auth.admin
    .from('cursos')
    .update({
      nome: dados.nome.trim(),
      categoria: dados.categoria,
      valor_comissao_fixo: dados.valor_comissao_fixo,
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return { error: error.message };
  return { data };
}

export async function excluirCurso(id: string, accessToken: string) {
  const auth = await authorizeGestor(accessToken);
  if (!auth.ok) return { error: auth.error };

  const { error } = await auth.admin.from('cursos').delete().eq('id', id);

  if (error) {
    if (error.code === '23503') {
      return { error: 'Este curso já foi usado em vendas e não pode ser excluído.' };
    }
    return { error: error.message };
  }
  return { data: { id } };
}
