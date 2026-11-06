import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Trash2, Mic, Keyboard } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { RegistrarRefeicao } from "@/components/RegistrarRefeicao";
import { perfilQuery } from "@/lib/profile";
import { registrosDoDiaQuery } from "@/lib/registros";
import { hojeISO } from "@/lib/diario";
import { LIMITES_METAS } from "@/lib/config";

export const Route = createFileRoute("/_authenticated/hoje")({
  head: () => ({ meta: [{ title: "Hoje — Bocada" }, { name: "robots", content: "noindex" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(perfilQuery),
  component: Hoje,
});

const MACROS = ["kcal", "carboidratos_g", "proteinas_g", "gorduras_g"] as const;

function Hoje() {
  const { data } = useSuspenseQuery(perfilQuery);
  const qc = useQueryClient();
  const consent = !!data.perfil?.consentimento_saude_em;
  const dia = hojeISO();
  const { data: registros = [] } = useQuery({ ...registrosDoDiaQuery(dia), enabled: consent });

  if (!data.perfil?.onboarding_concluido) return <Navigate to="/onboarding" replace />;
  const metas = data.metas;

  const total = Object.fromEntries(
    MACROS.map((k) => [k, Math.round(registros.reduce((s, r) => s + Number(r[k]), 0))]),
  ) as Record<(typeof MACROS)[number], number>;

  async function apagar(id: string) {
    const { error } = await supabase.from("registros").delete().eq("id", id);
    if (error) return void toast.error("Não foi possível apagar.");
    qc.invalidateQueries({ queryKey: ["registros"] });
  }

  if (!consent)
    return (
      <AppShell>
        <section className="mt-4 rounded-2xl border bg-surface p-6 text-center">
          <p className="font-medium">Para registrar refeições, é preciso autorizar o tratamento de dados de saúde.</p>
          <Link to="/configuracoes" className="mt-4 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
            Ir para Configurações
          </Link>
        </section>
      </AppShell>
    );

  return (
    <AppShell>
      <RegistrarRefeicao userId={data.user.id} />

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-muted-foreground">Resumo do dia</h2>
        <ul className="mt-3 grid grid-cols-2 gap-3">
          {MACROS.map((k) => (
            <li key={k} className="rounded-2xl border bg-surface p-4">
              <p className="text-xs text-muted-foreground">{LIMITES_METAS[k].nome}</p>
              <p className="mt-1 text-lg font-semibold">
                {total[k].toLocaleString("pt-BR")}
                <span className="text-sm font-normal text-muted-foreground">
                  {metas?.[k] != null ? ` / ${metas[k]!.toLocaleString("pt-BR")}` : ""} {LIMITES_METAS[k].unidade}
                </span>
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-muted-foreground">Registrado hoje</h2>
        {registros.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Nada registrado ainda.</p>
        ) : (
          <ul className="mt-3 divide-y rounded-2xl border bg-surface">
            {registros.map((r) => (
              <li key={r.id} className="flex items-center gap-3 p-3">
                {r.origem === "voz" ? <Mic className="h-4 w-4 shrink-0 text-muted-foreground" aria-label="Por voz" /> : <Keyboard className="h-4 w-4 shrink-0 text-muted-foreground" aria-label="Digitado" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.descricao}</p>
                  <p className="text-xs text-muted-foreground">{Number(r.gramas)} g · {Math.round(Number(r.kcal))} kcal</p>
                </div>
                <button aria-label={`Apagar ${r.descricao}`} onClick={() => apagar(r.id)} className="p-1 text-muted-foreground">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
