import { describe, expect, it } from "vitest";
import { gramasPorPercentual, macrosExcedemCalorias, percentualMacro, totalMacros } from "@/lib/macros";
import { calcularMetas } from "@/lib/calculo-metas";

describe("distribuição de macros", () => {
  it("30% carbos, 30% gorduras e 40% proteínas cabem em 2000 kcal", () => {
    const m = { kcal: 2000, carboidratos_g: gramasPorPercentual(30, 4, 2000), gorduras_g: gramasPorPercentual(30, 9, 2000), proteinas_g: gramasPorPercentual(40, 4, 2000) };
    expect(m.carboidratos_g).toBe(150);
    expect(m.proteinas_g).toBe(200);
    expect(macrosExcedemCalorias(m)).toBe(false);
  });
  it("35% carbos, 30% gorduras e 40% proteínas excedem 100%", () => {
    expect(macrosExcedemCalorias({ kcal: 2000, carboidratos_g: gramasPorPercentual(35, 4, 2000), gorduras_g: gramasPorPercentual(30, 9, 2000), proteinas_g: gramasPorPercentual(40, 4, 2000) })).toBe(true);
  });
  it("300 g de gordura são 2700 kcal e excedem uma meta de 2000", () => {
    expect(totalMacros({ gorduras_g: 300 })).toBe(2700);
    expect(macrosExcedemCalorias({ kcal: 2000, gorduras_g: 300 })).toBe(true);
    expect(percentualMacro(300, 9, 2000)).toBe(135);
  });
  it("permite exatamente 100% em gramas", () => {
    expect(macrosExcedemCalorias({ kcal: 2000, carboidratos_g: 150, gorduras_g: 60, proteinas_g: 215 })).toBe(false);
  });
  it("a calculadora não excede o total ao arredondar", () => {
    const r = calcularMetas({ idade: 30, peso_kg: 70, altura_cm: 170, sexo: "feminino", atividade: "sedentario", objetivo: "manter" });
    expect(r).not.toBeNull();
    expect(macrosExcedemCalorias(r?.metas ?? {})).toBe(false);
  });
});