import { assertEquals } from "https://deno.land/std@0.210.0/assert/mod.ts";
import {
  agruparPorVendedor,
  alertaFechamento,
  dataInicioExibicao,
  dataReferencia,
  dentroDoPeriodo,
  ehAPagar,
  ehPaga,
  filtrarComissoes,
  mesIntervalo,
  podeOperarComissoes,
  rotuloSituacao,
  semDataInicio,
  totaisGerais,
  type ComissaoPagamentoRow,
} from "../src/lib/comissoes-pagamento.ts";

const rows: ComissaoPagamentoRow[] = [
  { id: 'c1', vendedor_id: 'v1', curso_nome: 'Técnico', valor: 100, status: 'LIBERADA_PAGAMENTO', data_liberacao: '2026-10-05T12:00:00Z', data_venda: '2026-09-01T10:00:00Z', data_inicio_curso: '2026-10-01', data_pagamento: null },
  { id: 'c2', vendedor_id: 'v1', curso_nome: 'Graduação', valor: 50, status: 'PAGA', data_liberacao: '2026-09-10T12:00:00Z', data_venda: '2026-08-01T10:00:00Z', data_inicio_curso: null, data_pagamento: '2026-09-25T12:00:00Z' },
  { id: 'c3', vendedor_id: 'v2', curso_nome: 'Livre', valor: 200, status: 'LIBERADA_PAGAMENTO', data_liberacao: '2026-10-20T12:00:00Z', data_venda: '2026-09-15T10:00:00Z', data_inicio_curso: '2026-10-15', data_pagamento: null },
  { id: 'c4', vendedor_id: 'v2', curso_nome: 'Pós', valor: 20, status: 'ESTORNADA', data_liberacao: '2026-10-21T12:00:00Z', data_venda: '2026-09-16T10:00:00Z', data_inicio_curso: '2026-10-16', data_pagamento: null },
];

const nomes = { v1: 'Ana', v2: 'Bruno' };

Deno.test("rotuloSituacao: mapeia os status de comissão", () => {
  assertEquals(rotuloSituacao('LIBERADA_PAGAMENTO'), 'A pagar');
  assertEquals(rotuloSituacao('PAGA'), 'Paga');
  assertEquals(rotuloSituacao('BLOQUEADA_AUDITORIA'), 'Bloqueada');
  assertEquals(rotuloSituacao('AGUARDANDO_INICIO_AULAS'), 'Aguardando início');
  assertEquals(rotuloSituacao('ESTORNADA'), 'Estornada');
  assertEquals(rotuloSituacao('DESCONHECIDO'), '—');
});

Deno.test("podeOperarComissoes: apenas papéis administrativos", () => {
  assertEquals(podeOperarComissoes('GESTOR'), true);
  assertEquals(podeOperarComissoes('AUDITOR'), true);
  assertEquals(podeOperarComissoes('FINANCEIRO'), true);
  assertEquals(podeOperarComissoes('VENDEDOR'), false);
  assertEquals(podeOperarComissoes('SECRETARIA'), false);
  assertEquals(podeOperarComissoes(null), false);
});

Deno.test("ehAPagar / ehPaga", () => {
  assertEquals(ehAPagar('LIBERADA_PAGAMENTO'), true);
  assertEquals(ehAPagar('PAGA'), false);
  assertEquals(ehPaga('PAGA'), true);
  assertEquals(ehPaga('LIBERADA_PAGAMENTO'), false);
});

Deno.test("semDataInicio: detecta comissão sem data de início do curso", () => {
  assertEquals(semDataInicio({ data_inicio_curso: null }), true);
  assertEquals(semDataInicio({ data_inicio_curso: '2026-10-01' }), false);
});

Deno.test("dentroDoPeriodo: casos de borda", () => {
  assertEquals(dentroDoPeriodo('2026-10-05T00:00:00Z', '2026-10-01', '2026-10-31'), true);
  assertEquals(dentroDoPeriodo('2026-09-30T00:00:00Z', '2026-10-01', '2026-10-31'), false);
  assertEquals(dentroDoPeriodo(null, '2026-10-01', '2026-10-31'), false);
  assertEquals(dentroDoPeriodo('2026-10-05T00:00:00Z', null, null), true);
});

