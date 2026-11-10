import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ConfirmarMetas } from "@/components/ConfirmarMetas";
import { Info, Calculator } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { calcularMetas, faltandoParaCalcular, ritmoSemanalG, AGUA_ML_POR_KG, FRACAO_GORDURA, KCAL_POR_KG_CORPORAL, type DadosCalculo } from "@/lib/calculo-metas";
import { CHAVES_METAS, metasForaDoUsual, type Limites, type Metas } from "@/lib/config";

import { MACROS, gramasPorPercentual, percentualMacro, macrosExcedemCalorias, totalMacros, type ChaveMacro, type ModoMacros } from "@/lib/macros";

function paraNumero(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function MetasForm({
  inicial,
  rotuloSalvar,
  onSalvar,
  extra,
  limites,
  calculo,
}: {
  calculo?: DadosCalculo;
  limites?: Limites | undefined;
  inicial: Partial<Metas>;
  rotuloSalvar: string;
  onSalvar: (m: Metas) => Promise<void>;
  extra?: React.ReactNode;
}) {
  const [vals, setVals] = useState<Record<string, string>>(
    Object.fromEntries(CHAVES_METAS.map((k) => [k, inicial[k]?.toString() ?? ""])),
  );
  const [pendente, setPendente] = useState<Metas | null>(null);
  const [salvando, setSalvando] = useState(false);

  const metas = Object.fromEntries(CHAVES_METAS.map((k) => [k, paraNumero(vals[k] ?? "")])) as Metas;
  const [modo, setModo] = useState<ModoMacros>("gramas");
  const [percentuais, setPercentuais] = useState<Record<ChaveMacro, string>>({ carboidratos_g: "", gorduras_g: "", proteinas_g: "" });
  if (modo === "porcentagem") {
    for (const m of MACROS) {
      const pct = paraNumero(percentuais[m.chave]);
      metas[m.chave] = pct == null ? null : gramasPorPercentual(pct, m.kcalPorG, metas.kcal ?? 0);
    }
  }
  const totalPct = modo === "porcentagem"
    ? MACROS.reduce((s, m) => s + (paraNumero(percentuais[m.chave]) ?? 0), 0)
    : percentualMacro(totalMacros(metas), 1, metas.kcal ?? 0);
  const excedeu = totalPct > 100 + 1e-8 || macrosExcedemCalorias(metas);
  const temMacros = MACROS.some((m) => modo === "porcentagem" ? percentuais[m.chave] !== "" : vals[m.chave] !== "");
  const semCalorias = temMacros && !(metas.kcal != null && metas.kcal > 0);
  const bloqueado = excedeu || semCalorias;
  function mudarModo(novo: ModoMacros) {
    if (novo === modo) return;
    if (novo === "porcentagem") {
      setPercentuais(Object.fromEntries(MACROS.map((m) => [m.chave, metas[m.chave] == null ? "" : String(Math.floor(percentualMacro(metas[m.chave] ?? 0, m.kcalPorG, metas.kcal ?? 0) * 100) / 100)])) as Record<ChaveMacro, string>);
    } else setVals(Object.fromEntries(CHAVES_METAS.map((k) => [k, metas[k]?.toString() ?? ""])));
    setModo(novo);
  }
  const fora = metasForaDoUsual(metas, limites);
  const calc = calculo ? calcularMetas(calculo) : null;
  const faltando = calculo ? faltandoParaCalcular(calculo) : [];
  const ritmo = calc && metas.kcal ? ritmoSemanalG(metas.kcal, calc.manutencao) : null;

  async function salvar(m: Metas) {
    if (bloqueado || macrosExcedemCalorias(m)) return;
    setSalvando(true);
    try {
      await onSalvar(m);
    } finally {
      setSalvando(false);
      setPendente(null);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (bloqueado) return;
        if (fora.length) setPendente(metas);
        else salvar(metas);
      }}
      className="space-y-4"
    >
      {calculo && (
        <div className="rounded-xl border bg-surface p-3">
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" className="h-10 flex-1 rounded-xl" disabled={!calc}
              onClick={() => { if (!calc) return; setModo("gramas"); setVals(Object.fromEntries(CHAVES_METAS.map((k) => [k, String(calc.metas[k])]))); }}>
              <Calculator className="h-4 w-4" aria-hidden /> Calcular para mim
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="icon" className="h-10 w-10 rounded-xl" aria-label="Como o cálculo é feito">
                  <Info className="h-4 w-4" aria-hidden />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 space-y-2 text-xs leading-relaxed">
                <p className="text-sm font-semibold">Como calculamos</p>
                {calc ? (
                  <>
                    <p><strong>1. Gasto em repouso</strong> (fórmula de Mifflin-St Jeor): 10 × peso + 6,25 × altura − 5 × idade {calculo.sexo === "masculino" ? "+ 5" : calculo.sexo === "feminino" ? "− 161" : "− 78 (média, sem sexo informado)"} = <strong>{calc.basal} kcal</strong>.</p>
                    <p><strong>2. Atividade</strong> ({calc.ativ.l}): × {String(calc.ativ.fator).replace(".", ",")} = <strong>{calc.manutencao} kcal</strong> para manter o peso.</p>
                    <p><strong>3. Objetivo</strong> ({calc.obj.l}): {calc.obj.ajuste === 0 ? "sem ajuste" : `${calc.obj.ajuste > 0 ? "+" : "−"} ${Math.abs(calc.obj.ajuste)} kcal`} = <strong>{calc.metas.kcal} kcal</strong>.</p>
                    <p><strong>4. Proteínas:</strong> {String(calc.obj.proteinaPorKg).replace(".", ",")} g por kg. <strong>Gorduras:</strong> {FRACAO_GORDURA * 100}% das calorias (9 kcal/g). <strong>Carboidratos:</strong> o restante (4 kcal/g).</p>
                    <p><strong>5. Água:</strong> {AGUA_ML_POR_KG} ml por kg.</p>
                  </>
                ) : (
                  <p>Usamos idade, peso, altura, sexo, nível de atividade e objetivo. Falta: {faltando.join(", ")}.</p>
                )}
                <p className="text-muted-foreground">Ritmo semanal: diferença para o gasto de manutenção × 7 ÷ {KCAL_POR_KG_CORPORAL.toLocaleString("pt-BR")} kcal (≈ 1 kg de gordura corporal). São estimativas; o corpo de cada pessoa responde de um jeito, e não substituem orientação profissional.</p>
              </PopoverContent>
            </Popover>
          </div>
          {!calc && <p className="mt-2 text-xs text-muted-foreground">Para calcular, preencha antes: {faltando.join(", ")}.</p>}
        </div>
      )}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between"><Label htmlFor="meta-kcal">Calorias diárias (kcal)</Label><span className="text-sm text-muted-foreground">100%</span></div>
        <Input id="meta-kcal" inputMode="numeric" placeholder="—" value={vals.kcal} onChange={(e) => setVals({ ...vals, kcal: e.target.value.replace(/\D/g, "") })} />
      </div>
      <section className="space-y-3 border-y py-4" aria-label="Distribuição de macros">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Distribuição de macros</h3>
          <div className="flex gap-1" role="group" aria-label="Unidade dos macros">
            <Button type="button" size="sm" variant={modo === "porcentagem" ? "secondary" : "ghost"} aria-pressed={modo === "porcentagem"} onClick={() => mudarModo("porcentagem")}>Porcentagem</Button>
            <Button type="button" size="sm" variant={modo === "gramas" ? "secondary" : "ghost"} aria-pressed={modo === "gramas"} onClick={() => mudarModo("gramas")}>Gramas</Button>
          </div>
        </div>
        {MACROS.map((m) => (
          <div key={m.chave} className="grid grid-cols-[minmax(0,1fr)_6rem_5rem] items-center gap-2">
            <Label htmlFor={`meta-${m.chave}`}>{m.nome}</Label>
            <div className="relative">
              <Input id={`meta-${m.chave}`} inputMode={modo === "porcentagem" ? "decimal" : "numeric"} placeholder="—" className="pr-7 text-right" value={modo === "porcentagem" ? percentuais[m.chave] : vals[m.chave]} aria-invalid={excedeu} aria-describedby="total-macros"
                onChange={(e) => modo === "porcentagem" ? setPercentuais({ ...percentuais, [m.chave]: e.target.value.replace(/[^\d,.]/g, "") }) : setVals({ ...vals, [m.chave]: e.target.value.replace(/\D/g, "") })} />
              <span className="pointer-events-none absolute right-2 top-2.5 text-sm text-muted-foreground">{modo === "porcentagem" ? "%" : "g"}</span>
            </div>
            <span className="text-right text-xs text-muted-foreground">{modo === "porcentagem" ? `${metas[m.chave] ?? 0} g` : `${percentualMacro(metas[m.chave] ?? 0, m.kcalPorG, metas.kcal ?? 0).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`}</span>
          </div>
        ))}
        <div id="total-macros" aria-live="polite" className={excedeu ? "text-destructive" : "text-foreground"}>
          <div className="flex justify-between text-sm font-semibold"><span>Total dos macros</span><span>{totalPct.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}% / 100%</span></div>
          <p className="mt-1 text-xs">{semCalorias ? "Defina as calorias para distribuir os macros." : excedeu ? "Acima de 100%. Reduza os macros para salvar." : `${totalMacros(metas).toLocaleString("pt-BR")} de ${(metas.kcal ?? 0).toLocaleString("pt-BR")} kcal · ${Math.max(0, 100 - totalPct).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}% disponíveis`}</p>
        </div>
      </section>
      <div className="space-y-1.5">
        <Label htmlFor="meta-agua_ml">Água diária (ml)</Label>
        <Input id="meta-agua_ml" inputMode="numeric" placeholder="—" value={vals.agua_ml} onChange={(e) => setVals({ ...vals, agua_ml: e.target.value.replace(/\D/g, "") })} />
      </div>
      {calc && ritmo != null && (
        <p className="text-sm" aria-live="polite">
          {Math.abs(ritmo) < 50
            ? "Com essas calorias, seu peso tende a ficar estável"
            : `Com ${metas.kcal?.toLocaleString("pt-BR")} kcal, ~${Math.abs(ritmo).toLocaleString("pt-BR")} g a ${ritmo < 0 ? "menos" : "mais"} por semana`}{" "}
          para o objetivo de <strong className="text-estado-memoria">{calc.obj.nome}</strong>.
        </p>
      )}
      <p className="text-xs text-muted-foreground">Deixe em branco o que não quiser definir agora.</p>
      <div className="flex flex-col gap-2">
        <Button type="submit" disabled={salvando || bloqueado} className="h-11 rounded-xl">{rotuloSalvar}</Button>
        {extra}
      </div>
      <ConfirmarMetas
        aberto={!!pendente}
        chaves={fora}
        metas={metas}
        limites={limites}
        onCancelar={() => setPendente(null)}
        onConfirmar={() => pendente && salvar(pendente)}
      />
    </form>
  );
}
