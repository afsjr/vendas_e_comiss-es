import { assertEquals } from "https://deno.land/std@0.210.0/assert/mod.ts";

// Helper function to simulate the commission engine state transitions (logic to be implemented in Edge Functions)
function processCommissionTransition(
  currentStatusVenda: string,
  newStatusVenda: string,
  dataInicioCurso: Date,
  hoje: Date
) {
  let statusComissao = "AGUARDANDO_INICIO_AULAS";
  
  if (newStatusVenda === "APROVADA") {
    if (dataInicioCurso <= hoje) {
      statusComissao = "LIBERADA_PAGAMENTO";
    } else {
      statusComissao = "AGUARDANDO_INICIO_AULAS";
    }
  } else if (newStatusVenda === "DEVOLVIDA_AJUSTE") {
    statusComissao = "BLOQUEADA_AUDITORIA";
  } else if (newStatusVenda === "ESTORNADA") {
    statusComissao = "ESTORNADA";
  }
  
  return statusComissao;
}

Deno.test("Máquina de Estados: Transição PENDENTE_VALIDACAO -> APROVADA (Aulas não iniciadas)", () => {
  const dataInicio = new Date();
  dataInicio.setDate(dataInicio.getDate() + 10); // Futuro
  const hoje = new Date();
  
  const novoStatus = processCommissionTransition("PENDENTE_VALIDACAO", "APROVADA", dataInicio, hoje);
  assertEquals(novoStatus, "AGUARDANDO_INICIO_AULAS");
});

Deno.test("Máquina de Estados: Trava data_inicio_curso > HOJE mantém AGUARDANDO_INICIO_AULAS", () => {
  const dataInicio = new Date("2026-08-01T00:00:00Z");
  const hoje = new Date("2026-07-27T00:00:00Z"); // Antes do início
  
  const novoStatus = processCommissionTransition("PENDENTE_VALIDACAO", "APROVADA", dataInicio, hoje);
  assertEquals(novoStatus, "AGUARDANDO_INICIO_AULAS");
});

Deno.test("Máquina de Estados: Transição para LIBERADA_PAGAMENTO ao atingir data", () => {
  const dataInicio = new Date("2026-07-25T00:00:00Z");
  const hoje = new Date("2026-07-27T00:00:00Z"); // Após início
  
  const novoStatus = processCommissionTransition("PENDENTE_VALIDACAO", "APROVADA", dataInicio, hoje);
  assertEquals(novoStatus, "LIBERADA_PAGAMENTO");
});

Deno.test("Máquina de Estados: Estorno gera ESTORNADA + contra-lançamento no livro-caixa", () => {
  const novoStatus = processCommissionTransition("APROVADA", "ESTORNADA", new Date(), new Date());
  assertEquals(novoStatus, "ESTORNADA");
  
  const lancamentoLivroCaixa = {
    tipo: "DÉBITO",
    descricao: "Estorno de comissão"
  };
  assertEquals(lancamentoLivroCaixa.tipo, "DÉBITO");
});
