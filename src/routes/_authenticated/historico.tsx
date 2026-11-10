import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { hojeISO } from "@/lib/diario";
import { privatePageHead } from "@/lib/page-head";

const METRICAS = [{ key: "kcal", nome: "Calorias", unidade: "kcal" }, { key: "carboidratos_g", nome: "Carbos", unidade: "g" }, { key: "proteinas_g", nome: "Proteínas", unidade: "g" }, { key: "gorduras_g", nome: "Gorduras", unidade: "g" }, { key: "fibra_g", nome: "Fibras (dados disponíveis)", unidade: "g" }] as const;
function consultaMes(mes: string) {
  const d = new Date(`${mes}-01T12:00:00`); d.setMonth(d.getMonth() + 1);
  return queryOptions({ queryKey: ["registros", "mes", mes], queryFn: async () => {
    const { data, error } = await supabase.from("registros").select("dia,kcal,carboidratos_g,proteinas_g,gorduras_g,fibra_g").gte("dia", `${mes}-01`).lt("dia", hojeISO(d)).order("dia");
    if (error) throw new Error("Não foi possível carregar o mês.");
    return data;
  } });
}
export const Route = createFileRoute("/_authenticated/historico")({
  head: () => privatePageHead("Evolução mensal", "Veja seu calendário e a evolução dos registros nutricionais no Bocada."),
  validateSearch: (s: Record<string, unknown>): { mes?: string } => typeof s['mes'] === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(s['mes']) ? { mes: s['mes'] } : {},
  loaderDeps: ({ search }) => ({ mes: search.mes ?? hojeISO().slice(0, 7) }),
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(consultaMes(deps.mes)),
  component: Historico,
});
function Historico() {
  const { mes } = Route.useLoaderDeps();
  const navigate = Route.useNavigate();
  const { data } = useSuspenseQuery(consultaMes(mes));
  const primeiro = new Date(`${mes}-01T12:00:00`);
  const numeroDias = new Date(primeiro.getFullYear(), primeiro.getMonth() + 1, 0).getDate();
  const dias = Array.from({ length: numeroDias }, (_, i) => `${mes}-${String(i + 1).padStart(2, "0")}`);
  const registrados = dias.filter((d) => data.some((r) => r.dia === d));
  function mudar(delta: number) { const d = new Date(primeiro); d.setMonth(d.getMonth() + delta); navigate({ search: { mes: hojeISO(d).slice(0, 7) } }); }
  return <AppShell titulo="Evolução mensal">
    <div className="flex items-center justify-between"><Button variant="ghost" size="icon" aria-label="Mês anterior" onClick={() => mudar(-1)}><ChevronLeft className="h-4 w-4" /></Button><h1 className="text-base font-semibold capitalize">{primeiro.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</h1><Button variant="ghost" size="icon" aria-label="Próximo mês" onClick={() => mudar(1)}><ChevronRight className="h-4 w-4" /></Button></div>
    <div className="mt-4 grid grid-cols-7 gap-1">
      {["seg", "ter", "qua", "qui", "sex", "sáb", "dom"].map((s) => <span key={s} className="py-1 text-center text-xs text-muted-foreground">{s}</span>)}
      {Array.from({ length: (primeiro.getDay() + 6) % 7 }, (_, i) => <span key={`vazio-${i}`} />)}
      {dias.map((dia) => <Button key={dia} asChild variant={dia === hojeISO() ? "default" : "ghost"} className="h-11 min-w-0 flex-col gap-0 px-0"><Link to="/hoje" search={{ dia }} aria-label={`Abrir dia ${dia}`}><span>{Number(dia.slice(-2))}</span>{registrados.includes(dia) && <span className="text-[10px] leading-3" aria-label="Com registros">•</span>}</Link></Button>)}
    </div>
    <section className="mt-6 border-t pt-5"><h2 className="text-base font-semibold">Métricas do mês</h2><p className="mt-1 text-sm text-muted-foreground">{registrados.length} dias com registros. Médias consideram apenas esses dias.</p>
      <dl className="mt-3 divide-y">{METRICAS.map(({ key, nome, unidade }) => {
        const disponiveis = data.filter((r) => r[key] != null);
        const quantidadeDias = new Set(disponiveis.map((r) => r.dia)).size;
        const total = disponiveis.reduce((s, r) => s + Number(r[key]), 0);
        return <div key={key} className="flex justify-between gap-3 py-3 text-sm"><dt>{nome}</dt><dd className="text-right font-medium">{quantidadeDias ? `${Math.round(total / quantidadeDias).toLocaleString("pt-BR")} ${unidade}/dia` : "—"}</dd></div>;
      })}</dl>
      <details className="mt-3 text-sm"><summary className="cursor-pointer font-medium">Micronutrientes · ver mais</summary><p className="mt-2 text-muted-foreground">Vitaminas e minerais não estão disponíveis nos dados importados. Fibras podem ter totais parciais.</p></details>
    </section>
    <section className="mt-6 border-t pt-5"><h2 className="font-semibold">Evolução por dia</h2>{!registrados.length ? <p className="mt-3 text-sm text-muted-foreground">Nenhum registro neste mês.</p> : <div className="mt-3 overflow-x-auto"><table className="w-full text-right text-xs"><thead><tr className="text-muted-foreground"><th className="p-2 text-left">Dia</th><th className="p-2">kcal</th><th className="p-2">Carbos g</th><th className="p-2">Proteínas g</th><th className="p-2">Gorduras g</th></tr></thead><tbody>{registrados.map((dia) => <tr key={dia} className="border-t"><td className="p-2 text-left"><Link to="/hoje" search={{ dia }} className="text-primary underline">{Number(dia.slice(-2))}</Link></td>{METRICAS.slice(0, 4).map(({ key }) => <td key={key} className="p-2">{Math.round(data.filter((r) => r.dia === dia).reduce((s, r) => s + Number(r[key]), 0))}</td>)}</tr>)}</tbody></table></div>}
      <p className="mt-4 text-xs text-muted-foreground">Os registros mostram ingestão estimada, não mudança de peso ou composição corporal.</p>
    </section>
  </AppShell>;
}
