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
export type Medidas = { copoMl?: number };
const NUM_MEDIDA: Record<string, number> = { um: 1, uma: 1, dois: 2, duas: 2, tres: 3, meio: 0.5, meia: 0.5 };
const MEDIDA_G = (medida: string, medidas?: Medidas): number | null => {
  if (/^copos?$/.test(medida)) return medidas?.copoMl ?? 200;
  if (/^xicaras?$/.test(medida)) return 200;
  if (/^colheres? de sopa$/.test(medida)) return 15;
  if (/^colheres? de cha$/.test(medida)) return 5;
  if (/^colheres? de sobremesa$/.test(medida)) return 10;
  return null;
};

/** Refeições são contexto da fala, nunca termos de busca no catálogo. */
export function interpretarFrase(texto: string, refeicaoInicial: string) {
  const frase = normalizar(texto);
  const marcadores = [...frase.matchAll(MARCADOR_REFEICAO)];
  const resultado: { termo: string; gramas: number | null; refeicao: string }[] = [];
  let inicio = 0;
  let refeicao = refeicaoInicial;
  for (const marcador of marcadores) {
    const nome = marcador[1] ? REFEICOES_FALA[marcador[1]] : undefined;
    if (!nome) continue;
    const antes = frase.slice(inicio, marcador.index);
    const fim = (marcador.index ?? 0) + marcador[0].length;
    // “Comi arroz no almoço” também define a refeição do alimento anterior.
    const destino = !frase.slice(fim).trim() ? nome : refeicao;
    resultado.push(...dividirItens(antes).map(interpretarItem).filter(p => p.termo).map(p => ({ ...p, refeicao: destino })));
    refeicao = nome;
    inicio = fim;
  }
  resultado.push(...dividirItens(frase.slice(inicio)).map(interpretarItem).filter(p => p.termo).map(p => ({ ...p, refeicao })));
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

/** Extrai gramas (g ou ml, tratados 1:1) e os termos de busca de um item. */
export function interpretarItem(item: string): { termo: string; gramas: number | null } {
  let gramas: number | null = null;
  let t = ` ${normalizar(item)} `;
  const m = t.match(/\s(\d+(?:[.,]\d+)?|cem|duzent[oa]s|trezent[oa]s|quinhent[oa]s|cinquenta|mil)\s*(g|gr|gramas?|ml|mililitros?)\s/);
  if (m) {
    const valor = m[1];
    const n = valor ? NUMEROS[valor] ?? Number(valor.replace(",", ".")) : 0;
    if (n > 0) gramas = n;
    t = t.replace(m[0], " ");
  }
  const termo = t
    .split(" ")
    .filter((w) => w && !PALAVRAS_VAZIAS.has(w) && !/^\d/.test(w))
    .join(" ");
  return { termo, gramas };
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
