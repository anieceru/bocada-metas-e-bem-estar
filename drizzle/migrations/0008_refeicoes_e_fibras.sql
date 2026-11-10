ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS refeicoes text[] NOT NULL DEFAULT ARRAY['Café da manhã','Almoço','Jantar','Lanches'];
ALTER TABLE public.registros ADD COLUMN IF NOT EXISTS refeicao text NOT NULL DEFAULT 'Lanches';
ALTER TABLE public.registros ADD COLUMN IF NOT EXISTS fibra_g numeric;
UPDATE public.registros r SET fibra_g = round(a.fibra_g * r.gramas / 100, 1) FROM public.alimentos_taco a WHERE r.alimento_id = a.id;
CREATE OR REPLACE FUNCTION public.registro_fibra() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$ BEGIN
IF NEW.alimento_id IS NOT NULL THEN SELECT round(a.fibra_g * NEW.gramas / 100, 1) INTO NEW.fibra_g FROM public.alimentos_taco a WHERE a.id=NEW.alimento_id; ELSE NEW.fibra_g := NULL; END IF;
IF length(trim(NEW.refeicao)) NOT BETWEEN 1 AND 60 THEN RAISE EXCEPTION 'Refeição inválida'; END IF;
RETURN NEW; END $$;
CREATE TRIGGER registro_fibra_guard BEFORE INSERT OR UPDATE ON public.registros FOR EACH ROW EXECUTE FUNCTION public.registro_fibra();