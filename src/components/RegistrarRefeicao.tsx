import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Mic, MicOff, Keyboard, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
   calcularNutrientes, hojeISO, interpretarFrase, refeicaoPorHorario, normalizar, referenciaAlimento, type AlimentoTaco,
} from "@/lib/diario";
import { verificarAlertaMetas } from "@/lib/notificacoes.functions";
import { consultaAlimento, escolherAlimento, nomeAlimento, nutrientesDisponiveis, ordenarAlimentos, porcaoEstimada, medidasAlimento } from "@/lib/identificar-alimentos";
import { AutorizacaoIA, useAutorizacaoIA } from "./AutorizacaoIA";
import { interpretarDescricaoIA } from "@/lib/interpretacao-ia.functions";
import type { ItemInterpretado } from "@/lib/interpretacao-ia";

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

type Item = { termo: string; gramas: string; qtd: string; medida: string; refeicao: string; opcoes: AlimentoTaco[]; escolhido: string | null; aviso?: string | undefined };
const chave = (a: AlimentoTaco) => `${a.fonte ?? "taco"}:${a.id}`;
const num = (v: string) => Number(v.replace(",", "."));
function gramasDe(termo: string, qtd: string, medida: string) {
  const n = num(qtd);
  if (medida === "g") return qtd;
  const m = medidasAlimento(termo).find(x => x.id === medida);
  return m && n > 0 ? String(Math.round(n * m.gramas * 10) / 10) : "";
}
function medidaInicial(p: ItemInterpretado) {
  const ms = medidasAlimento(p.termo);
  const m = p.unidades && p.gramas == null ? ms.find(x => x.id === p.medida) ?? ms.find(x => x.id === "unidade") : undefined;
  if (m && p.unidades) return { qtd: String(p.unidades).replace(".", ","), medida: m.id, gramas: String(Math.round(p.unidades * m.gramas * 10) / 10), aviso: `${String(p.unidades).replace(".", ",")} × ${m.rotulo}: peso médio estimado. Ajuste se necessário.` };
  const g = String(p.gramas ?? porcaoEstimada(p.termo));
  return { qtd: g, medida: "g", gramas: g, aviso: undefined };
}

async function buscar(termo: string): Promise<AlimentoTaco[]> {
  const { alimento, marca } = consultaAlimento(termo);
  const q = normalizar(alimento || marca || "").replace(/[.,]/g, " ").trim();
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
  const [{ data: produtos, error: erroProdutos }, { data: nacionais, error: erroNacionais }] = await Promise.all([
    supabase.rpc("buscar_alimentos_catalogo", { q: consulta, fonte: "usda" }),
    supabase.rpc("buscar_alimentos_catalogo", { q: consulta, fonte: "br" }),
  ]);
  if (erroProdutos) throw erroProdutos;
  if (erroNacionais) throw erroNacionais;
  let usda = [...(produtos ?? []), ...(nacionais ?? [])] as AlimentoTaco[];
  if (q === "leite" && !marca) usda = usda.filter(a => /^(?:organic )?whole milk(?:,|$)/i.test(a.descricao));
  if (marca) {
    // "bolacha" e "biscoito" nomeiam o mesmo produto no rótulo e na fala.
    const palavras = q.split(" ").filter(w => w.length > 2 && w !== marca).map(w => (w === "bolacha" ? "biscoito" : w));
    usda = usda.filter(a => normalizar(a.marca ?? "").includes(marca) && palavras.every(w => normalizar(a.descricao).includes(w)));
  }
  return ordenarAlimentos(termo, [...locais, ...usda]);
}

