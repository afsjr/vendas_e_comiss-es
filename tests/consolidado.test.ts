import { assertEquals } from "https://deno.land/std@0.210.0/assert/mod.ts";
import {
  agregarPorVendedor,
  buildConsolidadoCsv,
  dentroDoPeriodo,
  rotuloStatus,
  type ComissaoRow,
} from "../src/lib/consolidado.ts";

const nomes = { v1: 'Ana', v2: 'Bruno' };

const rows: ComissaoRow[] = [
  { vendedor_id: 'v1', valor: 100, status: 'LIBERADA_PAGAMENTO', data_liberacao: '2026-09-10T12:00:00Z' },
  { vendedor_id: 'v1', valor: 50, status: 'PAGA', data_liberacao: '2026-08-10T12:00:00Z' },
  { vendedor_id: 'v1', valor: 30, status: 'AGUARDANDO_INICIO_AULAS', data_liberacao: null },
  { vendedor_id: 'v2', valor: 200, status: 'LIBERADA_PAGAMENTO', data_liberacao: '2026-09-20T12:00:00Z' },
  { vendedor_id: 'v2', valor: 20, status: 'ESTORNADA', data_liberacao: '2026-09-21T12:00:00Z' },
  { vendedor_id: 'v2', valor: 10, status: 'BLOQUEADA_AUDITORIA', data_liberacao: null },
];

Deno.test("rotuloStatus: mapeia os status", () => {
  assertEquals(rotuloStatus('LIBERADA_PAGAMENTO'), 'A pagar');
  assertEquals(rotuloStatus('AGUARDANDO_INICIO_AULAS'), 'Previsto');
  assertEquals(rotuloStatus('BLOQUEADA_AUDITORIA'), 'Previsto');
  assertEquals(rotuloStatus('PAGA'), 'Pago');
  assertEquals(rotuloStatus('ESTORNADA'), 'Estornada');
  assertEquals(rotuloStatus('DESCONHECIDO'), '—');
});

Deno.test("agregarPorVendedor: soma por situação e ordena pelo a pagar", () => {
  const linhas = agregarPorVendedor(rows, nomes);
  assertEquals(linhas.map((l) => l.vendedor_id), ['v2', 'v1']);

  const v1 = linhas.find((l) => l.vendedor_id === 'v1')!;
  assertEquals(v1.nome, 'Ana');
  assertEquals(v1.aPagar, 100);
  assertEquals(v1.pago, 50);
  assertEquals(v1.previsto, 30);
  assertEquals(v1.estornada, 0);
  assertEquals(v1.total, 180);

  const v2 = linhas.find((l) => l.vendedor_id === 'v2')!;
  assertEquals(v2.aPagar, 200);
  assertEquals(v2.estornada, 20);
  assertEquals(v2.previsto, 10);
  assertEquals(v2.total, 230);
});

Deno.test("agregarPorVendedor: filtra pelo período de liberação", () => {
  const linhas = agregarPorVendedor(rows, nomes, { de: '2026-09-01', ate: '2026-09-30' });
  const v1 = linhas.find((l) => l.vendedor_id === 'v1')!;
  const v2 = linhas.find((l) => l.vendedor_id === 'v2')!;
  // v1: só a LIBERADA de setembro (a PAGA é de agosto; a AGUARDANDO não tem data)
  assertEquals(v1.aPagar, 100);
  assertEquals(v1.pago, 0);
  assertEquals(v1.previsto, 0);
  assertEquals(v2.aPagar, 200);
  assertEquals(v2.estornada, 20);
});

Deno.test("dentroDoPeriodo: casos de borda", () => {
  assertEquals(dentroDoPeriodo('2026-09-10T00:00:00Z', '2026-09-01', '2026-09-30'), true);
  assertEquals(dentroDoPeriodo('2026-08-31T00:00:00Z', '2026-09-01', '2026-09-30'), false);
  assertEquals(dentroDoPeriodo(null, '2026-09-01', '2026-09-30'), false);
  assertEquals(dentroDoPeriodo('2026-09-10T00:00:00Z', null, null), true);
});

Deno.test("buildConsolidadoCsv: cabeçalho e linha formatada", () => {
  const csv = buildConsolidadoCsv(agregarPorVendedor(rows, nomes));
  const linhas = csv.split('\n');
  assertEquals(linhas[0], 'Vendedor;A pagar;Previsto;Pago;Estornada;Total');
  assertEquals(linhas[1], 'Bruno;200,00;10,00;0,00;20,00;230,00');
  assertEquals(linhas[2], 'Ana;100,00;30,00;50,00;0,00;180,00');
});
