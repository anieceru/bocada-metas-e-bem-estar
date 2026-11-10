import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { hojeISO } from "@/lib/diario";
import { metasUltrapassadas } from "@/lib/notificacoes";

/** Após registrar comida: avisa uma vez por dia se alguma meta foi ultrapassada. */
export const verificarAlertaMetas = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { dia: string }) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d?.dia ?? "")) throw new Error("Dia inválido");
    return { dia: d.dia };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const [{ data: prefs }, { data: metas }, { data: registros }] = await Promise.all([
      supabase.from("notificacao_preferencias").select("modo,alertas,canal_push").eq("user_id", userId).maybeSingle(),
      supabase.from("metas").select("kcal,carboidratos_g,proteinas_g,gorduras_g").eq("user_id", userId).maybeSingle(),
      supabase.from("registros").select("kcal,carboidratos_g,proteinas_g,gorduras_g").eq("dia", data.dia),
    ]);
    if (!metas || !registros) return { passou: false };
    const totais = { kcal: 0, carboidratos_g: 0, proteinas_g: 0, gorduras_g: 0 };
    for (const r of registros) for (const k of Object.keys(totais) as (keyof typeof totais)[]) totais[k] += Number(r[k]);
    const passou = metasUltrapassadas(totais, metas).length > 0;
    // Só envia notificação para o dia atual, com preferências ativadas.
    if (!passou || data.dia !== hojeISO() || !prefs || prefs.modo !== "personalizada" || !prefs.alertas || !prefs.canal_push) return { passou };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: dup } = await supabaseAdmin.from("notificacoes_enviadas").insert({ user_id: userId, chave: `${data.dia}:alerta` });
    if (dup) return { passou };
    const { enviarPush } = await import("@/lib/push.server");
    const { data: devs } = await supabaseAdmin.from("dispositivos_push").select("id,token").eq("user_id", userId);
    for (const d of devs ?? []) {
      try {
        const ok = await enviarPush(d.token, "Bocada", "Você passou de uma meta de hoje. Veja ideias para seguir com leveza.", "/limites#lidar");
        if (!ok) await supabaseAdmin.from("dispositivos_push").delete().eq("id", d.id);
      } catch (e) { console.error("Falha ao enviar alerta", e instanceof Error ? e.message : "erro"); }
    }
    return { passou };
  });