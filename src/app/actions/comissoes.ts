'use server';

import { getAdminClient } from './guard';

const PAPEIS_PAGAMENTO = ['GESTOR', 'AUDITOR', 'FINANCEIRO'];

export interface ResultadoPagamento {
  pagas: number;
  ignoradas: number;
  total: number;
}

export async function registrarPagamento(
  ids: string[],
  accessToken: string,
  dataPagamento?: string | null,
) {
  if (!accessToken) return { error: 'Sessão não informada.' };
  if (!ids || ids.length === 0) return { error: 'Nenhuma comissão selecionada.' };

  const admin = getAdminClient();
  if (!admin) {
    return { error: 'SUPABASE_SERVICE_ROLE_KEY não configurada no servidor.' };
  }

  const { data: { user }, error: authError } = await admin.auth.getUser(accessToken);
  if (authError || !user) return { error: 'Sessão inválida ou expirada.' };

  const role = (user.app_metadata as { app_role?: string } | undefined)?.app_role;
  if (!role || !PAPEIS_PAGAMENTO.includes(role)) {
    return { error: 'Acesso negado para o seu perfil.' };
  }

  const { data, error } = await admin.rpc('registrar_pagamento_comissoes', {
    p_ids: ids,
    p_data_pagamento: dataPagamento || null,
  });

  if (error) return { error: error.message };

  return { data: data as ResultadoPagamento };
}
