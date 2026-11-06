ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS limites_alerta jsonb;

CREATE TABLE public.alimentos_taco (
  id int PRIMARY KEY,
  descricao text NOT NULL,
  categoria text,
  busca text NOT NULL,
  kcal numeric,
  proteina_g numeric,
  lipideos_g numeric,
  carboidrato_g numeric,
  fibra_g numeric
);
CREATE INDEX alimentos_taco_busca_idx ON public.alimentos_taco (busca);
GRANT SELECT ON public.alimentos_taco TO authenticated;
GRANT ALL ON public.alimentos_taco TO service_role;
ALTER TABLE public.alimentos_taco ENABLE ROW LEVEL SECURITY;
CREATE POLICY "taco leitura" ON public.alimentos_taco FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.buscar_alimentos(q text)
RETURNS SETOF public.alimentos_taco LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT a.* FROM public.alimentos_taco a
  WHERE NOT EXISTS (
    SELECT 1 FROM unnest(string_to_array(lower(trim(q)), ' ')) w
    WHERE length(w) > 1 AND a.busca NOT LIKE '%' || w || '%'
  )
  ORDER BY (a.busca LIKE '%cozid%' OR a.busca LIKE '%cru%') DESC, length(a.descricao)
  LIMIT 8
$$;
REVOKE EXECUTE ON FUNCTION public.buscar_alimentos(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.buscar_alimentos(text) TO authenticated;

CREATE TABLE public.registros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  dia date NOT NULL,
  alimento_id int REFERENCES public.alimentos_taco(id),
  descricao text NOT NULL CHECK (length(descricao) BETWEEN 1 AND 200),
  gramas numeric NOT NULL CHECK (gramas > 0 AND gramas <= 5000),
  kcal numeric NOT NULL DEFAULT 0,
  carboidratos_g numeric NOT NULL DEFAULT 0,
  proteinas_g numeric NOT NULL DEFAULT 0,
  gorduras_g numeric NOT NULL DEFAULT 0,
  origem text NOT NULL DEFAULT 'digitado' CHECK (origem IN ('voz','digitado')),
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX registros_user_dia_idx ON public.registros (user_id, dia);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.registros TO authenticated;
GRANT ALL ON public.registros TO service_role;
ALTER TABLE public.registros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own registros select" ON public.registros FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own registros insert" ON public.registros FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.tem_consentimento_saude(auth.uid()));
CREATE POLICY "own registros update" ON public.registros FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND public.tem_consentimento_saude(auth.uid()));
CREATE POLICY "own registros delete" ON public.registros FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.profiles_consent_revoked()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.consentimento_saude_em IS NOT NULL AND NEW.consentimento_saude_em IS NULL THEN
    DELETE FROM public.metas WHERE user_id = NEW.id;
    DELETE FROM public.registros WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END $$;