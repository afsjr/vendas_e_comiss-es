ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura pessoal" ON public.perfis
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Leitura gestor ou auditor" ON public.perfis
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.perfis AS p 
            WHERE p.id = auth.uid() AND p.role IN ('GESTOR', 'AUDITOR')
        )
    );

CREATE POLICY "Update gestor" ON public.perfis
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.perfis AS p 
            WHERE p.id = auth.uid() AND p.role = 'GESTOR'
        )
    );
