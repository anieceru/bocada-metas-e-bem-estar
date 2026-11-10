import { normalizar, type AlimentoTaco } from "./diario";

// Marcas conhecidas reconhecidas mesmo sem a palavra "marca"; a forma canônica é a do rótulo.
const MARCAS_CONHECIDAS: Record<string, string> = { traquinas: "Trakinas", trakinas: "Trakinas" };

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
    cuscuz: "cuscuz de milho cozido", "queijo minas": "queijo minas frescal",
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