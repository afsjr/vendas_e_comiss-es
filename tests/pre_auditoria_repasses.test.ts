import { assertEquals } from "https://deno.land/std@0.210.0/assert/mod.ts";
import {
  competenciaOrdenavel,
  decodeLatin1,
  parseParcela,
  parseRepasseCsv,
  parseValorBR,
  resultadoConciliacao,
  resumoPorCpf,
} from "../supabase/functions/_shared/repasse_parser.ts";

const HEADER =
  "BP Polo;CPF Aluno;Mensalidade;Operacao Principal;Data Competencia ;Valor documento;Valor_Repasse;Tipo documento;Dt compensacao";

function csvComBom(corpo: string): string {
  const bytes = new Uint8Array(3 + corpo.length);
  bytes[0] = 0xef;
  bytes[1] = 0xbb;
  bytes[2] = 0xbf;
  for (let i = 0; i < corpo.length; i++) bytes[3 + i] = corpo.charCodeAt(i) & 0xff;
  return decodeLatin1(bytes);
}

Deno.test("parseValorBR: valores pt-BR com e sem milhar e negativos", () => {
  assertEquals(parseValorBR("R$ 386,37"), 386.37);
  assertEquals(parseValorBR("R$ 1.234,56"), 1234.56);
  assertEquals(parseValorBR("-R$ 0,83"), -0.83);
  assertEquals(parseValorBR(""), 0);
});

Deno.test("parseParcela: inteiro e vazio", () => {
  assertEquals(parseParcela("21"), 21);
  assertEquals(parseParcela("0"), 0);
  assertEquals(parseParcela(""), null);
});

Deno.test("competenciaOrdenavel: mês em português", () => {
  assertEquals(competenciaOrdenavel("SETEMBRO/2026"), 202609);
  assertEquals(competenciaOrdenavel("JANEIRO/2025"), 202501);
  assertEquals(competenciaOrdenavel("invalido"), 0);
});

Deno.test("decodeLatin1: remove BOM e preserva caracteres", () => {
  assertEquals(decodeLatin1(new Uint8Array([0xef, 0xbb, 0xbf, 0x41])), "A");
});

Deno.test("parseRepasseCsv: BOM, cabeçalho repetido, linha malformada e CPF inválido", () => {
  const corpo = [
    HEADER,
    "3005381;01064442471;1;R101;SETEMBRO/2026;R$ 386,37;R$ 115,91;FA;05/09/26 00:00",
    "3005381;06475249459;6;R101;AGOSTO/2026;R$ 15,67;R$ 4,70;FA;08/09/26 00:00",
    "linha malformada",
    "3005381;123;0;R215;AGOSTO/2026;-R$ 0,83;-R$ 0,25;CO;01/09/26 00:00",
    HEADER,
    "3005381;12280896478;1;R101;JULHO/2026;R$ 100,00;R$ 30,00;FA;10/07/26 00:00",
  ].join("\n");

  const { linhas, totalLinhas } = parseRepasseCsv(csvComBom(corpo));

  assertEquals(linhas.length, 3);
  assertEquals(totalLinhas, 5);
  assertEquals(linhas[0].cpf, "01064442471");
  assertEquals(linhas[0].parcela, 1);
  assertEquals(linhas[0].operacao, "R101");
  assertEquals(linhas[0].valorRepasse, 115.91);
  assertEquals(linhas[2].cpf, "12280896478");
});

Deno.test("resultadoConciliacao: parcela 1 habilita APARECEU", () => {
  const { linhas } = parseRepasseCsv(
    csvComBom(
      [
        HEADER,
        "3005381;01064442471;1;R101;SETEMBRO/2026;R$ 386,37;R$ 115,91;FA;05/09/26 00:00",
      ].join("\n"),
    ),
  );
  const r = resultadoConciliacao(linhas, 1);
  assertEquals(r.resultado, "APARECEU");
  assertEquals(r.competenciaInicio, "SETEMBRO/2026");
  assertEquals(r.valorRepasse, 115.91);
});

Deno.test("resultadoConciliacao: só parcela > 1 => NAO_APARECEU", () => {
  const { linhas } = parseRepasseCsv(
    csvComBom(
      [
        HEADER,
        "3005381;06475249459;6;R101;AGOSTO/2026;R$ 15,67;R$ 4,70;FA;08/09/26 00:00",
      ].join("\n"),
    ),
  );
  const r = resultadoConciliacao(linhas, 1);
  assertEquals(r.resultado, "NAO_APARECEU");
  assertEquals(r.competenciaInicio, null);
});

Deno.test("resultadoConciliacao: mais de uma venda de Graduação => AMBIGUO", () => {
  const { linhas } = parseRepasseCsv(
    csvComBom(
      [
        HEADER,
        "3005381;01064442471;1;R101;SETEMBRO/2026;R$ 386,37;R$ 115,91;FA;05/09/26 00:00",
      ].join("\n"),
    ),
  );
  assertEquals(resultadoConciliacao(linhas, 2).resultado, "AMBIGUO");
});

Deno.test("resultadoConciliacao: parcela 1 com Valor_Repasse = 0 não habilita", () => {
  const { linhas } = parseRepasseCsv(
    csvComBom(
      [
        HEADER,
        "3005381;01064442471;1;R101;SETEMBRO/2026;R$ 0,00;R$ 0,00;FA;05/09/26 00:00",
      ].join("\n"),
    ),
  );
  assertEquals(resultadoConciliacao(linhas, 1).resultado, "NAO_APARECEU");
});

Deno.test("resumoPorCpf: soma o repasse por CPF", () => {
  const { linhas } = parseRepasseCsv(
    csvComBom(
      [
        HEADER,
        "3005381;01064442471;1;R101;SETEMBRO/2026;R$ 386,37;R$ 115,91;FA;05/09/26 00:00",
        "3005381;01064442471;2;R201;AGOSTO/2026;R$ 15,67;R$ 4,70;FA;08/09/26 00:00",
      ].join("\n"),
    ),
  );
  const resumo = resumoPorCpf(linhas);
  assertEquals(resumo.get("01064442471")?.total.toFixed(2), "120.61");
});
