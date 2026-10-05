import { assertEquals } from "https://deno.land/std@0.210.0/assert/mod.ts";
import {
  agruparFunil,
  agruparPorCategoria,
  comparativoPorVendedor,
  dentroDoPeriodo,
  repassePrevisto,
  resolverPeriodo,
  volumeAcumulado,
  type ComissaoRow,
  type VendaRow,
} from "../src/lib/dashboard-metrics.ts";

const nomes = { u1: 'Ana', u2: 'Bruno' };

const vendas: VendaRow[] = [
  { id: 'v1', valor_entrada: 1000, status: 'APROVADA', criado_por: 'u1', criado_em: '2026-10-05T12:00:00Z', cursos: { nome: 'Técnico em X', categoria: 'Técnico' } },
  { id: 'v2', valor_entrada: 2000, status: 'PENDENTE_VALIDACAO', criado_por: 'u2', criado_em: '2026-10-06T12:00:00Z', cursos: { nome: 'Eng Civil', categoria: 'Graduação' } },
  { id: 'v3', valor_entrada: 500, status: 'CANCELADA', criado_por: 'u1', criado_em: '2026-10-07T12:00:00Z', cursos: { nome: 'Livre', categoria: 'Cursos Livres' } },
  { id: 'v4', valor_entrada: 3000, status: 'PRIMEIRA_MENSALIDADE_PAGA', criado_por: 'u2', criado_em: '2026-09-20T12:00:00Z', cursos: { nome: 'Eng Civil', categoria: 'Graduação' } },
];

const comissoes: ComissaoRow[] = [
  { valor_comissao: 100, status: 'LIBERADA_PAGAMENTO', venda_id: 'v1' },
  { valor_comissao: 200, status: 'BLOQUEADA_AUDITORIA', venda_id: 'v2' },
  { valor_comissao: 50, status: 'ESTORNADA', venda_id: 'v3' },
  { valor_comissao: 1080, status: 'PAGA', venda_id: 'v4' },
];

const out2026 = resolverPeriodo('mes-atual', new Date(2026, 9, 15));
const set2026 = resolverPeriodo('mes-anterior', new Date(2026, 9, 15));

Deno.test("resolverPeriodo: mês atual, mês anterior e tudo", () => {
  assertEquals(out2026, { de: '2026-10-01', ate: '2026-10-31' });
  assertEquals(set2026, { de: '2026-09-01', ate: '2026-09-30' });
  assertEquals(resolverPeriodo('tudo', new Date(2026, 9, 15)), { de: null, ate: null });
});

Deno.test("dentroDoPeriodo: bordas e período vazio", () => {
  assertEquals(dentroDoPeriodo('2026-10-01T00:00:00Z', out2026), true);
  assertEquals(dentroDoPeriodo('2026-10-31T23:00:00Z', out2026), true);
  assertEquals(dentroDoPeriodo('2026-09-30T23:00:00Z', out2026), false);
  assertEquals(dentroDoPeriodo(null, out2026), false);
  assertEquals(dentroDoPeriodo('2020-01-01T00:00:00Z', { de: null, ate: null }), true);
});

Deno.test("repassePrevisto: fator por categoria", () => {
  assertEquals(repassePrevisto(vendas[0]), 1000);
  assertEquals(repassePrevisto(vendas[1]), 720);
  assertEquals(repassePrevisto(vendas[2]), 500);
  assertEquals(repassePrevisto({ ...vendas[0], cursos: { nome: 'x', categoria: 'Pós-Graduação' } }), 0);
});

Deno.test("agruparFunil: conta e soma por etapa no período", () => {
  const funil = agruparFunil(vendas, out2026);
  const por = (etapa: string) => funil.find((f) => f.etapa === etapa)!;
  assertEquals(por('APROVADA').quantidade, 1);
  assertEquals(por('APROVADA').valor, 1000);
  assertEquals(por('PENDENTE_VALIDACAO').quantidade, 1);
  assertEquals(por('PENDENTE_VALIDACAO').valor, 2000);
  assertEquals(por('CANCELADA').quantidade, 1);
  assertEquals(por('CANCELADA').valor, 500);
  assertEquals(por('AGUARDANDO_FINANCEIRO').quantidade, 0);
  assertEquals(funil.length, 7);
});

Deno.test("agruparFunil: período anterior isola a venda de setembro", () => {
  const funil = agruparFunil(vendas, set2026);
  const por = (etapa: string) => funil.find((f) => f.etapa === etapa)!;
  assertEquals(por('PRIMEIRA_MENSALIDADE_PAGA').quantidade, 1);
  assertEquals(por('PRIMEIRA_MENSALIDADE_PAGA').valor, 3000);
  assertEquals(por('APROVADA').quantidade, 0);
});

Deno.test("volumeAcumulado: entradas, validadas, comissões e repasse", () => {
  const v = volumeAcumulado(vendas, comissoes, out2026);
  assertEquals(v.entradas, 3000);
  assertEquals(v.entradasValidadas, 1000);
  assertEquals(v.comissoes, 300);
  assertEquals(v.repasse, 1720);
  assertEquals(v.pendentes, 1);
  assertEquals(v.aprovadas, 1);
});

Deno.test("volumeAcumulado: comissão estornada não entra", () => {
  const v = volumeAcumulado(vendas, comissoes, set2026);
  assertEquals(v.entradas, 3000);
  assertEquals(v.comissoes, 1080);
  assertEquals(v.repasse, 1080);
});

Deno.test("agruparPorCategoria: distribuição e percentual", () => {
  const cats = agruparPorCategoria(vendas, out2026);
  assertEquals(cats.map((c) => c.categoria), ['Graduação', 'Técnico']);
  const grad = cats.find((c) => c.categoria === 'Graduação')!;
  assertEquals(grad.valor, 2000);
  assertEquals(Math.round(grad.percentual * 100), 67);
  const tec = cats.find((c) => c.categoria === 'Técnico')!;
  assertEquals(Math.round(tec.percentual * 100), 33);
});

Deno.test("comparativoPorVendedor: agrega e ordena por valor", () => {
  const comp = comparativoPorVendedor(vendas, nomes, out2026);
  assertEquals(comp.map((c) => c.vendedor_id), ['u2', 'u1']);

  const u1 = comp.find((c) => c.vendedor_id === 'u1')!;
  assertEquals(u1.nome, 'Ana');
  assertEquals(u1.quantidade, 1);
  assertEquals(u1.valor, 1000);
  assertEquals(u1.aprovadas, 1);
  assertEquals(u1.repasse, 1000);

  const u2 = comp.find((c) => c.vendedor_id === 'u2')!;
  assertEquals(u2.quantidade, 1);
  assertEquals(u2.valor, 2000);
  assertEquals(u2.aprovadas, 0);
  assertEquals(u2.repasse, 720);
});

Deno.test("comparativoPorVendedor: venda cancelada é ignorada", () => {
  const comp = comparativoPorVendedor(vendas, nomes, out2026);
  const u1 = comp.find((c) => c.vendedor_id === 'u1')!;
  assertEquals(u1.quantidade, 1);
  assertEquals(u1.valor, 1000);
});
