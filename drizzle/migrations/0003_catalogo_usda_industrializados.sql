CREATE TABLE public.alimentos_usda (
 fdc_id bigint PRIMARY KEY,
 descricao text NOT NULL,
 marca text,
 gtin_upc text,
 categoria text,
 busca text NOT NULL,
 kcal numeric NOT NULL CHECK (kcal >= 0),
 proteina_g numeric NOT NULL CHECK (proteina_g >= 0),
 lipideos_g numeric NOT NULL CHECK (lipideos_g >= 0),
 carboidrato_g numeric NOT NULL CHECK (carboidrato_g >= 0),
 edicao text NOT NULL DEFAULT '2026-10-29'
);
GRANT SELECT ON public.alimentos_usda TO authenticated;
GRANT ALL ON public.alimentos_usda TO service_role;
ALTER TABLE public.alimentos_usda ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Catalogo USDA pode ser consultado" ON public.alimentos_usda FOR SELECT TO authenticated USING (true);
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
CREATE INDEX alimentos_usda_busca_trgm ON public.alimentos_usda USING gin (busca extensions.gin_trgm_ops);
ALTER TABLE public.registros ADD COLUMN usda_fdc_id bigint REFERENCES public.alimentos_usda(fdc_id);
CREATE OR REPLACE FUNCTION public.buscar_alimentos_catalogo(q text, fonte text DEFAULT 'taco')
RETURNS TABLE (id bigint, descricao text, kcal numeric, proteina_g numeric, lipideos_g numeric, carboidrato_g numeric, fonte text, marca text, gtin_upc text)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $$
 SELECT a.id::bigint, a.descricao, a.kcal::numeric, a.proteina_g::numeric, a.lipideos_g::numeric, a.carboidrato_g::numeric, 'taco'::text, null::text, null::text
 FROM public.buscar_alimentos(q) a WHERE fonte = 'taco' AND length(trim(q)) >= 2
 UNION ALL
 SELECT u.fdc_id, u.descricao, u.kcal, u.proteina_g, u.lipideos_g, u.carboidrato_g, 'usda'::text, u.marca, u.gtin_upc
 FROM (
  SELECT a.* FROM public.alimentos_usda a
  WHERE fonte = 'usda' AND length(trim(q)) >= 2
   AND a.busca LIKE '%' || lower(trim(q)) || '%'
  ORDER BY (a.gtin_upc = trim(q)) DESC, length(a.descricao), a.fdc_id DESC
  LIMIT 12
 ) u
$$;
REVOKE ALL ON FUNCTION public.buscar_alimentos_catalogo(text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.buscar_alimentos_catalogo(text,text) TO authenticated, service_role;