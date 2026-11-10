// Calculadora de metas (ponto de partida; a pessoa pode ajustar tudo).
// Fórmula de Mifflin-St Jeor + fator de atividade + ajuste pelo objetivo.

export const ATIVIDADES = [
  { v: "sedentario", l: "Sedentário", d: "Trabalho sentado e faço pouco ou nenhum exercício focado.", fator: 1.2 },
  { v: "leve", l: "Levemente ativo", d: "Trabalho sentado e faço caminhadas ou treino 1–3x na semana.", fator: 1.375 },
  { v: "moderado", l: "Moderadamente ativo", d: "Cardio ou exercício intenso 3–5x na semana.", fator: 1.55 },
  { v: "muito", l: "Muito ativo", d: "Treino intenso 6–7x na semana e trabalho físico pesado.", fator: 1.725 },
] as const;
export type Atividade = (typeof ATIVIDADES)[number]["v"];

export const OBJETIVOS = [
  { v: "emagrecer", l: "Emagrecer", ajuste: -500, proteinaPorKg: 1.8, nome: "emagrecer" },
  { v: "manter", l: "Manter o peso", ajuste: 0, proteinaPorKg: 1.6, nome: "manter o peso" },
  { v: "ganhar_massa", l: "Ganhar massa muscular", ajuste: 300, proteinaPorKg: 2.0, nome: "ganhar massa muscular" },
  { v: "ganhar", l: "Ganhar peso", ajuste: 500, proteinaPorKg: 1.6, nome: "ganhar peso" },
] as const;

export const KCAL_POR_KG_CORPORAL = 7700;
export const FRACAO_GORDURA = 0.25;
export const AGUA_ML_POR_KG = 35;

export type DadosCalculo = {
  idade: number | null;
  peso_kg: number | null;
  altura_cm: number | null;
  sexo: string | null;
  atividade: string | null;
  objetivo: string | null;
};

export function faltandoParaCalcular(d: DadosCalculo): string[] {
  const f: string[] = [];
  if (!d.idade) f.push("idade");
  if (!d.peso_kg) f.push("peso");
  if (!d.altura_cm) f.push("altura");
  if (!d.atividade) f.push("nível de atividade");
  if (!d.objetivo) f.push("objetivo");
  return f;
}

export function ajusteSexo(sexo: string | null) {
  return sexo === "masculino" ? 5 : sexo === "feminino" ? -161 : -78; // sem sexo: média
}

export function calcularMetas(d: DadosCalculo) {
  if (faltandoParaCalcular(d).length) return null;
  const ativ = ATIVIDADES.find((a) => a.v === d.atividade)!;
  const obj = OBJETIVOS.find((o) => o.v === d.objetivo)!;
  const basal = 10 * d.peso_kg! + 6.25 * d.altura_cm! - 5 * d.idade! + ajusteSexo(d.sexo);
  const manutencao = basal * ativ.fator;
  const kcal = Math.round(manutencao + obj.ajuste);
  const proteinas_g = Math.round(obj.proteinaPorKg * d.peso_kg!);
  const gorduras_g = Math.round((kcal * FRACAO_GORDURA) / 9);
  const carboidratos_g = Math.max(0, Math.round((kcal - proteinas_g * 4 - gorduras_g * 9) / 4));
  const agua_ml = Math.round((AGUA_ML_POR_KG * d.peso_kg!) / 50) * 50;
  return {
    basal: Math.round(basal), manutencao: Math.round(manutencao), ativ, obj,
    metas: { kcal, carboidratos_g, proteinas_g, gorduras_g, agua_ml },
  };
}

/** Variação estimada de peso por semana, em gramas (negativo = perder). */
export function ritmoSemanalG(kcal: number, manutencao: number) {
  return Math.round(((kcal - manutencao) * 7 * 1000) / KCAL_POR_KG_CORPORAL);
}
