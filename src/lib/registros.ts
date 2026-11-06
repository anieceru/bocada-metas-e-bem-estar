import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const registrosDoDiaQuery = (dia: string) =>
  queryOptions({
    queryKey: ["registros", "dia", dia],
    queryFn: async () => {
      const { data, error } = await supabase.from("registros").select("*").eq("dia", dia).order("criado_em");
      if (error) throw new Error("Não foi possível carregar os registros.");
      return data;
    },
  });

export const historicoQuery = queryOptions({
  queryKey: ["registros", "historico"],
  queryFn: async () => {
    const desde = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("registros")
      .select("dia, kcal, carboidratos_g, proteinas_g, gorduras_g")
      .gte("dia", desde)
      .order("dia", { ascending: false });
    if (error) throw new Error("Não foi possível carregar o histórico.");
    const porDia = new Map<string, { dia: string; itens: number; kcal: number; carboidratos_g: number; proteinas_g: number; gorduras_g: number }>();
    for (const r of data) {
      const d = porDia.get(r.dia) ?? { dia: r.dia, itens: 0, kcal: 0, carboidratos_g: 0, proteinas_g: 0, gorduras_g: 0 };
      d.itens++; d.kcal += Number(r.kcal); d.carboidratos_g += Number(r.carboidratos_g);
      d.proteinas_g += Number(r.proteinas_g); d.gorduras_g += Number(r.gorduras_g);
      porDia.set(r.dia, d);
    }
    return [...porDia.values()];
  },
});
