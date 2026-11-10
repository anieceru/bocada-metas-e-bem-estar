import { describe, it, expect } from "vitest";
import { diasSemana, ajustarDia, validarRefeicoes, dataValida, REFEICOES_PADRAO } from "@/lib/calendario";

describe("refeições e calendário", () => {
  it("oferece as quatro refeições pedidas", () => {
    expect(REFEICOES_PADRAO).toEqual(["Café da manhã", "Almoço", "Jantar", "Lanches"]);
  });
  it("permite menos ou mais refeições", () => {
    expect(validarRefeicoes(["Almoço"])).toBe(true);
    expect(validarRefeicoes([...REFEICOES_PADRAO, "Ceia"])).toBe(true);
    expect(validarRefeicoes([])).toBe(false);
    expect(validarRefeicoes(["Almoço", "almoço"])).toBe(false);
  });
  it("mostra a semana e permite voltar ao dia anterior", () => {
    expect(diasSemana("2026-11-10")).toEqual(["2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12", "2026-11-13", "2026-11-14", "2026-11-15"]);
    expect(ajustarDia("2026-11-01", -1)).toBe("2026-10-31");
  });
  it("rejeita dias inexistentes", () => {
    expect(dataValida("2026-02-30")).toBe(false);
    expect(dataValida("2026-11-10")).toBe(true);
  });
});