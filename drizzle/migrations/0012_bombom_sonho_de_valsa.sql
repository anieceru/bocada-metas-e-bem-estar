INSERT INTO public.alimentos_brasil (ean, descricao, marca, busca, kcal, proteina_g, lipideos_g, carboidrato_g) VALUES
  (78939301, 'Bombom Sonho de Valsa', 'Sonho de Valsa · Lacta', 'bombom chocolate sonho de valsa lacta', 520, 5, 26, 65)
ON CONFLICT (ean) DO NOTHING;