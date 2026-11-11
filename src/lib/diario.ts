export type AlimentoTaco = {
  id: number;
  descricao: string;
  kcal: number | null;
  proteina_g: number | null;
  lipideos_g: number | null;
  carboidrato_g: number | null;
  fonte?: "taco" | "usda" | "br";
  marca?: string | null;
  gtin_upc?: string | null;
};

export function referenciaAlimento(a: AlimentoTaco) {
  if (a.fonte === "usda") return { alimento_id: null, usda_fdc_id: a.id, br_ean: null };
  if (a.fonte === "br") return { alimento_id: null, usda_fdc_id: null, br_ean: a.id };
  return { alimento_id: a.id, usda_fdc_id: null, br_ean: null };
}

export function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const PALAVRAS_VAZIAS = new Set([
  "comi", "tomei", "bebi", "almocei", "jantei", "lanchei", "eu", "hoje", "um", "uma", "uns", "umas",
  "de", "do", "da", "dos", "das", "com", "no", "na", "o", "a", "os", "as", "pouco", "porcao", "prato", "ne", "e", "mais",
]);

const NUMEROS: Record<string, number> = { cem: 100, duzentos: 200, duzentas: 200, trezentos: 300, trezentas: 300, quinhentos: 500, quinhentas: 500, cinquenta: 50, mil: 1000 };

const REFEICOES_FALA: Record<string, string> = {
  "cafe da manha": "Café da manhã", almoco: "Almoço", lanche: "Lanches", lanches: "Lanches",
  "lanche da tarde": "Lanches", "lanches da tarde": "Lanches", "lanche da manha": "Lanches", "lanches da manha": "Lanches",
  jantar: "Jantar",
};
// A refeição pode vir com preposição ("no almoço"), no início da fala ("café da manhã: leite e pão") ou após pontuação.
const MARCADOR_REFEICAO = /(?:^|[.,;]\s*|\b(?:no|na|para o|para a)\s+)(cafe da manha|almoco|lanches?(?:\s+da\s+(?:tarde|manha))?|jantar)\b/g;

/** Medidas caseiras → gramas/ml. "copo" usa o tamanho do copo da pessoa (padrão 200 ml). */
export type Medidas = { copoMl?: number | undefined };
const NUM_MEDIDA: Record<string, number> = { um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, meio: 0.5, meia: 0.5 };
const SINGULAR: Record<string, string> = { paes: "pao", bananas: "banana", ovos: "ovo", macas: "maca", laranjas: "laranja", bombons: "bombom" };

/** A fala menciona uma refeição ("no almoço", "café da manhã: ...")? */
export function mencionaRefeicao(texto: string) {
  return new RegExp(MARCADOR_REFEICAO.source).test(normalizar(texto));
}

/** Sugere a refeição pelo horário quando a pessoa não diz qual foi. */
export function refeicaoPorHorario(refeicoes: string[], data = new Date()) {
  const h = data.getHours() + data.getMinutes() / 60;
  const alvo = h < 10.5 ? "Café da manhã" : h < 15 ? "Almoço" : h < 18.5 ? "Lanches" : "Jantar";
  return refeicoes.includes(alvo) ? alvo : refeicoes[0] ?? "Lanches";
}
const MEDIDA_G = (medida: string, medidas?: Medidas): number | null => {
  if (/^copos?$/.test(medida)) return medidas?.copoMl ?? 200;
  if (/^xicaras?$/.test(medida)) return 200;
  if (/^colheres? de sopa$/.test(medida)) return 15;
  if (/^colheres? de cha$/.test(medida)) return 5;
  if (/^colheres? de sobremesa$/.test(medida)) return 10;
  return null;
};

/** Refeições são contexto da fala, nunca termos de busca no catálogo. */
export function interpretarFrase(texto: string, refeicaoInicial: string, medidas?: Medidas) {
  const frase = normalizar(texto);
  const marcadores = [...frase.matchAll(MARCADOR_REFEICAO)];
  const resultado: (ItemFalado & { refeicao: string })[] = [];
  let inicio = 0;
  let refeicao = refeicaoInicial;
  for (const marcador of marcadores) {
    const nome = marcador[1] ? REFEICOES_FALA[marcador[1]] : undefined;
    if (!nome) continue;
    const antes = frase.slice(inicio, marcador.index);
    const fim = (marcador.index ?? 0) + marcador[0].length;
    // “Comi arroz no almoço” também define a refeição do alimento anterior.
    const destino = !frase.slice(fim).trim() ? nome : refeicao;
    resultado.push(...dividirItens(antes).map(item => interpretarItem(item, medidas)).filter(p => p.termo).map(p => ({ ...p, refeicao: destino })));
    refeicao = nome;
    inicio = fim;
  }
  resultado.push(...dividirItens(frase.slice(inicio)).map(item => interpretarItem(item, medidas)).filter(p => p.termo).map(p => ({ ...p, refeicao })));
  return resultado;
}