Deno.test("dataReferencia: usa data de pagamento quando paga", () => {
  const paga = rows.find((r) => r.id === 'c2')!;
  const aPagar = rows.find((r) => r.id === 'c1')!;
  assertEquals(dataReferencia(paga), '2026-09-25T12:00:00Z');
  assertEquals(dataReferencia(aPagar), '2026-10-05T12:00:00Z');
});

Deno.test("filtrarComissoes: por situação e por vendedor", () => {
  assertEquals(filtrarComissoes(rows, { situacao: 'A_PAGAR' }).map((r) => r.id), ['c1', 'c3']);
  assertEquals(filtrarComissoes(rows, { situacao: 'PAGAS' }).map((r) => r.id), ['c2']);
  assertEquals(filtrarComissoes(rows, { vendedorId: 'v1' }).map((r) => r.id), ['c1', 'c2']);
  assertEquals(filtrarComissoes(rows, { situacao: 'TODAS' }).length, 4);
});

Deno.test("filtrarComissoes: por período usando a data de referência", () => {
  const out = filtrarComissoes(rows, { de: '2026-10-01', ate: '2026-10-31' });
  // c1 (lib out/2026), c3 (lib out/2026), c4 (lib out/2026); c2 é PAGA e paga em set/2026
  assertEquals(out.map((r) => r.id), ['c1', 'c3', 'c4']);
});

Deno.test("agruparPorVendedor: soma a pagar e pago, ordena pelo a pagar", () => {
  const linhas = agruparPorVendedor(rows, nomes);
  assertEquals(linhas.map((l) => l.vendedor_id), ['v2', 'v1']);
  const v1 = linhas.find((l) => l.vendedor_id === 'v1')!;
  assertEquals(v1.nome, 'Ana');
  assertEquals(v1.aPagar, 100);
  assertEquals(v1.pago, 50);
  assertEquals(v1.total, 150);
  const v2 = linhas.find((l) => l.vendedor_id === 'v2')!;
  assertEquals(v2.aPagar, 200);
  assertEquals(v2.pago, 0);
  assertEquals(v2.total, 200);
});

Deno.test("totaisGerais: soma geral do recorte", () => {
  const t = totaisGerais(rows);
  assertEquals(t.aPagar, 300);
  assertEquals(t.pago, 50);
  assertEquals(t.qtd, 4);
});

Deno.test("dataInicioExibicao: usa o valor real e cai para a data da venda", () => {
  const comInicio = dataInicioExibicao({ data_inicio_curso: '2026-10-01', data_venda: '2026-09-01T10:00:00Z' });
  assertEquals(comInicio, { data: '2026-10-01', fallback: false });

  const semInicio = dataInicioExibicao({ data_inicio_curso: null, data_venda: '2026-09-01T10:00:00Z' });
  assertEquals(semInicio, { data: '2026-09-01T10:00:00Z', fallback: true });

  const ambosNulos = dataInicioExibicao({ data_inicio_curso: null, data_venda: null });
  assertEquals(ambosNulos, { data: null, fallback: true });
});

Deno.test("mesIntervalo: primeiro e último dia do mês", () => {
  const ref = new Date('2026-10-15T12:00:00Z');
  assertEquals(mesIntervalo(ref), { de: '2026-10-01', ate: '2026-10-31' });
});

Deno.test("alertaFechamento: ativa a partir do dia 22 (America/Sao_Paulo)", () => {
  assertEquals(alertaFechamento(new Date('2026-10-21T12:00:00-03:00')).ativo, false);
  assertEquals(alertaFechamento(new Date('2026-10-22T12:00:00-03:00')).ativo, true);
  assertEquals(alertaFechamento(new Date('2026-10-30T12:00:00-03:00')).ativo, true);
});
