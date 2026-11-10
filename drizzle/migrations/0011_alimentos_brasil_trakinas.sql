CREATE TABLE public.alimentos_brasil (
  ean bigint PRIMARY KEY,
  descricao text NOT NULL,
  marca text,
  busca text NOT NULL,
  kcal numeric,
  proteina_g numeric,
  lipideos_g numeric,
  carboidrato_g numeric
);
GRANT SELECT ON public.alimentos_brasil TO authenticated;
GRANT ALL ON public.alimentos_brasil TO service_role;
ALTER TABLE public.alimentos_brasil ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Alimentos Brasil visíveis a autenticados" ON public.alimentos_brasil FOR SELECT TO authenticated USING (true);

INSERT INTO public.alimentos_brasil (ean, descricao, marca, busca, kcal, proteina_g, lipideos_g, carboidrato_g) VALUES
  (7622210592729, 'Biscoito recheado', 'Trakinas', 'biscoito recheado trakinas traquinas bolacha', 480, 5, 19, 70),
  (7622210592637, 'Biscoito recheado meio a meio (chocolate e morango)', 'Trakinas', 'biscoito recheado meio a meio chocolate morango trakinas traquinas bolacha', 477, 5.3, 18.3, 70),
  (7622300741297, 'Biscoito recheado sabor chocolate e chocolate branco', 'Trakinas', 'biscoito recheado chocolate chocolate branco trakinas traquinas bolacha', 473.3, 6, 18.7, 70),
  (7622210573933, 'Biscoito recheado tortinha de limão', 'Trakinas', 'biscoito recheado tortinha limao trakinas traquinas bolacha', 458, 5.7, 17, 70);

ALTER TABLE public.registros ADD COLUMN br_ean bigint;

CREATE OR REPLACE FUNCTION public.buscar_brasil(termo text)
RETURNS SETOF public.alimentos_brasil
LANGUAGE plpgsql STABLE
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE t text := lower(trim(termo)); pat text;
BEGIN
  IF length(t) < 2 THEN RETURN; END IF;
  IF t ~ '^\d{8,14}$' THEN
    RETURN QUERY SELECT * FROM public.alimentos_brasil b WHERE b.ean = t::bigint LIMIT 12;
    RETURN;
  END IF;
  pat := '%' || replace(regexp_replace(t, '\s+', ' ', 'g'), ' ', '%') || '%';
  RETURN QUERY SELECT c.* FROM (SELECT * FROM public.alimentos_brasil b WHERE b.busca LIKE pat LIMIT 300) c
    ORDER BY length(c.descricao), c.ean DESC LIMIT 12;
END
$function$;

CREATE OR REPLACE FUNCTION public.buscar_alimentos_catalogo(q text, fonte text DEFAULT 'taco'::text)
RETURNS TABLE(id bigint, descricao text, kcal numeric, proteina_g numeric, lipideos_g numeric, carboidrato_g numeric, fonte text, marca text, gtin_upc text)
LANGUAGE sql STABLE
SET search_path TO 'public'
AS $function$
 SELECT a.id::bigint, a.descricao, a.kcal::numeric, a.proteina_g::numeric, a.lipideos_g::numeric, a.carboidrato_g::numeric, 'taco'::text, null::text, null::text
 FROM public.buscar_alimentos(q) a WHERE fonte = 'taco' AND length(trim(q)) >= 2
 UNION ALL
 SELECT u.fdc_id, u.descricao, u.kcal, u.proteina_g, u.lipideos_g, u.carboidrato_g, 'usda'::text, u.marca, u.gtin_upc
 FROM public.buscar_usda(q) u WHERE fonte = 'usda'
 UNION ALL
 SELECT b.ean, b.descricao, b.kcal, b.proteina_g, b.lipideos_g, b.carboidrato_g, 'br'::text, b.marca, b.ean::text
 FROM public.buscar_brasil(q) b WHERE fonte = 'br'
$function$;