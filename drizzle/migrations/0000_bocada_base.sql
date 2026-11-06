CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  idade int CHECK (idade IS NULL OR (idade >= 18 AND idade <= 120)),
  peso_kg numeric(5,1) CHECK (peso_kg IS NULL OR (peso_kg > 20 AND peso_kg < 400)),
  altura_cm numeric(5,1) CHECK (altura_cm IS NULL OR (altura_cm > 80 AND altura_cm < 260)),
  sexo text CHECK (sexo IS NULL OR sexo IN ('feminino','masculino','outro')),
  objetivo text CHECK (objetivo IS NULL OR objetivo IN ('emagrecer','manter','ganhar')),
  tom text NOT NULL DEFAULT 'neutro' CHECK (tom IN ('neutro','animado')),
  tema text NOT NULL DEFAULT 'sistema' CHECK (tema IN ('claro','escuro','sistema')),
  copo_ml int NOT NULL DEFAULT 200 CHECK (copo_ml BETWEEN 50 AND 2000),
  consentimento_saude_em timestamptz,
  consentimento_saude_versao text,
  onboarding_concluido boolean NOT NULL DEFAULT false,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile delete" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = id);

CREATE TABLE public.metas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  kcal int CHECK (kcal IS NULL OR kcal BETWEEN 0 AND 20000),
  carboidratos_g int CHECK (carboidratos_g IS NULL OR carboidratos_g BETWEEN 0 AND 3000),
  proteinas_g int CHECK (proteinas_g IS NULL OR proteinas_g BETWEEN 0 AND 3000),
  gorduras_g int CHECK (gorduras_g IS NULL OR gorduras_g BETWEEN 0 AND 3000),
  agua_ml int CHECK (agua_ml IS NULL OR agua_ml BETWEEN 0 AND 20000),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.metas TO authenticated;
GRANT ALL ON public.metas TO service_role;
ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.tem_consentimento_saude(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _uid AND consentimento_saude_em IS NOT NULL)
$$;
CREATE POLICY "own metas select" ON public.metas FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own metas insert" ON public.metas FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.tem_consentimento_saude(auth.uid()));
CREATE POLICY "own metas update" ON public.metas FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND public.tem_consentimento_saude(auth.uid()));
CREATE POLICY "own metas delete" ON public.metas FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Sem consentimento: dados de saúde nunca ficam guardados
CREATE OR REPLACE FUNCTION public.profiles_guard()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.atualizado_em := now();
  IF NEW.consentimento_saude_em IS NULL THEN
    NEW.idade := NULL; NEW.peso_kg := NULL; NEW.altura_cm := NULL;
    NEW.sexo := NULL; NEW.objetivo := NULL; NEW.consentimento_saude_versao := NULL;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER profiles_guard BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.profiles_guard();

CREATE OR REPLACE FUNCTION public.profiles_consent_revoked()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.consentimento_saude_em IS NOT NULL AND NEW.consentimento_saude_em IS NULL THEN
    DELETE FROM public.metas WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER profiles_consent_revoked AFTER UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.profiles_consent_revoked();

CREATE OR REPLACE FUNCTION public.metas_touch()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.atualizado_em := now(); RETURN NEW; END $$;
CREATE TRIGGER metas_touch BEFORE UPDATE ON public.metas FOR EACH ROW EXECUTE FUNCTION public.metas_touch();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

REVOKE EXECUTE ON FUNCTION public.tem_consentimento_saude(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.tem_consentimento_saude(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.profiles_consent_revoked() FROM anon, authenticated, public;