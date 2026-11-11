import { normalizar, type AlimentoTaco } from "./diario";

// Marcas conhecidas reconhecidas mesmo sem a palavra "marca"; a forma canônica é a do rótulo.
const MARCAS_CONHECIDAS: Record<string, string> = { traquinas: "Trakinas", trakinas: "Trakinas", "sonho de valsa": "Sonho de Valsa" };

export function consultaAlimento(termo: string) {
  const t = normalizar(termo);
  const [alimento = "", marca] = t.split(/\s+(?:da\s+)?marca\s+/);
  if (marca?.trim()) return { alimento: alimento.trim(), marca: normalizar(MARCAS_CONHECIDAS[marca.trim()] ?? marca.trim()) };
  for (const forma of Object.keys(MARCAS_CONHECIDAS)) {
    const re = new RegExp(`\\s*\\b${forma}\\b\\s*`);
    if (re.test(t)) return { alimento: t.replace(re, " ").replace(/\s+/g, " ").trim(), marca: normalizar(MARCAS_CONHECIDAS[forma] ?? forma) };
  }
  return { alimento: alimento.trim(), marca: null };
}

export function ordenarAlimentos(termo: string, alimentos: AlimentoTaco[]) {
  const { alimento, marca } = consultaAlimento(termo);
  const preferencias: Record<string, string> = {
    leite: "leite de vaca integral", cafe: "cafe infusao", acucar: "acucar refinado",
    cuscuz: "cuscuz de milho cozido", pao: "pao trigo frances", banana: "banana prata", ovo: "ovo de galinha inteiro cozido", "queijo minas": "queijo minas frescal",
  };
  const score = (a: AlimentoTaco) => {
    const d = normalizar(a.descricao).replace(/[.,]/g, "").replace(/\s+/g, " ");
    let s = a.fonte === "usda" ? 0 : 10;
    if (preferencias[alimento] && d.startsWith(preferencias[alimento])) s += 100;
    if (marca && normalizar(a.marca ?? "").includes(marca)) s += 200;
    if (alimento === "leite" && /^(?:organic )?whole milk(?:,|$)/i.test(a.descricao)) s += 110;
    if (alimento === "leite" && /coco|po\b|cheese|yogurt|chocolate|kefir/i.test(d)) s -= 150;
    if (!nutrientesDisponiveis(a)) s -= 1000;
    return s;
  };
  return [...alimentos].sort((a, b) => score(b) - score(a));
}

export function nutrientesDisponiveis(a: AlimentoTaco) {
  return [a.kcal, a.proteina_g, a.lipideos_g, a.carboidrato_g].every(v => v != null);
}

export function escolherAlimento(termo: string, opcoes: AlimentoTaco[]) {
  const { alimento, marca } = consultaAlimento(termo);
  const exata = opcoes.find(a => nutrientesDisponiveis(a) && (!marca || normalizar(a.marca ?? "").includes(marca)));
  const generico = marca && alimento === "queijo minas"
    ? ordenarAlimentos(alimento, opcoes).find(a => a.fonte !== "usda" && normalizar(a.descricao).replace(/[.,]/g, "").includes("queijo minas frescal") && nutrientesDisponiveis(a))
    : undefined;
  return { escolhido: exata ?? generico, generico: !exata && !!generico };
}

export function nomeAlimento(descricao: string) {
  return descricao.replace(/^(?:organic )?whole milk(?=\s*(?:·|$))/i, "Leite integral");
}

export function porcaoEstimada(termo: string) {
  return consultaAlimento(termo).alimento === "acucar" ? 5 : 100;
}
/** Medidas caseiras por alimento (pesos médios aproximados; sempre exibidos como estimativa). */
export type MedidaCaseira = { id: string; rotulo: string; gramas: number };
const MEDIDAS: [RegExp, MedidaCaseira[]][] = [
  [/^pao(?: frances)?$/, [{ id: "unidade", rotulo: "unidade (50 g)", gramas: 50 }, { id: "banda", rotulo: "banda/metade (25 g)", gramas: 25 }]],
  [/^pao de forma$|^pao integral$/, [{ id: "fatia", rotulo: "fatia (25 g)", gramas: 25 }]],
  [/^banana/, [{ id: "pequena", rotulo: "pequena (50 g)", gramas: 50 }, { id: "media", rotulo: "média (75 g)", gramas: 75 }, { id: "grande", rotulo: "grande (100 g)", gramas: 100 }]],
  [/^maca$/, [{ id: "pequena", rotulo: "pequena (100 g)", gramas: 100 }, { id: "media", rotulo: "média (130 g)", gramas: 130 }, { id: "grande", rotulo: "grande (180 g)", gramas: 180 }]],
  [/^laranja/, [{ id: "pequena", rotulo: "pequena (120 g)", gramas: 120 }, { id: "media", rotulo: "média (160 g)", gramas: 160 }, { id: "grande", rotulo: "grande (220 g)", gramas: 220 }]],
  [/^ovos?/, [{ id: "unidade", rotulo: "unidade (50 g)", gramas: 50 }]],
  [/^queijo/, [{ id: "fatia", rotulo: "fatia (20 g)", gramas: 20 }]],
  [/^(?:bombom )?sonho de valsa$|^bombom$/, [{ id: "unidade", rotulo: "unidade (21,5 g)", gramas: 21.5 }]],
];
export function medidasAlimento(termo: string): MedidaCaseira[] {
  const { alimento, marca } = consultaAlimento(termo);
  const chave = [alimento, marca].filter(Boolean).join(" ").trim();
  const lista = MEDIDAS.find(([re]) => re.test(chave) || re.test(alimento) || (!!marca && re.test(marca)))?.[1] ?? [];
  if (!lista.length) return [];
  // "unidade" é sinônimo do tamanho médio para frutas.
  return lista.some(m => m.id === "unidade") || !lista.some(m => m.id === "media") ? lista : [...lista, { ...lista.find(m => m.id === "media")!, id: "unidade", rotulo: "unidade (média)" }];
}
