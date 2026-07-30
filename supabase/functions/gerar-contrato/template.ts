export const getContratoTextLines = (alunoNome: string, cpf: string, cursoNome: string, valor: number) => {
  return [
    { text: "Contrato de Prestacao de Servicos Educacionais", title: true },
    { text: `O presente contrato e firmado entre a Instituicao e`, title: false },
    { text: `Aluno: ${alunoNome}`, title: false },
    { text: `CPF: ${cpf}`, title: false },
    { text: `Matriculado no curso: ${cursoNome}`, title: false },
    { text: `Valor da entrada: R$ ${Number(valor).toFixed(2)}`, title: false },
    { text: ` `, title: false },
    { text: ` `, title: false },
    { text: `_________________________________________________`, title: false },
    { text: `Assinatura do Aluno`, title: false }
  ];
};
