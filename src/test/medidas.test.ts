import { describe, expect, it } from "vitest";
import { interpretarFrase, refeicaoPorHorario } from "@/lib/diario";
import { consultaAlimento, medidasAlimento } from "@/lib/identificar-alimentos";
import { converterInterpretacao } from "@/lib/interpretacao-ia";

describe("unidades e medidas", () => {
  it("dois pães = 2 unidades de pão, sem mudar a refeição escolhida", () => {
    const [p] = interpretarFrase("comi dois pães", "Jantar");
    expect(p).toMatchObject({ termo: "pao", unidades: 2, medida: "unidade", refeicao: "Jantar" });
  });
  it("duas bandas de pão no jantar = 2 bandas de 25 g", () => {
    const [p] = interpretarFrase("no jantar comi duas bandas de pão", "Almoço");
    expect(p).toMatchObject({ termo: "pao", unidades: 2, medida: "banda", refeicao: "Jantar" });
    expect(medidasAlimento("pao").find(m => m.id === "banda")?.gramas).toBe(25);
  });
  it("banana tem tamanhos", () => {
    const [p] = interpretarFrase("uma banana média", "Lanches");
    expect(p).toMatchObject({ termo: "banana", medida: "media" });
    expect(medidasAlimento("banana").map(m => m.id)).toEqual(["pequena", "media", "grande", "unidade"]);
  });
  it("Sonho de Valsa é reconhecido como marca", () => {
    expect(consultaAlimento("bombom sonho de valsa")).toEqual({ alimento: "bombom", marca: "sonho de valsa" });
  });
  it("IA não escolhe refeição que a pessoa não disse", () => {
    const itens = converterInterpretacao({ itens: [{ alimento: "pão", marca: null, quantidade: 2, unidade: "unidade", gramas: 100, refeicao: "Almoço" }] }, "Jantar", "comi dois pães");
    expect(itens[0]?.refeicao).toBe("Jantar");
  });
  it("refeição pelo horário", () => {
    expect(refeicaoPorHorario(["Café da manhã", "Almoço", "Jantar", "Lanches"], new Date(2026, 0, 1, 21))).toBe("Jantar");
  });
});
