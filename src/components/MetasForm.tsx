import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ConfirmarMetas } from "@/components/ConfirmarMetas";
import { Info, Calculator } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { calcularMetas, faltandoParaCalcular, ritmoSemanalG, AGUA_ML_POR_KG, FRACAO_GORDURA, KCAL_POR_KG_CORPORAL, type DadosCalculo } from "@/lib/calculo-metas";
import { CHAVES_METAS, LIMITES_METAS, metasForaDoUsual, type Limites, type Metas } from "@/lib/config";

function paraNumero(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const n = Math.round(Number(t.replace(",", ".")));
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
  const fora = metasForaDoUsual(metas, limites);
  const calc = calculo ? calcularMetas(calculo) : null;
  const faltando = calculo ? faltandoParaCalcular(calculo) : [];
  const ritmo = calc && metas.kcal ? ritmoSemanalG(metas.kcal, calc.manutencao) : null;

  async function salvar(m: Metas) {
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
        if (fora.length) setPendente(metas);
        else salvar(metas);
      }}
      className="space-y-4"
    >
      {calculo && (
        <div className="rounded-xl border bg-surface p-3">
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" className="h-10 flex-1 rounded-xl" disabled={!calc}
              onClick={() => calc && setVals(Object.fromEntries(CHAVES_METAS.map((k) => [k, String(calc.metas[k])])))}>
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
      <div className="grid grid-cols-2 gap-3">
        {CHAVES_METAS.map((k) => (
          <div key={k} className="space-y-1.5">
            <Label htmlFor={`meta-${k}`}>
              {LIMITES_METAS[k].nome} ({LIMITES_METAS[k].unidade})
            </Label>
            <Input
              id={`meta-${k}`}
              inputMode="numeric"
              placeholder="—"
              value={vals[k]}
              onChange={(e) => setVals({ ...vals, [k]: e.target.value.replace(/[^\d]/g, "") })}
            />
          </div>
        ))}
      </div>
      {calc && ritmo != null && (
        <p className="text-sm" aria-live="polite">
          {Math.abs(ritmo) < 50
            ? "Com essas calorias, seu peso tende a ficar estável"
            : `Com ${metas.kcal!.toLocaleString("pt-BR")} kcal, ~${Math.abs(ritmo).toLocaleString("pt-BR")} g a ${ritmo < 0 ? "menos" : "mais"} por semana`}{" "}
          para o objetivo de <strong className="text-estado-memoria">{calc.obj.nome}</strong>.
        </p>
      )}
      <p className="text-xs text-muted-foreground">Deixe em branco o que não quiser definir agora.</p>
      <div className="flex flex-col gap-2">
        <Button type="submit" disabled={salvando} className="h-11 rounded-xl">{rotuloSalvar}</Button>
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
