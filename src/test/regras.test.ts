import { describe, expect, it } from "vitest";
import { metasForaDoUsual, validarSenha } from "@/lib/config";

describe("regras do Bocada", () => {
  it("alerta calorias abaixo de 1200", () => {
    expect(metasForaDoUsual({ kcal: 1199 })).toEqual(["kcal"]);
  });
  it("alerta calorias acima de 4500", () => {
    expect(metasForaDoUsual({ kcal: 4501 })).toEqual(["kcal"]);
  });
  it("não alerta calorias entre 1200 e 4500", () => {
    expect(metasForaDoUsual({ kcal: 1200 })).toEqual([]);
    expect(metasForaDoUsual({ kcal: 4500 })).toEqual([]);
  });
  it("recusa senha com menos de 8 caracteres", () => {
    expect(validarSenha("abc1234")).not.toBeNull();
  });
  it("recusa senha comum", () => {
    expect(validarSenha("12345678")).not.toBeNull();
  });
  it("aceita senha razoável", () => {
    expect(validarSenha("feijao-com-arroz-77")).toBeNull();
  });
});
