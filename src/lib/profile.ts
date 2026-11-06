import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const perfilQuery = queryOptions({
  queryKey: ["perfil"],
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw new Error("Sem sessão");
    const [{ data: perfil, error: e1 }, { data: metas, error: e2 }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle(),
      supabase.from("metas").select("*").eq("user_id", u.user.id).maybeSingle(),
    ]);
    if (e1 || e2) throw new Error("Não foi possível carregar seus dados.");
    return { user: u.user, perfil, metas };
  },
});
