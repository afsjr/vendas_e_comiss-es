import { assertEquals } from "https://deno.land/std@0.210.0/assert/mod.ts";
import { formatCpf, isValidCpf, maskCpf } from "../src/lib/cpf.ts";

Deno.test("maskCpf: oculta os 4 dígitos do meio", () => {
  assertEquals(maskCpf("12345678900"), "123.****.8900");
  assertEquals(maskCpf("123.456.789-00"), "123.****.8900");
});

Deno.test("maskCpf: entrada incompleta cai no formatCpf", () => {
  assertEquals(maskCpf("12345"), formatCpf("12345"));
});

Deno.test("isValidCpf: aceita CPF válido", () => {
  assertEquals(isValidCpf("52998224725"), true);
  assertEquals(isValidCpf("529.982.247-25"), true);
});

Deno.test("isValidCpf: rejeita CPF inválido", () => {
  assertEquals(isValidCpf("11111111111"), false);
  assertEquals(isValidCpf("12345678900"), false);
  assertEquals(isValidCpf("123"), false);
});
