CREATE OR REPLACE FUNCTION public.buscar_alimentos(q text)
RETURNS SETOF public.alimentos_taco LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT a.* FROM public.alimentos_taco a
  WHERE NOT EXISTS (
    SELECT 1 FROM unnest(string_to_array(lower(trim(q)), ' ')) w
    WHERE length(w) > 1 AND a.busca NOT LIKE '%' || w || '%'
  )
  ORDER BY (a.busca LIKE split_part(lower(trim(q)), ' ', 1) || '%') DESC,
           (a.busca LIKE '%cozid%' OR a.busca LIKE '%crua%' AND a.categoria = 'Frutas e derivados') DESC,
           length(a.descricao)
  LIMIT 8
$$;