CREATE TABLE public.consentimentos_ia (
 user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
 autorizado_em timestamptz NOT NULL DEFAULT now(),
 versao text NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consentimentos_ia TO authenticated;
GRANT ALL ON public.consentimentos_ia TO service_role;
ALTER TABLE public.consentimentos_ia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dono acessa autorizacao IA" ON public.consentimentos_ia FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.consentimento_saude_em IS NOT NULL));