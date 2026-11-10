import { Link } from "@tanstack/react-router";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ajustarDia, diasSemana } from "@/lib/calendario";

export function Semana({ dia, onChange }: { dia: string; onChange: (dia: string) => void }) {
  return <section className="mt-7 border-t pt-4">
    <div className="mb-3 flex items-center justify-between">
      <Button variant="ghost" size="icon" aria-label="Semana anterior" onClick={() => onChange(ajustarDia(dia, -7))}><ChevronLeft className="h-4 w-4" /></Button>
      <h2 className="text-sm font-semibold">Sua semana</h2>
      <Button variant="ghost" size="icon" aria-label="Próxima semana" onClick={() => onChange(ajustarDia(dia, 7))}><ChevronRight className="h-4 w-4" /></Button>
    </div>
    <div className="grid grid-cols-7 gap-1">{diasSemana(dia).map((d) => <Button key={d} variant={dia === d ? "default" : "ghost"} aria-label={`Ver dia ${d}`} aria-pressed={dia === d} onClick={() => onChange(d)} className="h-14 min-w-0 flex-col gap-1 px-0">
      <span className="text-[10px] capitalize">{new Date(`${d}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}</span><span>{Number(d.slice(-2))}</span>
    </Button>)}</div>
    <Button variant="outline" className="mt-3 w-full" asChild><Link to="/historico" search={{ mes: dia.slice(0, 7) }}><CalendarDays className="h-4 w-4" />Ver mês e evolução</Link></Button>
  </section>;
}