import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import { horaLocal, lembretesDaHora, type PrefsNotificacao } from "@/lib/notificacoes";
import { REFEICOES_PADRAO } from "@/lib/calendario";

export const Route = createFileRoute("/api/public/jobs/lembretes")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authFailure = await authenticateCronRequest(request);
        if (authFailure) return authFailure;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { enviarPush } = await import("@/lib/push.server");
        const { data: prefs, error } = await supabaseAdmin.from("notificacao_preferencias")
          .select("user_id,modo,refeicoes,agua,alertas,hora_diaria,horas_refeicoes,fuso").neq("modo", "nenhuma").eq("canal_push", true);
        if (error) return Response.json({ ok: false }, { status: 500 });
        let enviados = 0;
        const agora = new Date();
        for (const p of prefs ?? []) {
          const { hora, dia } = horaLocal(agora, p.fuso);
          const { data: perfil } = await supabaseAdmin.from("profiles").select("refeicoes").eq("id", p.user_id).maybeSingle();
          const lista = lembretesDaHora({ ...p, horas_refeicoes: (p.horas_refeicoes ?? {}) as Record<string, number> } as PrefsNotificacao, hora, dia, perfil?.refeicoes?.length ? perfil.refeicoes : REFEICOES_PADRAO);
          if (!lista.length) continue;
          const { data: devs } = await supabaseAdmin.from("dispositivos_push").select("id,token").eq("user_id", p.user_id);
          if (!devs?.length) continue;
          for (const l of lista) {
            const { error: dup } = await supabaseAdmin.from("notificacoes_enviadas").insert({ user_id: p.user_id, chave: l.chave });
            if (dup) continue;
            for (const d of devs) {
              try {
                const ok = await enviarPush(d.token, l.titulo, l.corpo, l.caminho);
                if (ok) enviados++; else await supabaseAdmin.from("dispositivos_push").delete().eq("id", d.id);
              } catch (e) { console.error("Falha ao enviar lembrete", e instanceof Error ? e.message : "erro"); }
            }
          }
        }
        await supabaseAdmin.from("notificacoes_enviadas").delete().lt("enviada_em", new Date(Date.now() - 3 * 86400000).toISOString());
        return Response.json({ ok: true, enviados });
      },
    },
  },
});