/** Divide uma fala/texto em itens: "arroz, feijão e 100 g de frango". */
export function dividirItens(texto: string): string[] {
  const t = normalizar(texto).replace(MARCADOR_REFEICAO, " ").replace(/\bne\b/g, " ").replace(/(\d)[,.](\d)/g, "$1decimal$2")
    .replace(/\b(cafe|cha)\s+(?:tinha|tem|estava com|foi com)\s+/g, "$1 com ")
    .replace(/\bsem\s+acucar\b/g, "")
    .replace(/\bacucar\s+(?=cuscuz\b)/g, "acucar, ");
  const partes = t
    .split(/[.,;]|\s+e\s+|\s+mais\s+|\s+com\s+/)
    .map(s => s.replace(/decimal/g, "."))
    .map((s) => s.trim())
    .filter((s) => s.length > 1);
  // A repetição na frase seguinte descreve a mesma bebida, não outra porção.
  return partes.filter((s, i) => !["cafe", "cha"].includes(s) || partes.indexOf(s) === i);
}

/** Extrai gramas (g ou ml, tratados 1:1; medidas caseiras convertidas) e os termos de busca de um item. */
export type ItemFalado = { termo: string; gramas: number | null; medidaOriginal?: string; unidades?: number; medida?: string };
export function interpretarItem(item: string, medidas?: Medidas): ItemFalado {
  let gramas: number | null = null;
  let medidaOriginal: string | undefined;
  let t = ` ${normalizar(item)} `;
  const medida = t.match(/\s(\d+(?:[.,]\d+)?|um|uma|dois|duas|tres|meio|meia)?\s*(copos?|xicaras?|colheres?\s+de\s+(?:sopa|cha|sobremesa))\s/);
  if (medida) {
    const unidade = medida[2]!.replace(/\s+/g, " ");
    const g = MEDIDA_G(unidade, medidas);
    if (g != null) {
      const n = medida[1] ? NUM_MEDIDA[medida[1]] ?? Number(medida[1].replace(",", ".")) : 1;
      gramas = Math.round(n * g * 10) / 10;
      medidaOriginal = `${medida[1] ?? "1"} ${unidade}`;
      t = t.replace(medida[0], " ");
    }
  }
  const m = t.match(/\s(\d+(?:[.,]\d+)?|cem|duzent[oa]s|trezent[oa]s|quinhent[oa]s|cinquenta|mil)\s*(g|gr|gramas?|ml|mililitros?)\s/);
  if (m) {
    const valor = m[1];
    const n = valor ? NUMEROS[valor] ?? Number(valor.replace(",", ".")) : 0;
    if (n > 0) gramas = n;
    t = t.replace(m[0], " ");
  }
  // Contagens: "dois pães", "duas bandas de pão" (banda = metade), "uma banana média".
  let unidades: number | undefined;
  let medida: string | undefined;
  if (gramas == null && !medidaOriginal) {
    const c = t.match(/\s(\d+(?:[.,]\d+)?|um|uma|dois|duas|tres|quatro|cinco|meio|meia)\s+(?:(bandas?|fatias?|unidades?)\s+(?:de\s+)?)?(?=[a-z])/);
    if (c) {
      unidades = NUM_MEDIDA[c[1]!] ?? Number(c[1]!.replace(",", "."));
      medida = c[2] ? c[2].replace(/s$/, "").replace(/^unidade$/, "unidade") : "unidade";
      t = t.replace(c[0], " ");
    }
    const tam = t.match(/\s(pequen[oa]s?|medi[oa]s?|grandes?)\s/);
    if (tam) {
      medida = /^p/.test(tam[1]!) ? "pequena" : /^m/.test(tam[1]!) ? "media" : "grande";
      unidades ??= 1;
      t = t.replace(tam[0], " ");
    }
  }
  const termo = t
    .split(" ")
    .filter((w) => w && !PALAVRAS_VAZIAS.has(w) && !/^\d/.test(w))
    .map((w) => SINGULAR[w] ?? w)
    .join(" ");
  const r: ItemFalado = { termo, gramas };
  if (medidaOriginal) r.medidaOriginal = medidaOriginal;
  if (unidades && unidades > 0 && medida) { r.unidades = unidades; r.medida = medida; }
  return r;
}

export function calcularNutrientes(a: AlimentoTaco, gramas: number) {
  const f = gramas / 100;
  const r = (v: number | null) => Math.round((v ?? 0) * f * 10) / 10;
  return {
    kcal: r(a.kcal),
    carboidratos_g: r(a.carboidrato_g),
    proteinas_g: r(a.proteina_g),
    gorduras_g: r(a.lipideos_g),
  };
}

export function hojeISO(d = new Date()): string {
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}
