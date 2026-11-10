import type { Metas } from "./config";

export const MACROS = [
  { chave: "proteinas_g", nome: "Proteínas", kcalPorG: 4 },
  { chave: "carboidratos_g", nome: "Carbos", kcalPorG: 4 },
  { chave: "gorduras_g", nome: "Gorduras", kcalPorG: 9 },
] as const;
export type ChaveMacro = (typeof MACROS)[number]["chave"];
export type ModoMacros = "porcentagem" | "gramas";

export function totalMacros(metas: Partial<Metas>) {
  return MACROS.reduce((s, m) => s + (metas[m.chave] ?? 0) * m.kcalPorG, 0);
}

export function macrosExcedemCalorias(metas: Partial<Metas>) {
  return totalMacros(metas) > (metas.kcal ?? 0);
}

export function percentualMacro(gramas: number, kcalPorG: number, kcal: number) {
  return kcal > 0 ? gramas * kcalPorG / kcal * 100 : 0;
}

// Inteiros são exigidos pelo armazenamento atual. Arredondar para baixo
// evita que uma distribuição de 100% exceda as calorias ao ser persistida.
export function gramasPorPercentual(percentual: number, kcalPorG: number, kcal: number) {
  return Math.floor(percentual / 100 * kcal / kcalPorG + 1e-9);
}