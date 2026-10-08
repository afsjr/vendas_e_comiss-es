import { assertEquals } from "https://deno.land/std@0.210.0/assert/mod.ts";
import { avaliarLiberacaoComissao } from "../supabase/functions/_shared/comissao.ts";

Deno.test("liberacao: curso ja iniciado libera com data_liberacao preenchida", () => {
  const agora = new Date("2026-10-07T12:00:00Z");
  const r = avaliarLiberacaoComissao("2026-09-01", agora);
  assertEquals(r.status, "LIBERADA_PAGAMENTO");
  assertEquals(r.data_liberacao, agora.toISOString());
});

Deno.test("liberacao: curso futuro mantem previsto e sem data", () => {
  const agora = new Date("2026-10-07T12:00:00Z");
  const r = avaliarLiberacaoComissao("2026-11-01", agora);
  assertEquals(r.status, "AGUARDANDO_INICIO_AULAS");
  assertEquals(r.data_liberacao, null);
});

Deno.test("liberacao: inicio no mesmo dia libera", () => {
  const agora = new Date("2026-10-07T00:00:00Z");
  const r = avaliarLiberacaoComissao("2026-10-07", agora);
  assertEquals(r.status, "LIBERADA_PAGAMENTO");
  assertEquals(r.data_liberacao, agora.toISOString());
});

Deno.test("liberacao: aceita Date como entrada", () => {
  const agora = new Date("2026-10-07T12:00:00Z");
  const r = avaliarLiberacaoComissao(new Date("2026-10-06T00:00:00Z"), agora);
  assertEquals(r.status, "LIBERADA_PAGAMENTO");
});
