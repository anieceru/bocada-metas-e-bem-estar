import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { historicoQuery } from "@/lib/registros";

export const Route = createFileRoute("/_authenticated/historico")({
  head: () => ({ meta: [{ title: "Histórico — Bocada" }, { name: "robots", content: "noindex" }] }),
  component: Historico,
});

function Historico() {
  const { data = [], isPending } = useQuery(historicoQuery);
  return (
    <AppShell titulo="Histórico (últimos 30 dias)">
      {!isPending && data.length === 0 ? (
        <div className="mt-10 text-center text-muted-foreground">
          <History className="mx-auto h-8 w-8" aria-hidden />
          <p className="mt-3 text-sm">Seu histórico vai aparecer aqui.</p>
        </div>
      ) : (
        <ul className="mt-2 space-y-3">
          {data.map((d) => (
            <li key={d.dia} className="rounded-2xl border bg-surface p-4">
              <p className="text-sm font-semibold capitalize">
                {new Date(d.dia + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "short" })}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {Math.round(d.kcal)} kcal · C {Math.round(d.carboidratos_g)} g · P {Math.round(d.proteinas_g)} g · G {Math.round(d.gorduras_g)} g · {d.itens} {d.itens === 1 ? "item" : "itens"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
