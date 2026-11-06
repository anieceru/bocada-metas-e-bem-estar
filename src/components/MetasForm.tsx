import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ConfirmarMetas } from "@/components/ConfirmarMetas";
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
}: {
  limites?: Limites;
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
