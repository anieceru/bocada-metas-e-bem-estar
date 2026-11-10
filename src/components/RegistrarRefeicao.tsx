import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Mic, MicOff, Keyboard, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  calcularNutrientes, dividirItens, hojeISO, interpretarItem, normalizar, referenciaAlimento, type AlimentoTaco,
} from "@/lib/diario";
import { verificarAlertaMetas } from "@/lib/notificacoes.functions";
import { consultaAlimento, nutrientesDisponiveis, ordenarAlimentos, porcaoEstimada } from "@/lib/identificar-alimentos";

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

type Item = { termo: string; gramas: string; opcoes: AlimentoTaco[]; escolhido: string | null; aviso?: string | undefined };
const chave = (a: AlimentoTaco) => `${a.fonte ?? "taco"}:${a.id}`;

async function buscar(termo: string): Promise<AlimentoTaco[]> {
  const { alimento, marca } = consultaAlimento(termo);
  const q = normalizar(alimento).replace(/[.,]/g, " ").trim();
  if (!q) return [];
  const { data, error } = await supabase.rpc("buscar_alimentos_catalogo", { q, fonte: "taco" });
  if (error) throw error;
  const locais = (data ?? []) as AlimentoTaco[];
  // Alimentos comuns não esperam a pesquisa no catálogo grande de produtos.
  if (!marca && locais.some(nutrientesDisponiveis) && q !== "leite") return ordenarAlimentos(termo, locais);
  if (q === "leite" && !marca) {
    const { data: leites, error: erroLeite } = await supabase.from("alimentos_usda")
      .select("fdc_id,descricao,marca,gtin_upc,kcal,proteina_g,lipideos_g,carboidrato_g")
      .eq("descricao", "WHOLE MILK").order("fdc_id").limit(8);
    if (erroLeite) throw erroLeite;
    return ordenarAlimentos(termo, [...locais, ...(leites ?? []).map(a => ({ ...a, id: a.fdc_id, fonte: "usda" as const }))]);
  }
  const consulta = q === "leite" && !marca ? "whole milk" : marca ?? q;
  const { data: produtos, error: erroProdutos } = await supabase.rpc("buscar_alimentos_catalogo", { q: consulta, fonte: "usda" });
  if (erroProdutos) throw erroProdutos;
  let usda = (produtos ?? []) as AlimentoTaco[];
  if (q === "leite" && !marca) usda = usda.filter(a => /^(?:organic )?whole milk(?:,|$)/i.test(a.descricao));
  if (marca) usda = usda.filter(a => normalizar(a.marca ?? "").includes(marca) && q.split(" ").filter(w => w.length > 2).every(w => normalizar(a.descricao).includes(w)));
  return ordenarAlimentos(termo, [...locais, ...usda]);
}

