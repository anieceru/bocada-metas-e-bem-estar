import { useState } from "react";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";

const metricas = [
  { chave: "kcal", nome: "Calorias", unidade: "kcal" },
  { chave: "proteinas_g", nome: "Proteínas", unidade: "g" },
  { chave: "carboidratos_g", nome: "Carbos", unidade: "g" },
  { chave: "gorduras_g", nome: "Gorduras", unidade: "g" },
] as const;
type Registro = { dia: string; kcal: number; proteinas_g: number; carboidratos_g: number; gorduras_g: number };

export function GraficoEvolucao({ dias, registros }: { dias: string[]; registros: Registro[] }) {
  const [metrica, setMetrica] = useState<(typeof metricas)[number]>(metricas[0]);
  const pontos = dias.map((dia) => {
    const linhas = registros.filter((r) => r.dia === dia);
    return { dia: Number(dia.slice(-2)), valor: linhas.length ? Math.round(linhas.reduce((s, r) => s + Number(r[metrica.chave]), 0)) : null };
  });
  return <section className="mt-6 border-t pt-5">
    <h2 className="text-base font-semibold">Evolução dos registros</h2>
    <div className="mt-3 flex flex-wrap gap-1" role="group" aria-label="Métrica do gráfico">
      {metricas.map((m) => <Button key={m.chave} size="sm" variant={metrica.chave === m.chave ? "secondary" : "ghost"} aria-pressed={metrica.chave === m.chave} onClick={() => setMetrica(m)}>{m.nome}</Button>)}
    </div>
    <div className="mt-4 h-60 min-w-0 w-full" role="img" aria-label={`Gráfico de ${metrica.nome.toLowerCase()} registradas por dia, em ${metrica.unidade}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={pontos} margin={{ top: 12, right: 12, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey="dia" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} minTickGap={24} tickLine={false} axisLine={false} />
          <YAxis width={48} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip content={({ active, payload, label }) => active && payload?.length ? <div className="rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground">Dia {label}: <strong>{payload[0]?.value} {metrica.unidade}</strong></div> : null} />
          <Line type="linear" dataKey="valor" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3, fill: "var(--primary)" }} activeDot={{ r: 5 }} connectNulls={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
    <p className="mt-2 text-xs text-muted-foreground">Dias sem registros ficam sem pontos. O gráfico mostra ingestão estimada, não ganho ou perda de peso.</p>
  </section>;
}