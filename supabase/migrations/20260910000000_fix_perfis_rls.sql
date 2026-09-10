-- Fix: RLS policies for perfis table
-- Problem: The correlated subquery in "Leitura gestor ou auditor" and "Update gestor"
-- may fail because it queries perfis (the same table being protected), creating a
-- circular dependency in some PostgreSQL/Supabase configurations.
-- Solution: Use current_setting() to read the role directly from the JWT.

-- Drop the problematic policies
DROP POLICY IF EXISTS "Leitura gestor ou auditor" ON public.perfis;
DROP POLICY IF EXISTS "Leitura pessoal" ON public.perfis;
DROP POLICY IF EXISTS "Update gestor" ON public.perfis;

-- Recreate: personal read
CREATE POLICY "Leitura pessoal" ON public.perfis
    FOR SELECT USING (auth.uid() = id);

-- Recreate: gestor/auditor read using JWT claim (no subquery needed)
CREATE POLICY "Leitura gestor ou auditor" ON public.perfis
    FOR SELECT USING (
        current_setting('request.jwt.claims', true)::json->> 'app_role' IN ('GESTOR', 'AUDITOR')
    );

-- Recreate: gestor update using JWT claim
CREATE POLICY "Update gestor" ON public.perfis
    FOR UPDATE USING (
        current_setting('request.jwt.claims', true)::json->> 'app_role' = 'GESTOR'
    );