export function RegistrarRefeicao({ userId, dia = hojeISO(), refeicoes = ["Café da manhã", "Almoço", "Jantar", "Lanches"], refeicaoInicial, onSaved }: { userId: string; dia?: string; refeicoes?: string[]; refeicaoInicial?: string; onSaved?: () => void }) {
  const qc = useQueryClient();
  const [suportaVoz, setSuportaVoz] = useState<boolean | null>(null);
  const [modo, setModo] = useState<"voz" | "texto">("voz");
  const [ouvindo, setOuvindo] = useState(false);
  const [texto, setTexto] = useState("");
  const [parcial, setParcial] = useState("");
  const [itens, setItens] = useState<Item[]>([]);
  const [origem, setOrigem] = useState<"voz" | "digitado">("digitado");
  const [salvando, setSalvando] = useState(false);
  const [refeicao, setRefeicao] = useState(refeicaoInicial ?? refeicoes[0] ?? "Lanches");
  const [buscando, setBuscando] = useState(false);
  const rec = useRef<SR | null>(null);
  const finalRef = useRef("");
  const buscaAtual = useRef(0);
  const cache = useRef(new Map<string, Promise<AlimentoTaco[]>>());
  async function buscarUmaVez(termo: string) {
    const q = normalizar(termo);
    const anterior = cache.current.get(q);
    if (anterior) return anterior;
    const promessa = buscar(q).catch(e => { cache.current.delete(q); throw e; });
    cache.current.set(q, promessa);
    return promessa;
  }

  useEffect(() => {
    const ok = !!criarReconhecimento();
    setSuportaVoz(ok);
    if (!ok) setModo("texto");
  }, []);
  useEffect(() => () => { if (rec.current) { rec.current.onend = null; rec.current.stop(); } }, []);

  async function interpretar(frase: string, via: "voz" | "digitado") {
    setOrigem(via);
    const partes = dividirItens(frase).map(interpretarItem).filter((p) => p.termo);
    if (!partes.length) return void toast("Não entendi os alimentos. Tente de novo ou digite.");
    setBuscando(true);
    const versao = ++buscaAtual.current;
    setItens(partes.map(p => ({ termo: p.termo, gramas: String(p.gramas ?? porcaoEstimada(p.termo)), opcoes: [], escolhido: null })));
    try {
    await Promise.all(
      partes.map(async (p, i) => {
        const opcoes = await buscarUmaVez(p.termo);
        if (versao !== buscaAtual.current) return;
        const { marca } = consultaAlimento(p.termo);
        const exata = opcoes.find(a => marca && normalizar(a.marca ?? "").includes(marca));
        const a = exata ?? opcoes.find(nutrientesDisponiveis);
        const aviso = marca && !exata ? `Marca ${marca} não encontrada. Escolha uma alternativa apenas se quiser usar valores genéricos.` : p.termo === "acucar" && p.gramas == null ? "Açúcar estimado: 1 colher de chá rasa (5 g). Ajuste à quantidade usada." : p.termo === "leite" ? "Leite integral: referência de produto USDA, pois a TACO não informa estes valores. Confira com o rótulo do seu leite." : undefined;
        setItens(arr => arr.map((it, j) => j === i ? { ...it, opcoes, escolhido: marca && !exata ? null : a ? chave(a) : null, aviso } : it));
      }),
    );
    } catch {
      toast.error("Não foi possível buscar alimentos. Tente de novo.");
    } finally {
      if (versao === buscaAtual.current) setBuscando(false);
    }
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
        const res = e.results[i];
        const transcript = res?.[0]?.transcript;
        if (!res || !transcript) continue;
        if (res.isFinal) fin += transcript; else tmp += transcript;
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
    let opcoes: AlimentoTaco[];
    try { opcoes = await buscarUmaVez(termo); }
    catch { return void toast.error("Não foi possível buscar alimentos. Tente de novo."); }
    const { marca } = consultaAlimento(termo);
    const a = opcoes.find(o => nutrientesDisponiveis(o) && (!marca || normalizar(o.marca ?? "").includes(marca)));
    setItens((arr) => arr.map((it, j) => (j === i ? { ...it, termo, opcoes, escolhido: a ? chave(a) : null, aviso: marca && !a ? `Marca ${marca} não encontrada. Escolha uma alternativa apenas se quiser usar valores genéricos.` : undefined } : it)));
  }

  async function salvar() {
    if (itens.some(it => !it.escolhido || !it.opcoes.some(a => chave(a) === it.escolhido && nutrientesDisponiveis(a)) || !(Number(it.gramas.replace(",", ".")) > 0 && Number(it.gramas.replace(",", ".")) <= 5000))) return void toast("Confira todos os alimentos e quantidades antes de registrar.");
    const linhas = itens.flatMap((it) => {
      const a = it.opcoes.find((o) => chave(o) === it.escolhido);
      const g = Number(it.gramas.replace(",", "."));
      if (!a || !(g > 0 && g <= 5000)) return [];
      const descricao = a.fonte === "usda" && a.marca ? `${a.descricao} · ${a.marca}` : a.descricao;
      return [{ user_id: userId, dia, refeicao, ...referenciaAlimento(a), descricao: descricao.slice(0, 200), gramas: g, origem, ...calcularNutrientes(a, g) }];
    });
    if (!linhas.length) return void toast("Escolha pelo menos um alimento com quantidade válida.");
    setSalvando(true);
    const { error } = await supabase.from("registros").insert(linhas);
    setSalvando(false);
    if (error) return void toast.error("Não foi possível registrar. Tente de novo.");
    toast.success(linhas.length === 1 ? "Registrado." : `${linhas.length} itens registrados.`);
    setItens([]); setTexto(""); setParcial("");
    qc.invalidateQueries({ queryKey: ["registros"] });
    verificarAlertaMetas({ data: { dia } }).then((r) => {
      if (r.passou) toast("Uma meta de hoje foi ultrapassada. Não é preciso compensar; siga com suas refeições habituais.");
    }).catch(() => { /* O registro foi salvo mesmo se o aviso não puder ser verificado. */ });
    onSaved?.();
  }

  return (
    <section className="py-4">
      <label className="mb-4 block text-sm font-medium">Refeição
        <select aria-label="Refeição do registro" value={refeicao} onChange={(e) => setRefeicao(e.target.value)} className="mt-1 h-10 w-full rounded-md border bg-background px-3">
          {refeicoes.map((nome) => <option key={nome}>{nome}</option>)}
        </select>
      </label>
      {modo === "voz" && suportaVoz ? (
        <div className="text-center">
          <Button
            type="button"
            onClick={ouvir}
            aria-pressed={ouvindo}
            aria-label={ouvindo ? "Parar de ouvir" : "Falar o que comeu"}
            className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${ouvindo ? "animate-pulse bg-destaque text-destaque-foreground" : "bg-primary text-primary-foreground"}`}
          >
            {ouvindo ? <MicOff className="h-8 w-8" aria-hidden /> : <Mic className="h-8 w-8" aria-hidden />}
          </Button>
          <p className="mt-3 text-sm font-medium">{ouvindo ? "Ouvindo… fale o que comeu" : "Toque e diga o que você comeu"}</p>
          <p className="mt-1 text-xs text-muted-foreground">Ex.: "150 gramas de arroz, feijão e uma banana"</p>
          {parcial && <p className="mt-3 rounded-xl bg-muted p-3 text-sm">“{parcial}”</p>}
          <Button type="button" variant="ghost" onClick={() => setModo("texto")} className="mt-3 gap-1.5 text-sm text-primary">
            <Keyboard className="h-4 w-4" aria-hidden /> Prefiro digitar
          </Button>
        </div>
      ) : null}
        <form onSubmit={(e) => { e.preventDefault(); interpretar(texto, "digitado"); }} className="space-y-3">
          {suportaVoz === false && (
            <p className="text-xs text-muted-foreground">Este navegador não oferece ditado. Digite o que comeu.</p>
          )}
          <label htmlFor={refeicaoInicial ? "refeicao-texto" : "o-que-comi"} className="text-sm font-medium">O que você comeu?</label>
          <Textarea id={refeicaoInicial ? "refeicao-texto" : "o-que-comi"} rows={2} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Digite um alimento ou o que comeu…" />
          <div className="flex gap-2">
            <Button type="submit" disabled={buscando || ouvindo || !texto.trim()} className="flex-1 rounded-xl"><Search className="h-4 w-4" />{buscando ? "Buscando…" : "Buscar alimentos"}</Button>
            {suportaVoz && modo === "texto" && (
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setModo("voz")} aria-label="Usar voz">
                <Mic className="h-4 w-4" aria-hidden />
              </Button>
            )}
          </div>
        </form>

      {itens.length > 0 && (
        <div className="mt-5 space-y-3 border-t pt-4">
          <p className="text-sm font-semibold">Confira antes de registrar</p>
          {itens.map((it, i) => {
            const a = it.opcoes.find((o) => chave(o) === it.escolhido);
            const g = Number(it.gramas.replace(",", "."));
            const n = a && nutrientesDisponiveis(a) && g > 0 ? calcularNutrientes(a, g) : null;
            return (
              <div key={i} className="rounded-xl border p-3">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <Input key={it.termo} aria-label="Buscar alimento" defaultValue={it.termo} onBlur={(e) => e.target.value !== it.termo && trocarBusca(i, e.target.value)} className="h-9" />
                  <Button type="button" variant="ghost" size="icon" aria-label="Remover item" onClick={() => setItens(itens.filter((_, j) => j !== i))} className="text-muted-foreground">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {it.opcoes.length === 0 ? (
                  <p className="mt-2 text-xs text-muted-foreground">{buscando ? "Buscando…" : "Nada encontrado. Tente outra palavra, marca ou nome do rótulo."}</p>
                ) : (
                  <div className="mt-2 grid grid-cols-[1fr_5.5rem] gap-2">
                    <select
                      aria-label="Alimento"
                      value={it.escolhido ?? ""}
                      onChange={(e) => setItens(itens.map((x, j) => (j === i ? { ...x, escolhido: e.target.value } : x)))}
                      className="h-9 min-w-0 w-full rounded-md border border-input bg-background px-2 text-sm"
                    >
                      <option value="" disabled>Escolha um alimento</option>
                      {it.opcoes.map((o) => <option key={chave(o)} value={chave(o)}>{o.descricao === "WHOLE MILK" ? "Leite integral (WHOLE MILK)" : o.descricao}{o.marca ? ` · ${o.marca}` : ""}</option>)}
                    </select>
                    <div className="flex items-center gap-1">
                      <Input aria-label="Quantidade em gramas" inputMode="decimal" value={it.gramas} onChange={(e) => setItens(itens.map((x, j) => (j === i ? { ...x, gramas: e.target.value } : x)))} className="h-9" />
                      <span className="text-xs text-muted-foreground">g</span>
                    </div>
                  </div>
                )}
                {it.aviso && <p className="mt-2 text-xs text-estado-estimativa">{it.aviso}</p>}
                {a && !nutrientesDisponiveis(a) && <p className="mt-2 text-xs text-muted-foreground">Valores nutricionais indisponíveis. Escolha outra opção; não serão contados como zero.</p>}
                {n && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="rounded bg-estado-estimativa/15 px-1.5 py-0.5 font-medium text-estado-estimativa">Estimativa</span>
                    {n.kcal} kcal · P {n.proteinas_g} g · C {n.carboidratos_g} g · G {n.gorduras_g} g
                  </p>
                )}
              </div>
            );
          })}
          <Button onClick={salvar} disabled={salvando || buscando || itens.some(it => !it.escolhido)} className="h-11 w-full rounded-xl">Registrar</Button>
        </div>
      )}
      <details className="mt-4 text-xs text-muted-foreground"><summary className="cursor-pointer">Fonte dos valores</summary><p className="mt-2">Valores: TACO 4ª ed., NEPA/UNICAMP e USDA FoodData Central. Produtos americanos mantêm os nomes do rótulo; fórmulas podem variar por país. Sem quantidade indicada: 100 g por alimento e 5 g para açúcar. Leite sem especificação: integral. Confira as quantidades e o rótulo antes de registrar.</p></details>
    </section>
  );
}
