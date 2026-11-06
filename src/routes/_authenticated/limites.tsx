import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { perfilQuery } from "@/lib/profile";
import { CHAVES_LIMITES_AJUSTAVEIS, LIMITES_METAS, limitesEfetivos } from "@/lib/config";
import { privatePageHead } from "@/lib/page-head";

export const Route = createFileRoute("/_authenticated/limites")({
  head: () => privatePageHead("Limites de alerta", "Ajuste seus limites de alerta para macros e água no Bocada."),
  loader: ({ context }) => context.queryClient.ensureQueryData(perfilQuery),
  component: Limites,
});

function Limites() {
  const { data } = useSuspenseQuery(perfilQuery);
  const qc = useQueryClient();
  const atuais = limitesEfetivos(data.perfil?.limites_alerta);
  const [vals, setVals] = useState(
    Object.fromEntries(CHAVES_LIMITES_AJUSTAVEIS.map((k) => [k, { min: String(atuais[k].min), max: String(atuais[k].max) }])),
  );

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    const out: Record<string, { min: number; max: number }> = {};
    for (const k of CHAVES_LIMITES_AJUSTAVEIS) {
      const min = Number(vals[k]!.min), max = Number(vals[k]!.max);
      if (!(min >= 0 && max > min)) return void toast.error(`${LIMITES_METAS[k].nome}: o máximo precisa ser maior que o mínimo.`);
      out[k] = { min, max };
    }
    const { error } = await supabase.from("profiles").update({ limites_alerta: out }).eq("id", data.user.id);
    if (error) return void toast.error("Não foi possível salvar.");
    toast.success("Limites salvos.");
    qc.invalidateQueries({ queryKey: ["perfil"] });
  }

  async function restaurar() {
    await supabase.from("profiles").update({ limites_alerta: null }).eq("id", data.user.id);
    setVals(Object.fromEntries(CHAVES_LIMITES_AJUSTAVEIS.map((k) => [k, { min: String(LIMITES_METAS[k].min), max: String(LIMITES_METAS[k].max) }])));
    qc.invalidateQueries({ queryKey: ["perfil"] });
    toast.success("Valores padrão restaurados.");
  }

  return (
    <AppShell titulo="Limites de alerta">
      <p className="text-sm text-muted-foreground">
        Ao salvar uma meta fora destas faixas, o app pede uma confirmação. O limite de calorias (1.200 a 4.500 kcal) é fixo.
      </p>
      <form onSubmit={salvar} className="mt-5 space-y-4">
        {CHAVES_LIMITES_AJUSTAVEIS.map((k) => (
          <fieldset key={k} className="rounded-2xl border bg-surface p-4">
            <legend className="px-1 text-sm font-semibold">{LIMITES_METAS[k].nome} ({LIMITES_METAS[k].unidade})</legend>
            <div className="grid grid-cols-2 gap-3">
              {(["min", "max"] as const).map((lado) => (
                <label key={lado} className="space-y-1 text-xs text-muted-foreground">
                  {lado === "min" ? "Mínimo" : "Máximo"}
                  <Input inputMode="numeric" value={vals[k]![lado]} onChange={(e) => setVals({ ...vals, [k]: { ...vals[k]!, [lado]: e.target.value.replace(/\D/g, "") } })} />
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <Button type="submit" className="h-11 w-full rounded-xl">Salvar limites</Button>
        <Button type="button" variant="ghost" className="w-full rounded-xl" onClick={restaurar}>Restaurar padrão</Button>
        <Link to="/configuracoes" className="block text-center text-sm text-primary underline">Voltar para Configurações</Link>
      </form>
    </AppShell>
  );
}