export function RegistrarRefeicao({ userId, dia = hojeISO(), refeicoes = ["Café da manhã", "Almoço", "Jantar", "Lanches"], refeicaoInicial, copoMl, onSaved }: { userId: string; dia?: string; refeicoes?: string[]; refeicaoInicial?: string; copoMl?: number; onSaved?: () => void }) {
  const qc = useQueryClient();
  const { data: autorizaIA } = useAutorizacaoIA(userId);
  const interpretarIA = useServerFn(interpretarDescricaoIA);
  const [suportaVoz, setSuportaVoz] = useState<boolean | null>(null);
  const [modo, setModo] = useState<"voz" | "texto">("voz");
  const [ouvindo, setOuvindo] = useState(false);
  const [texto, setTexto] = useState("");
  const [parcial, setParcial] = useState("");
  const [itens, setItens] = useState<Item[]>([]);
  const [origem, setOrigem] = useState<"voz" | "digitado">("digitado");
  const [salvando, setSalvando] = useState(false);
  const [refeicao, setRefeicao] = useState(refeicaoInicial ?? refeicoes[0] ?? "Lanches");
  useEffect(() => { if (!refeicaoInicial) setRefeicao(refeicaoPorHorario(refeicoes)); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const pararPedido = useRef(false);
  const [buscando, setBuscando] = useState(false);
  const [entendendo, setEntendendo] = useState(false);
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
    if (via === "voz") setTexto(frase);
    const versao = ++buscaAtual.current;
    let partes: ItemInterpretado[];
    if (autorizaIA) {
      setBuscando(true); setEntendendo(true); setItens([]);
      try {
        const resultado = await interpretarIA({ data: { frase, refeicao } });
        if (versao !== buscaAtual.current) return;
        if (resultado.erro) { toast.error(resultado.erro); return; }
        partes = resultado.itens;
      } catch {
        toast.error("Não foi possível interpretar com IA. Sua descrição foi mantida."); return;
      } finally {
        if (versao === buscaAtual.current) { setEntendendo(false); setBuscando(false); }
      }
    } else partes = interpretarFrase(frase, refeicao, { copoMl });
    if (!partes.length) return void toast("Não entendi os alimentos. Tente de novo ou digite.");
    const primeira = partes[0];
    if (primeira) setRefeicao(primeira.refeicao);
    setBuscando(true);
    setItens(partes.map(p => { const m = medidaInicial(p); return { termo: p.termo, gramas: m.gramas, qtd: m.qtd, medida: m.medida, refeicao: p.refeicao, opcoes: [], escolhido: null }; }));
    try {
    await Promise.all(
      partes.map(async (p, i) => {
        const opcoes = await buscarUmaVez(p.termo);
        if (versao !== buscaAtual.current) return;
        const { marca } = consultaAlimento(p.termo);
         const { escolhido: a, generico } = escolherAlimento(p.termo, opcoes);
         const baseAviso = generico ? `Marca ${marca} não encontrada. Usando queijo Minas frescal padrão como estimativa; os valores não são da marca ${marca}.` : marca && !a ? `Marca ${marca} não encontrada. Escolha uma alternativa apenas se quiser usar valores genéricos.` : p.termo === "acucar" && p.gramas == null ? "Açúcar estimado: 1 colher de chá rasa (5 g). Ajuste à quantidade usada." : p.termo === "leite" ? "Leite integral padrão: valores estimados. Confira com o rótulo do seu leite." : undefined;
         const aviso = [medidaInicial(p).aviso, p.medidaOriginal || medidaInicial(p).aviso ? undefined : p.quantidadeOriginal ? `Quantidade descrita: ${p.quantidadeOriginal}. Confira a conversão em gramas.` : undefined, p.medidaOriginal ? `Medida caseira: ${p.medidaOriginal} ≈ ${p.gramas} g. Ajuste se necessário.` : undefined, baseAviso].filter(Boolean).join(" ") || undefined;
         setItens(arr => arr.map((it, j) => j === i ? { ...it, opcoes, escolhido: a ? chave(a) : null, aviso } : it));
      }),
    );
    } catch {
      toast.error("Não foi possível buscar alimentos. Tente de novo.");
    } finally {
      if (versao === buscaAtual.current) setBuscando(false);
    }
  }

  // Grava até a pessoa tocar de novo: pausas não encerram o ditado.
  function ouvir() {
    if (ouvindo) { pararPedido.current = true; return rec.current?.stop(); }
    pararPedido.current = false;
    const r = criarReconhecimento();
    if (!r) return setModo("texto");
    r.lang = "pt-BR";
    r.interimResults = true;
    r.continuous = true;
    finalRef.current = "";
    let acumulado = "";
    r.onresult = (e) => {
      let fin = "", tmp = "";
      for (let i = 0; i < e.results.length; i++) {
        const res = e.results[i];
        const transcript = res?.[0]?.transcript;
        if (!res || !transcript) continue;
        if (res.isFinal) fin += transcript; else tmp += transcript;
      }
      finalRef.current = `${acumulado} ${fin}`.trim();
      setParcial(`${finalRef.current} ${tmp}`.trim());
    };
    r.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        toast("Sem acesso ao microfone. Você pode digitar.");
        pararPedido.current = true;
        setModo("texto");
      }
    };
    r.onend = () => {
      if (!pararPedido.current) {
        acumulado = finalRef.current;
        try { r.start(); return; } catch { /* segue para encerrar */ }
      }
      setOuvindo(false);
      const frase = finalRef.current.trim();
      if (frase) interpretar(frase, "voz"); // processa quando a pessoa toca em parar
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
    const { escolhido: a, generico } = escolherAlimento(termo, opcoes);
    setItens((arr) => arr.map((it, j) => (j === i ? { ...it, termo, ...(medidasAlimento(termo).some(m => m.id === it.medida) ? {} : { medida: "g", qtd: it.gramas }), opcoes, escolhido: a ? chave(a) : null, aviso: generico ? `Marca ${marca} não encontrada. Usando queijo Minas frescal padrão como estimativa; os valores não são da marca ${marca}.` : marca && !a ? `Marca ${marca} não encontrada. Escolha uma alternativa apenas se quiser usar valores genéricos.` : undefined } : it)));
  }

  async function salvar() {
    if (itens.some(it => !it.escolhido || !it.opcoes.some(a => chave(a) === it.escolhido && nutrientesDisponiveis(a)) || !(Number(it.gramas.replace(",", ".")) > 0 && Number(it.gramas.replace(",", ".")) <= 5000))) return void toast("Confira todos os alimentos e quantidades antes de registrar.");
    const linhas = itens.flatMap((it) => {
      const a = it.opcoes.find((o) => chave(o) === it.escolhido);
      const g = Number(it.gramas.replace(",", "."));
      if (!a || !(g > 0 && g <= 5000)) return [];
      const nome = nomeAlimento(a.descricao);
      const descricao = (a.fonte === "usda" || a.fonte === "br") && a.marca ? `${nome} · ${a.marca}` : nome;
      return [{ user_id: userId, dia, refeicao: it.refeicao, ...referenciaAlimento(a), descricao: descricao.slice(0, 200), gramas: g, origem, ...calcularNutrientes(a, g) }];
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
        <select aria-label="Refeição do registro" value={refeicao} onChange={(e) => { const nome = e.target.value; setRefeicao(nome); setItens(arr => arr.map(it => ({ ...it, refeicao: nome }))); }} className="mt-1 h-10 w-full rounded-md border bg-background px-3">
          {[...new Set([...refeicoes, refeicao, ...itens.map(it => it.refeicao)])].map((nome) => <option key={nome}>{nome}</option>)}
        </select>
      </label>
      <AutorizacaoIA userId={userId} disabled={buscando || ouvindo} />
      {modo === "voz" && suportaVoz ? (
        <div className="text-center">
          <Button
            type="button"
            onClick={ouvir}
            disabled={buscando}
            aria-pressed={ouvindo}
            aria-label={ouvindo ? "Parar de ouvir" : "Falar o que comeu"}
            className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${ouvindo ? "animate-pulse bg-destaque text-destaque-foreground" : "bg-primary text-primary-foreground"}`}
          >
            {ouvindo ? <MicOff className="h-8 w-8" aria-hidden /> : <Mic className="h-8 w-8" aria-hidden />}
          </Button>
          <p className="mt-3 text-sm font-medium">{ouvindo ? "Ouvindo… toque de novo quando terminar" : "Toque e diga o que você comeu"}</p>
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
            <Button type="submit" disabled={buscando || ouvindo || !texto.trim()} className="flex-1 rounded-xl"><Search className="h-4 w-4" />{entendendo ? "Entendendo…" : buscando ? "Buscando…" : "Buscar alimentos"}</Button>
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
                <p className="mb-2 text-xs font-medium text-muted-foreground">{it.refeicao}</p>
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
                  <div className="mt-2 space-y-2">
                    <select
                      aria-label="Alimento"
                      value={it.escolhido ?? ""}
                      onChange={(e) => setItens(itens.map((x, j) => (j === i ? { ...x, escolhido: e.target.value } : x)))}
                      className="h-9 min-w-0 w-full rounded-md border border-input bg-background px-2 text-sm"
                    >
                      <option value="" disabled>Escolha um alimento</option>
                       {it.opcoes.map((o) => <option key={chave(o)} value={chave(o)}>{nomeAlimento(o.descricao)}{o.marca ? ` · ${o.marca}` : ""}</option>)}
                    </select>
                    <div className="grid grid-cols-[5rem_1fr] gap-2">
                      <Input aria-label="Quantidade" inputMode="decimal" value={it.qtd} onChange={(e) => setItens(itens.map((x, j) => (j === i ? { ...x, qtd: e.target.value, gramas: gramasDe(x.termo, e.target.value, x.medida) } : x)))} className="h-9" />
                      <select aria-label="Medida" value={it.medida} onChange={(e) => setItens(itens.map((x, j) => { if (j !== i) return x; const medida = e.target.value; const qtd = medida === "g" ? x.gramas : x.medida === "g" ? "1" : x.qtd; return { ...x, medida, qtd, gramas: gramasDe(x.termo, qtd, medida) }; }))} className="h-9 min-w-0 rounded-md border border-input bg-background px-2 text-sm">
                        <option value="g">gramas (g)</option>
                        {medidasAlimento(it.termo).map(m => <option key={m.id} value={m.id}>{m.rotulo}</option>)}
                      </select>
                    </div>
                    {it.medida !== "g" && it.gramas && <p className="text-xs text-muted-foreground">≈ {it.gramas.replace(".", ",")} g (peso médio estimado)</p>}
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
