import { describe, expect, it } from "vitest";
import { calcularNutrientes, dividirItens, interpretarItem } from "@/lib/diario";
import { limitesEfetivos, metasForaDoUsual } from "@/lib/config";

describe("diário", () => {
  it("divide a fala em itens", () => {
    expect(dividirItens("150 gramas de arroz, feijão e uma banana")).toEqual(["150 gramas de arroz", "feijao", "uma banana"]);
  });
  it("extrai gramas e termo", () => {
    expect(interpretarItem("150 gramas de arroz")).toEqual({ termo: "arroz", gramas: 150 });
    expect(interpretarItem("uma banana")).toEqual({ termo: "banana", gramas: null });
  });
  it("calcula nutrientes proporcionais aos gramas", () => {
    const a = { id: 1, descricao: "x", kcal: 128, proteina_g: 2.5, lipideos_g: 0.2, carboidrato_g: 28 };
    expect(calcularNutrientes(a, 150).kcal).toBe(192);
  });
  it("usa limites personalizados de proteína", () => {
    const l = limitesEfetivos({ proteinas_g: { min: 100, max: 150 } });
    expect(metasForaDoUsual({ proteinas_g: 90 }, l)).toEqual(["proteinas_g"]);
  });
  it("não permite alterar o limite de calorias", () => {
    expect(limitesEfetivos({ kcal: { min: 500, max: 900 } }).kcal).toEqual({ min: 1200, max: 4500 });
  });
});
