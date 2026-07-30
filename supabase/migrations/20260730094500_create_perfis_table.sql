CREATE TABLE IF NOT EXISTS public.perfis (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'VENDEDOR' CHECK (role IN ('VENDEDOR', 'SECRETARIA', 'AUDITOR', 'GESTOR')),
    criado_em TIMESTAMPTZ DEFAULT now()
);

-- Função e Trigger para inserir perfil automaticamente ao criar usuário no Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.perfis (id, email, nome, role)
    VALUES (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', new.email),
        'VENDEDOR'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill de usuários existentes
INSERT INTO public.perfis (id, email, nome, role)
SELECT id, email, coalesce(raw_user_meta_data->>'full_name', email), 'GESTOR'
FROM auth.users
ON CONFLICT (id) DO NOTHING;
