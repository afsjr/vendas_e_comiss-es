INSERT INTO public.cursos (id, nome, valor_comissao_fixo)
VALUES
  ('c1', 'Técnico em Enfermagem', 50.00),
  ('c2', 'Técnico em Informática', 50.00),
  ('c3', 'Graduação em Administração', 150.00),
  ('c4', 'Pós-Graduação em Gestão', 200.00),
  ('c5', 'Cursos Livres - Oratória', 30.00)
ON CONFLICT (id) DO UPDATE SET 
  nome = EXCLUDED.nome, 
  valor_comissao_fixo = EXCLUDED.valor_comissao_fixo;
