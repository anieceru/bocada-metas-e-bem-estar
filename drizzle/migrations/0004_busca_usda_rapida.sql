CREATE INDEX IF NOT EXISTS alimentos_usda_gtin_idx ON public.alimentos_usda (gtin_upc);
ANALYZE public.alimentos_usda;
CREATE OR REPLACE FUNCTION public.buscar_usda(termo text)
RETURNS SETOF public.alimentos_usda
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = public, extensions
AS $$
DECLARE t text := lower(trim(termo)); pat text;
BEGIN
  IF length(t) < 2 THEN RETURN; END IF;
  IF t ~ '^\d{8,14}$' THEN
    RETURN QUERY SELECT * FROM public.alimentos_usda u WHERE u.gtin_upc = t ORDER BY u.fdc_id DESC LIMIT 12;
    RETURN;
  END IF;
  pat := '%' || replace(regexp_replace(t, '\s+', ' ', 'g'), ' ', '%') || '%';
  RETURN QUERY SELECT c.* FROM (SELECT * FROM public.alimentos_usda u WHERE u.busca LIKE pat LIMIT 300) c
    ORDER BY length(c.descricao), c.fdc_id DESC LIMIT 12;
END $$;
REVOKE ALL ON FUNCTION public.buscar_usda(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.buscar_usda(text) TO authenticated, service_role;
CREATE OR REPLACE FUNCTION public.buscar_alimentos_catalogo(q text, fonte text DEFAULT 'taco')
RETURNS TABLE (id bigint, descricao text, kcal numeric, proteina_g numeric, lipideos_g numeric, carboidrato_g numeric, fonte text, marca text, gtin_upc text)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public
AS $$
 SELECT a.id::bigint, a.descricao, a.kcal::numeric, a.proteina_g::numeric, a.lipideos_g::numeric, a.carboidrato_g::numeric, 'taco'::text, null::text, null::text
 FROM public.buscar_alimentos(q) a WHERE fonte = 'taco' AND length(trim(q)) >= 2
 UNION ALL
 SELECT u.fdc_id, u.descricao, u.kcal, u.proteina_g, u.lipideos_g, u.carboidrato_g, 'usda'::text, u.marca, u.gtin_upc
 FROM public.buscar_usda(q) u WHERE fonte = 'usda'
$$;
REVOKE ALL ON FUNCTION public.buscar_alimentos_catalogo(text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.buscar_alimentos_catalogo(text,text) TO authenticated, service_role;