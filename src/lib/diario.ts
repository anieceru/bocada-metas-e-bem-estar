export type AlimentoTaco = {
  id: number;
  descricao: string;
  kcal: number | null;
  proteina_g: number | null;
  lipideos_g: number | null;
  carboidrato_g: number | null;
  fonte?: "taco" | "usda";
  marca?: string | null;
  gtin_upc?: string | null;
};

export function referenciaAlimento(a: AlimentoTaco) {
  return a.fonte === "usda"
    ? { alimento_id: null, usda_fdc_id: a.id }
    : { alimento_id: a.id, usda_fdc_id: null };
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
  "de", "do", "da", "dos", "das", "com", "no", "na", "o", "a", "os", "as", "pouco", "porcao", "prato",
]);

const NUMEROS: Record<string, number> = { cem: 100, duzentos: 200, duzentas: 200, trezentos: 300, trezentas: 300, quinhentos: 500, quinhentas: 500, cinquenta: 50, mil: 1000 };

/** Divide uma fala/texto em itens: "arroz, feijão e 100 g de frango". */
export function dividirItens(texto: string): string[] {
  return normalizar(texto)
    .split(/,|;|\s+e\s+|\s+mais\s+|\s+com\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1);
}

/** Extrai gramas (g ou ml, tratados 1:1) e os termos de busca de um item. */
export function interpretarItem(item: string): { termo: string; gramas: number | null } {
  let gramas: number | null = null;
  let t = ` ${item} `;
  const m = t.match(/\s(\d+(?:[.,]\d+)?|cem|duzent[oa]s|trezent[oa]s|quinhent[oa]s|cinquenta|mil)\s*(g|gr|gramas?|ml|mililitros?)\s/);
  if (m) {
    const n = NUMEROS[m[1]!] ?? Number(m[1]!.replace(",", "."));
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
