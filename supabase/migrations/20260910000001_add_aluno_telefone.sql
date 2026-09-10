-- Add telefone and is_whatsapp columns to alunos table
ALTER TABLE public.alunos ADD COLUMN telefone VARCHAR(11);
ALTER TABLE public.alunos ADD COLUMN is_whatsapp BOOLEAN DEFAULT false;
