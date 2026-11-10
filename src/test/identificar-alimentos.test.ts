import { describe, expect, it } from "vitest";
import { consultaAlimento, escolherAlimento, ordenarAlimentos, nutrientesDisponiveis, porcaoEstimada } from "@/lib/identificar-alimentos";
const alimento = (id: number, descricao: string) => ({ id, descricao, kcal: 60, proteina_g: 3, lipideos_g: 3, carboidrato_g: 5 });
describe("identificação local", () => {
  it("usa queijo Minas frescal genérico se Ipanema estiver ausente", () => {
    const resultado = escolherAlimento("queijo minas marca ipanema", [alimento(462, "Queijo, minas, meia cura"), alimento(461, "Queijo, minas, frescal")]);
    expect(resultado.escolhido?.id).toBe(461);
    expect(resultado.generico).toBe(true);
    expect(resultado.escolhido?.marca).toBeUndefined();
  });
  it("prefere os valores da marca quando estiver disponível", () => {
    const resultado = escolherAlimento("queijo minas marca ipanema", [alimento(461, "Queijo, minas, frescal"), { ...alimento(9, "Queijo minas"), marca: "Ipanema", fonte: "usda" }]);
    expect(resultado.escolhido?.id).toBe(9);
    expect(resultado.generico).toBe(false);
  });
  it("não substitui outras marcas ausentes automaticamente", () => {
    expect(escolherAlimento("iogurte marca ipanema", [alimento(1, "Iogurte")]).escolhido).toBeUndefined();
  });
  it("prioriza leite integral sobre leite de coco", () => {
    expect(ordenarAlimentos("leite", [alimento(523, "Leite, de coco"), alimento(458, "Leite, de vaca, integral")])[0]?.id).toBe(458);
  });
  it("prefere café pronto e não pó", () => {
    expect(ordenarAlimentos("café", [alimento(511, "Café, pó, torrado"), alimento(471, "Café, infusão 10%")])[0]?.id).toBe(471);
  });
  it("prefere cuscuz de milho cozido", () => {
    expect(ordenarAlimentos("cuscuz", [alimento(534, "Cuscuz, paulista"), alimento(533, "Cuscuz, de milho, cozido com sal")])[0]?.id).toBe(533);
  });
  it("busca e prioriza a marca Ipanema sem incorporá-la ao nome genérico", () => {
    expect(consultaAlimento("queijo minas marca ipanema")).toEqual({ alimento: "queijo minas", marca: "ipanema" });
    expect(ordenarAlimentos("queijo minas marca ipanema", [alimento(461, "Queijo, minas, frescal"), { ...alimento(9, "Queijo minas"), marca: "Ipanema" }])[0]?.id).toBe(9);
  });
  it("não trata nutrientes ausentes como zero", () => {
    expect(nutrientesDisponiveis({ ...alimento(458, "Leite"), kcal: null })).toBe(false);
  });
  it("reconhece Traquinas como marca mesmo sem a palavra marca, na grafia do rótulo", () => {
    expect(consultaAlimento("bolacha traquinas")).toEqual({ alimento: "bolacha", marca: "trakinas" });
    expect(consultaAlimento("traquinas")).toEqual({ alimento: "", marca: "trakinas" });
    expect(consultaAlimento("biscoito marca traquinas")).toEqual({ alimento: "biscoito", marca: "trakinas" });
  });
  it("estima açúcar separadamente em 5 g, nunca 100 g", () => {
    expect(porcaoEstimada("açúcar")).toBe(5);
  });
});