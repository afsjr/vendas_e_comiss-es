import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'http://localhost:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function seed() {
  console.log('Seeding data...');
  
  const { error: errorCursos } = await supabase.from('cursos').upsert([
    { id: 'c1', nome: 'Inglês Básico', valor_comissao_fixo: 50.00 },
    { id: 'c2', nome: 'Espanhol Avançado', valor_comissao_fixo: 60.00 },
    { id: 'c3', nome: 'Programação Web', valor_comissao_fixo: 100.00 },
    { id: 'c4', nome: 'Design Gráfico', valor_comissao_fixo: 80.00 },
    { id: 'c5', nome: 'Marketing Digital', valor_comissao_fixo: 70.00 }
  ]);

  if (errorCursos) console.error('Erro ao inserir cursos:', errorCursos);
  else console.log('Cursos inseridos!');

  const { error: errorAlunos } = await supabase.from('alunos').upsert([
    { id: 'a1', nome: 'João Silva', cpf: '111.111.111-11' },
    { id: 'a2', nome: 'Maria Souza', cpf: '222.222.222-22' }
  ]);

  if (errorAlunos) console.error('Erro ao inserir alunos:', errorAlunos);
  else console.log('Alunos inseridos!');

  console.log('Seed completed successfully.');
}

seed().catch(console.error);
