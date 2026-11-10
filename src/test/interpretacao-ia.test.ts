import { describe, expect, it } from "vitest";
import { converterInterpretacao, entradaInterpretacao, podeInterpretarIA, VERSAO_CONSENTIMENTO_IA } from "@/lib/interpretacao-ia";
const item = { alimento: "arroz", marca: null, quantidade: 150, unidade: "g", gramas: 150, refeicao: "Almoço" };
describe("interpretação por IA", () => {
  it("bloqueia IA sem autorização individual", () => {
    expect(podeInterpretarIA("2026-11-10T21:00:00Z", null)).toBe(false);
  });
  it("bloqueia IA após retirar consentimento de saúde", () => {
    expect(podeInterpretarIA(null, VERSAO_CONSENTIMENTO_IA)).toBe(false);
  });
  it("exige a versão atual e permite com ambas as autorizações", () => {
    expect(podeInterpretarIA("2026-11-10T21:00:00Z", "versao-antiga")).toBe(false);
    expect(podeInterpretarIA("2026-11-10T21:00:00Z", VERSAO_CONSENTIMENTO_IA)).toBe(true);
  });
  it("preserva alimento, quantidade e almoço", () => {
    expect(converterInterpretacao({ itens: [item] }, "Jantar")[0]).toMatchObject({ termo: "arroz", gramas: 150, refeicao: "Almoço" });
  });
  it("não transforma ne em alimento e preserva nêspera real", () => {
    expect(converterInterpretacao({ itens: [{ ...item, alimento: "né" }, { ...item, alimento: "nêspera" }] }, "Jantar").map(it => it.termo)).toEqual(["nespera"]);
  });
  it("preserva Ipanema separada do alimento", () => {
    expect(converterInterpretacao({ itens: [{ ...item, alimento: "queijo minas", marca: "Ipanema", quantidade: 30, gramas: 30 }] }, "Jantar")[0]).toMatchObject({ termo: "queijo minas marca ipanema", gramas: 30 });
  });
  it("normaliza leite integral para a busca padrão", () => {
    expect(converterInterpretacao({ itens: [{ ...item, alimento: "leite integral" }] }, "Jantar")[0]?.termo).toBe("leite");
  });
  it("não inventa quantidade ausente nem refeição personalizada", () => {
    expect(converterInterpretacao({ itens: [{ ...item, quantidade: null, unidade: null, gramas: null, refeicao: null }] }, "Ceia")[0]).toMatchObject({ gramas: null, refeicao: "Ceia" });
  });
  it("rejeita quantidades inválidas do modelo", () => {
    expect(() => converterInterpretacao({ itens: [{ ...item, quantidade: -10 }] }, "Jantar")).toThrow();
  });
  it("mantém a descrição limitada a 2000 caracteres", () => {
    expect(entradaInterpretacao.safeParse({ frase: "a".repeat(2001), refeicao: "Almoço" }).success).toBe(false);
  });
});