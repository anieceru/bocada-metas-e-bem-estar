import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Mic } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { perfilQuery } from "@/lib/profile";
import { CHAVES_METAS, LIMITES_METAS } from "@/lib/config";

export const Route = createFileRoute("/_authenticated/hoje")({
  head: () => ({ meta: [{ title: "Hoje — Bocada" }, { name: "robots", content: "noindex" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(perfilQuery),
  component: Hoje,
});

function Hoje() {
  const { data } = useSuspenseQuery(perfilQuery);
  if (!data.perfil?.onboarding_concluido) return <Navigate to="/onboarding" replace />;
  const metas = data.metas;
  const definidas = metas ? CHAVES_METAS.filter((k) => metas[k] != null) : [];

  return (
    <AppShell>
      <section className="mt-4 rounded-2xl border bg-surface p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destaque-suave">
          <Mic className="h-6 w-6 text-destaque-foreground dark:text-destaque" aria-hidden />
        </div>
        <p className="mt-4 text-base font-medium">
          Em breve você vai poder falar o que comeu e eu registro por você.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-muted-foreground">Metas do dia</h2>
        {definidas.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Nenhuma meta definida. Você pode definir em Configurações.
          </p>
        ) : (
          <ul className="mt-3 grid grid-cols-2 gap-3">
            {definidas.map((k) => (
              <li key={k} className="rounded-2xl border bg-surface p-4">
                <p className="text-xs text-muted-foreground">{LIMITES_METAS[k].nome}</p>
                <p className="mt-1 text-lg font-semibold">
                  {metas![k]!.toLocaleString("pt-BR")} <span className="text-sm font-normal">{LIMITES_METAS[k].unidade}</span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
