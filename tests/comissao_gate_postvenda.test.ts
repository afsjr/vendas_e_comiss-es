import { assertEquals } from "https://deno.land/std@0.210.0/assert/mod.ts";

// Porta pura do novo gate de liberação: `liberar-comissoes-diaria` passa a
// exigir venda em PRIMEIRA_MENSALIDADE_PAGA (ou APROVADA) para liberar a
// comissão, mesmo que a data de início já tenha vencido (RN-02).
export function podeLiberarComissao(statusVenda: string): boolean {
  return statusVenda === 'PRIMEIRA_MENSALIDADE_PAGA' || statusVenda === 'APROVADA';
}

Deno.test("gate: PRIMEIRA_MENSALIDADE_PAGA libera comissao", () => {
  assertEquals(podeLiberarComissao('PRIMEIRA_MENSALIDADE_PAGA'), true);
});

Deno.test("gate: APROVADA libera comissao", () => {
  assertEquals(podeLiberarComissao('APROVADA'), true);
});

Deno.test("gate: PENDENTE_VALIDACAO nao libera mesmo com data vencida", () => {
  assertEquals(podeLiberarComissao('PENDENTE_VALIDACAO'), false);
});

Deno.test("gate: estados do pos-venda nao liberam sem 1a mensalidade paga", () => {
  assertEquals(podeLiberarComissao('AGUARDANDO_FINANCEIRO'), false);
  assertEquals(podeLiberarComissao('AGUARDANDO_PAGAMENTO_1M'), false);
});

Deno.test("gate: CANCELADA e DEVOLVIDA_AJUSTE nao liberam", () => {
  assertEquals(podeLiberarComissao('CANCELADA'), false);
  assertEquals(podeLiberarComissao('DEVOLVIDA_AJUSTE'), false);
});

Deno.test("gate: venda em APROVADA com data_inicio vencida continua liberando por status", () => {
  const hoje = new Date("2026-09-09T00:00:00Z");
  const dataInicioVencida = new Date("2026-08-01T00:00:00Z");
  const status = 'APROVADA';
  const libera = podeLiberarComissao(status) && dataInicioVencida <= hoje;
  assertEquals(libera, true);
});