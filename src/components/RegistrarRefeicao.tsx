import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Mic, MicOff, Keyboard, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  calcularNutrientes, dividirItens, hojeISO, interpretarItem, normalizar, type AlimentoTaco,
} from "@/lib/diario";

type SR = {
  lang: string; interimResults: boolean; continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null; onerror: ((e: { error: string }) => void) | null;
  start: () => void; stop: () => void;
};
function criarReconhecimento(): SR | null {
  const w = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
  const C = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return C ? new C() : null;
}

type Item = { termo: string; gramas: string; opcoes: AlimentoTaco[]; escolhido: number | null };

async function buscar(termo: string): Promise<AlimentoTaco[]> {
  const q = normalizar(termo).replace(/[.,]/g, " ");
  if (!q) return [];
  const { data } = await supabase.rpc("buscar_alimentos", { q });
  return (data ?? []) as AlimentoTaco[];
}

export function RegistrarRefeicao({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const [suportaVoz, setSuportaVoz] = useState<boolean | null>(null);
  const [modo, setModo] = useState<"voz" | "texto">("voz");
  const [ouvindo, setOuvindo] = useState(false);
  const [texto, setTexto] = useState("");
  const [parcial, setParcial] = useState("");
  const [itens, setItens] = useState<Item[]>([]);
  const [origem, setOrigem] = useState<"voz" | "digitado">("digitado");
  const [salvando, setSalvando] = useState(false);
  const rec = useRef<SR | null>(null);
  const finalRef = useRef("");

  useEffect(() => {
    const ok = !!criarReconhecimento();
    setSuportaVoz(ok);
    if (!ok) setModo("texto");
  }, []);

  async function interpretar(frase: string, via: "voz" | "digitado") {
    setOrigem(via);
    const partes = dividirItens(frase).map(interpretarItem).filter((p) => p.termo);
    if (!partes.length) return void toast("Não entendi os alimentos. Tente de novo ou digite.");
    const novos = await Promise.all(
      partes.map(async (p) => {
        const opcoes = await buscar(p.termo);
        return { termo: p.termo, gramas: String(p.gramas ?? 100), opcoes, escolhido: opcoes[0]?.id ?? null };
      }),
    );
    setItens(novos);
  }

  function ouvir() {
    if (ouvindo) return rec.current?.stop();
    const r = criarReconhecimento();
    if (!r) return setModo("texto");
    r.lang = "pt-BR";
    r.interimResults = true;
    r.continuous = false;
    finalRef.current = "";
    r.onresult = (e) => {
      let fin = "", tmp = "";
      for (let i = 0; i < e.results.length; i++) {
        const res = e.results[i]!;
        if (res.isFinal) fin += res[0]!.transcript; else tmp += res[0]!.transcript;
      }
      finalRef.current = fin;
      setParcial(fin + tmp);
    };
    r.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        toast("Sem acesso ao microfone. Você pode digitar.");
        setModo("texto");
      }
    };
    r.onend = () => {
      setOuvindo(false);
      const frase = finalRef.current.trim();
      if (frase) interpretar(frase, "voz"); // sem botão de enviar: processa ao terminar de falar
    };
    rec.current = r;
    setParcial("");
    setItens([]);
    setOuvindo(true);
    r.start();
  }

  async function trocarBusca(i: number, termo: string) {
    const opcoes = await buscar(termo);
    setItens((arr) => arr.map((it, j) => (j === i ? { ...it, termo, opcoes, escolhido: opcoes[0]?.id ?? null } : it)));
  }

  async function salvar() {
    const linhas = itens.flatMap((it) => {
      const a = it.opcoes.find((o) => o.id === it.escolhido);
      const g = Number(it.gramas.replace(",", "."));
      if (!a || !(g > 0 && g <= 5000)) return [];
      return [{ user_id: userId, dia: hojeISO(), alimento_id: a.id, descricao: a.descricao, gramas: g, origem, ...calcularNutrientes(a, g) }];
    });
    if (!linhas.length) return void toast("Escolha pelo menos um alimento com quantidade válida.");
    setSalvando(true);
    const { error } = await supabase.from("registros").insert(linhas);
    setSalvando(false);
    if (error) return void toast.error("Não foi possível registrar. Tente de novo.");
    toast.success(linhas.length === 1 ? "Registrado." : `${linhas.length} itens registrados.`);
    setItens([]); setTexto(""); setParcial("");
    qc.invalidateQueries({ queryKey: ["registros"] });
  }

  return (
    <section className="rounded-2xl border bg-surface p-5">
      {modo === "voz" && suportaVoz ? (
        <div className="text-center">
          <button
            type="button"
            onClick={ouvir}
            aria-pressed={ouvindo}
            aria-label={ouvindo ? "Parar de ouvir" : "Falar o que comeu"}
            className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${ouvindo ? "animate-pulse bg-destaque text-destaque-foreground" : "bg-primary text-primary-foreground"}`}
          >
            {ouvindo ? <MicOff className="h-8 w-8" aria-hidden /> : <Mic className="h-8 w-8" aria-hidden />}
          </button>
          <p className="mt-3 text-sm font-medium">{ouvindo ? "Ouvindo… fale o que comeu" : "Toque e diga o que você comeu"}</p>
          <p className="mt-1 text-xs text-muted-foreground">Ex.: "150 gramas de arroz, feijão e uma banana"</p>
          {parcial && <p className="mt-3 rounded-xl bg-muted p-3 text-sm">“{parcial}”</p>}
          <button type="button" onClick={() => setModo("texto")} className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary underline">
            <Keyboard className="h-4 w-4" aria-hidden /> Prefiro digitar
          </button>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); interpretar(texto, "digitado"); }} className="space-y-3">
          {suportaVoz === false && (
            <p className="text-xs text-muted-foreground">Este navegador não oferece ditado. Digite o que comeu.</p>
          )}
          <label htmlFor="o-que-comi" className="text-sm font-medium">O que você comeu?</label>
          <Textarea id="o-que-comi" rows={2} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="150 g de arroz, feijão e uma banana" />
          <div className="flex gap-2">
            <Button type="submit" className="flex-1 rounded-xl">Buscar alimentos</Button>
            {suportaVoz && (
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setModo("voz")} aria-label="Usar voz">
                <Mic className="h-4 w-4" aria-hidden />
              </Button>
            )}
          </div>
        </form>
      )}

      {itens.length > 0 && (
        <div className="mt-5 space-y-3 border-t pt-4">
          <p className="text-sm font-semibold">Confira antes de registrar</p>
          {itens.map((it, i) => {
            const a = it.opcoes.find((o) => o.id === it.escolhido);
            const g = Number(it.gramas.replace(",", "."));
            const n = a && g > 0 ? calcularNutrientes(a, g) : null;
            return (
              <div key={i} className="rounded-xl border p-3">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <Input aria-label="Buscar alimento" defaultValue={it.termo} onBlur={(e) => e.target.value !== it.termo && trocarBusca(i, e.target.value)} className="h-9" />
                  <button type="button" aria-label="Remover item" onClick={() => setItens(itens.filter((_, j) => j !== i))} className="p-1 text-muted-foreground">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {it.opcoes.length === 0 ? (
                  <p className="mt-2 text-xs text-muted-foreground">Nada encontrado na TACO. Tente outra palavra.</p>
                ) : (
                  <div className="mt-2 grid grid-cols-[1fr_5.5rem] gap-2">
                    <select
                      aria-label="Alimento"
                      value={it.escolhido ?? ""}
                      onChange={(e) => setItens(itens.map((x, j) => (j === i ? { ...x, escolhido: Number(e.target.value) } : x)))}
                      className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                    >
                      {it.opcoes.map((o) => <option key={o.id} value={o.id}>{o.descricao}</option>)}
                    </select>
                    <div className="flex items-center gap-1">
                      <Input aria-label="Quantidade em gramas" inputMode="decimal" value={it.gramas} onChange={(e) => setItens(itens.map((x, j) => (j === i ? { ...x, gramas: e.target.value } : x)))} className="h-9" />
                      <span className="text-xs text-muted-foreground">g</span>
                    </div>
                  </div>
                )}
                {n && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="rounded bg-estado-estimativa/15 px-1.5 py-0.5 font-medium text-estado-estimativa">Estimativa</span>
                    {n.kcal} kcal · C {n.carboidratos_g} g · P {n.proteinas_g} g · G {n.gorduras_g} g
                  </p>
                )}
              </div>
            );
          })}
          <Button onClick={salvar} disabled={salvando} className="h-11 w-full rounded-xl">Registrar</Button>
        </div>
      )}
      <p className="mt-4 text-[11px] text-muted-foreground">Valores: TACO 4ª ed., NEPA/UNICAMP.</p>
    </section>
  );
}
