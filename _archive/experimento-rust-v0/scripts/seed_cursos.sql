-- Seed do catálogo de cursos
-- 4 categorias: Técnico, Graduação, Pós-Graduação, Cursos Livres

INSERT INTO cursos (id, nome, categoria, valor_curso, valor_comissao_fixo, data_inicio_curso, ativo) VALUES
-- Cursos Técnicos
(gen_random_uuid(), 'Técnico em Enfermagem', 'TECNICO', 3500.00, 350.00, '2026-08-01', true),
(gen_random_uuid(), 'Técnico em Informática', 'TECNICO', 2800.00, 280.00, '2026-08-01', true),
(gen_random_uuid(), 'Técnico em Administração', 'TECNICO', 2500.00, 250.00, '2026-08-01', true),

-- Graduação
(gen_random_uuid(), 'Bacharelado em Direito', 'GRADUACAO', 8900.00, 890.00, '2027-02-01', true),
(gen_random_uuid(), 'Bacharelado em Administração', 'GRADUACAO', 4500.00, 450.00, '2027-02-01', true),
(gen_random_uuid(), 'Licenciatura em Pedagogia', 'GRADUACAO', 3200.00, 320.00, '2027-02-01', true),
(gen_random_uuid(), 'Bacharelado em Engenharia de Software', 'GRADUACAO', 5800.00, 580.00, '2027-02-01', true),

-- Pós-Graduação
(gen_random_uuid(), 'MBA em Gestão Empresarial', 'POS_GRADUACAO', 6200.00, 620.00, '2026-09-01', true),
(gen_random_uuid(), 'Especialização em Direito do Trabalho', 'POS_GRADUACAO', 4800.00, 480.00, '2026-09-01', true),
(gen_random_uuid(), 'Pós-Graduação em Enfermagem do Trabalho', 'POS_GRADUACAO', 4200.00, 420.00, '2026-09-01', true),

-- Cursos Livres
(gen_random_uuid(), 'Inglês Básico', 'CURSO_LIVRE', 1200.00, 120.00, '2026-08-15', true),
(gen_random_uuid(), 'Informática para Terceira Idade', 'CURSO_LIVRE', 800.00, 80.00, '2026-08-15', true),
(gen_random_uuid(), 'Libras - Nível Básico', 'CURSO_LIVRE', 600.00, 60.00, '2026-08-15', true),
(gen_random_uuid(), 'Fotografia Digital', 'CURSO_LIVRE', 900.00, 90.00, '2026-08-15', true)
ON CONFLICT DO NOTHING;
