DROP INDEX IF EXISTS public.alimentos_usda_busca_trgm;
CREATE INDEX alimentos_usda_busca_trgm ON public.alimentos_usda USING gin (busca extensions.gin_trgm_ops) WITH (fastupdate = off);
ANALYZE public.alimentos_usda;